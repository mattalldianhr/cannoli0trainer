import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSchedule, type WorkoutInput } from '@/lib/scheduling/generate-schedule';
import { persistSchedule } from '@/lib/scheduling/persist-schedule';
import { detectConflicts, type ConflictingSession } from '@/lib/scheduling/detect-conflicts';
import { deactivateAssignment, deleteAssignment } from '@/lib/scheduling/cleanup-assignment';
import { notifyProgramAssignment } from '@/lib/notifications';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;
    const body = await request.json();

    // Validate request body — support both multi-athlete and single-athlete
    const { athleteIds, athleteId, startDate, endDate, trainingDays, force } = body;
    const resolvedAthleteIds: string[] = athleteIds
      ?? (athleteId ? [athleteId] : null);

    if (!Array.isArray(resolvedAthleteIds) || resolvedAthleteIds.length === 0) {
      return NextResponse.json(
        { error: 'athleteIds (array) or athleteId (string) is required' },
        { status: 400 }
      );
    }

    // Validate trainingDays if provided
    if (trainingDays !== undefined) {
      if (
        !Array.isArray(trainingDays) ||
        trainingDays.length === 0 ||
        !trainingDays.every((d: unknown) => typeof d === 'number' && d >= 0 && d <= 6)
      ) {
        return NextResponse.json(
          { error: 'trainingDays must be a non-empty array of integers 0-6 (0=Sunday, 1=Monday, ..., 6=Saturday)' },
          { status: 400 }
        );
      }
    }

    // Verify program exists and fetch its workouts for scheduling
    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        workouts: {
          select: { id: true, weekNumber: true, dayNumber: true, name: true },
          orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
        },
      },
    });
    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    // Verify all athletes exist (include email+name for notifications)
    const athletes = await prisma.athlete.findMany({
      where: { id: { in: resolvedAthleteIds } },
      select: { id: true, email: true, name: true },
    });
    const foundIds = new Set(athletes.map((a) => a.id));
    const missingIds = resolvedAthleteIds.filter((id: string) => !foundIds.has(id));
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: `Athletes not found: ${missingIds.join(', ')}` },
        { status: 404 }
      );
    }

    // Resolve training days — use provided or default
    const resolvedTrainingDays = trainingDays ?? [1, 2, 4, 5];

    // Create assignments, skipping duplicates (unique constraint on programId+athleteId)
    const assignments = await prisma.$transaction(
      resolvedAthleteIds.map((aid: string) =>
        prisma.programAssignment.upsert({
          where: {
            programId_athleteId: { programId, athleteId: aid },
          },
          update: {
            ...(startDate !== undefined && {
              startDate: startDate ? new Date(startDate) : null,
            }),
            ...(endDate !== undefined && {
              endDate: endDate ? new Date(endDate) : null,
            }),
            trainingDays: resolvedTrainingDays,
            isActive: true,
          },
          create: {
            programId,
            athleteId: aid,
            ...(startDate && { startDate: new Date(startDate) }),
            ...(endDate && { endDate: new Date(endDate) }),
            trainingDays: resolvedTrainingDays,
          },
          include: {
            athlete: { select: { id: true, name: true } },
          },
        })
      )
    );

    // Generate and persist workout schedules if startDate is provided
    let schedulingResults: {
      athleteId: string;
      athleteName: string;
      created: number;
      skipped: number;
      total: number;
    }[] = [];

    if (startDate && program.workouts.length > 0) {
      const workoutInputs: WorkoutInput[] = program.workouts.map((w) => ({
        id: w.id,
        weekNumber: w.weekNumber,
        dayNumber: w.dayNumber,
        name: w.name,
      }));

      const parsedStartDate = new Date(startDate);

      // Check for conflicts before persisting (unless force=true)
      if (!force) {
        const allConflicts: {
          athleteId: string;
          athleteName: string;
          conflicts: ConflictingSession[];
        }[] = [];

        for (const assignment of assignments) {
          const schedule = generateSchedule(
            workoutInputs,
            parsedStartDate,
            resolvedTrainingDays
          );

          const result = await detectConflicts(
            assignment.athleteId,
            schedule,
            assignment.id
          );

          if (result.hasConflicts) {
            allConflicts.push({
              athleteId: assignment.athleteId,
              athleteName: assignment.athlete.name,
              conflicts: result.conflicts,
            });
          }
        }

        if (allConflicts.length > 0) {
          return NextResponse.json({
            error: 'Scheduling conflicts detected',
            message: 'Some athletes already have workouts on the scheduled dates. Set force=true to overwrite.',
            programId,
            assignments,
            count: assignments.length,
            conflicts: allConflicts.map((c) => ({
              athleteId: c.athleteId,
              athleteName: c.athleteName,
              conflictCount: c.conflicts.length,
              dates: c.conflicts.map((cf) => ({
                date: cf.date.toISOString().split('T')[0],
                existingTitle: cf.existingTitle,
                existingStatus: cf.existingStatus,
                newTitle: cf.newTitle,
              })),
            })),
          }, { status: 409 });
        }
      }

      // No conflicts (or force=true) — persist the schedule
      schedulingResults = await Promise.all(
        assignments.map(async (assignment) => {
          const schedule = generateSchedule(
            workoutInputs,
            parsedStartDate,
            resolvedTrainingDays
          );

          const result = await persistSchedule({
            athleteId: assignment.athleteId,
            programId,
            programAssignmentId: assignment.id,
            schedule,
          });

          return {
            athleteId: assignment.athleteId,
            athleteName: assignment.athlete.name,
            ...result,
          };
        })
      );
    }

    const totalSessionsCreated = schedulingResults.reduce((sum, r) => sum + r.created, 0);

    // Fire-and-forget: send email notifications to assigned athletes
    for (const athlete of athletes) {
      if (athlete.email) {
        notifyProgramAssignment({
          athleteEmail: athlete.email,
          athleteName: athlete.name,
          programName: program.name,
          startDate: startDate ?? null,
        }).catch(() => {}); // already logged internally
      }
    }

    return NextResponse.json({
      programId,
      assignments,
      count: assignments.length,
      scheduling: {
        sessionsCreated: totalSessionsCreated,
        details: schedulingResults,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to assign program:', error);
    return NextResponse.json(
      { error: 'Failed to assign program' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/programs/[id]/assign
 *
 * Remove a program assignment for an athlete. Deletes future NOT_STARTED
 * WorkoutSessions. Preserves PARTIALLY_COMPLETED and FULLY_COMPLETED sessions.
 *
 * Body: { athleteId: string, mode?: 'deactivate' | 'delete' }
 * - mode 'deactivate' (default): sets isActive=false, keeps the assignment record
 * - mode 'delete': removes the assignment record entirely
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;
    const body = await request.json();
    const { athleteId, mode = 'deactivate' } = body;

    if (!athleteId) {
      return NextResponse.json(
        { error: 'athleteId is required' },
        { status: 400 }
      );
    }

    // Find the assignment
    const assignment = await prisma.programAssignment.findUnique({
      where: {
        programId_athleteId: { programId, athleteId },
      },
      include: {
        athlete: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found for this program and athlete' },
        { status: 404 }
      );
    }

    if (mode === 'delete') {
      const cleanup = await deleteAssignment(assignment.id);
      return NextResponse.json({
        programId,
        athleteId,
        athleteName: assignment.athlete.name,
        programName: assignment.program.name,
        mode: 'delete',
        cleanup,
      });
    }

    // Default: deactivate
    const result = await deactivateAssignment(assignment.id);
    return NextResponse.json({
      programId,
      athleteId,
      athleteName: result.assignment.athlete.name,
      programName: result.assignment.program.name,
      mode: 'deactivate',
      assignment: result.assignment,
      cleanup: result.cleanup,
    });
  } catch (error) {
    console.error('Failed to unassign program:', error);
    return NextResponse.json(
      { error: 'Failed to unassign program' },
      { status: 500 }
    );
  }
}
