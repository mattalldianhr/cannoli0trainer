import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;
    const body = await request.json();

    // Validate request body
    const { athleteIds, startDate, endDate } = body;
    if (!Array.isArray(athleteIds) || athleteIds.length === 0) {
      return NextResponse.json(
        { error: 'athleteIds must be a non-empty array of athlete IDs' },
        { status: 400 }
      );
    }

    // Verify program exists
    const program = await prisma.program.findUnique({
      where: { id: programId },
    });
    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    // Verify all athletes exist
    const athletes = await prisma.athlete.findMany({
      where: { id: { in: athleteIds } },
      select: { id: true },
    });
    const foundIds = new Set(athletes.map((a) => a.id));
    const missingIds = athleteIds.filter((id: string) => !foundIds.has(id));
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: `Athletes not found: ${missingIds.join(', ')}` },
        { status: 404 }
      );
    }

    // Create assignments, skipping duplicates (unique constraint on programId+athleteId)
    const assignments = await prisma.$transaction(
      athleteIds.map((athleteId: string) =>
        prisma.programAssignment.upsert({
          where: {
            programId_athleteId: { programId, athleteId },
          },
          update: {
            ...(startDate !== undefined && {
              startDate: startDate ? new Date(startDate) : null,
            }),
            ...(endDate !== undefined && {
              endDate: endDate ? new Date(endDate) : null,
            }),
          },
          create: {
            programId,
            athleteId,
            ...(startDate && { startDate: new Date(startDate) }),
            ...(endDate && { endDate: new Date(endDate) }),
          },
          include: {
            athlete: { select: { id: true, name: true } },
          },
        })
      )
    );

    return NextResponse.json({
      programId,
      assignments,
      count: assignments.length,
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to assign program:', error);
    return NextResponse.json(
      { error: 'Failed to assign program' },
      { status: 500 }
    );
  }
}
