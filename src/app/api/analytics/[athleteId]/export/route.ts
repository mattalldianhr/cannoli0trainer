import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/analytics/[athleteId]/export
 *
 * Generates a CSV download of an athlete's training data.
 * Columns: Date, Exercise, Set, Reps, Weight (kg), RPE, RIR, Velocity, Notes
 *
 * Query params:
 * - from: ISO date string (start of range)
 * - to: ISO date string (end of range)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ athleteId: string }> }
) {
  try {
    const { athleteId } = await params;
    const { searchParams } = request.nextUrl;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { id: true, name: true },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const setLogs = await prisma.setLog.findMany({
      where: {
        athleteId,
        ...(from || to ? { completedAt: dateFilter } : {}),
      },
      select: {
        setNumber: true,
        reps: true,
        weight: true,
        unit: true,
        rpe: true,
        rir: true,
        velocity: true,
        notes: true,
        completedAt: true,
        workoutExercise: {
          select: {
            exercise: { select: { name: true } },
          },
        },
      },
      orderBy: [{ completedAt: 'asc' }, { setNumber: 'asc' }],
    });

    const header = 'Date,Exercise,Set,Reps,Weight,Unit,RPE,RIR,Velocity,Notes';
    const rows = setLogs.map((s) => {
      const date = s.completedAt.toISOString().split('T')[0];
      const exercise = csvEscape(s.workoutExercise.exercise.name);
      const rpe = s.rpe !== null ? String(s.rpe) : '';
      const rir = s.rir !== null ? String(s.rir) : '';
      const velocity = s.velocity !== null ? String(s.velocity) : '';
      const notes = s.notes ? csvEscape(s.notes) : '';
      return `${date},${exercise},${s.setNumber},${s.reps},${s.weight},${s.unit},${rpe},${rir},${velocity},${notes}`;
    });

    const csv = [header, ...rows].join('\n');
    const safeName = athlete.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${safeName}_training_data.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to export CSV:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
