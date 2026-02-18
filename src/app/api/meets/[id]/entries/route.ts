import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetId } = await params;
    const body = await request.json();

    if (!body.athleteId) {
      return NextResponse.json(
        { error: 'Missing required field: athleteId' },
        { status: 400 }
      );
    }

    const meet = await prisma.competitionMeet.findUnique({ where: { id: meetId } });
    if (!meet) {
      return NextResponse.json({ error: 'Meet not found' }, { status: 404 });
    }

    const athlete = await prisma.athlete.findUnique({ where: { id: body.athleteId } });
    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    const existing = await prisma.meetEntry.findFirst({
      where: { meetId, athleteId: body.athleteId },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Athlete already added to this meet' },
        { status: 409 }
      );
    }

    const entry = await prisma.meetEntry.create({
      data: {
        meetId,
        athleteId: body.athleteId,
        weightClass: body.weightClass ?? null,
        notes: body.notes ?? null,
      },
      include: {
        athlete: { select: { id: true, name: true, weightClass: true, bodyweight: true } },
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Failed to add meet entry:', error);
    return NextResponse.json(
      { error: 'Failed to add meet entry' },
      { status: 500 }
    );
  }
}
