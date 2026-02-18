import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.coachId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, coachId' },
        { status: 400 }
      );
    }

    const coach = await prisma.coach.findUnique({
      where: { id: body.coachId },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    const athlete = await prisma.athlete.create({
      data: {
        coachId: body.coachId,
        name: body.name,
        email: body.email ?? null,
        bodyweight: body.bodyweight ?? null,
        weightClass: body.weightClass ?? null,
        experienceLevel: body.experienceLevel ?? 'intermediate',
        isRemote: body.isRemote ?? true,
        isCompetitor: body.isCompetitor ?? false,
        federation: body.federation ?? null,
        notes: body.notes ?? null,
        metadata: body.metadata ?? null,
      },
    });

    return NextResponse.json(athlete, { status: 201 });
  } catch (error) {
    console.error('Failed to create athlete:', error);
    return NextResponse.json(
      { error: 'Failed to create athlete' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search');
    const coachId = searchParams.get('coachId');
    const isCompetitor = searchParams.get('isCompetitor');
    const isRemote = searchParams.get('isRemote');

    const where: Record<string, unknown> = {};

    if (coachId) {
      where.coachId = coachId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isCompetitor !== null && isCompetitor !== undefined) {
      where.isCompetitor = isCompetitor === 'true';
    }

    if (isRemote !== null && isRemote !== undefined) {
      where.isRemote = isRemote === 'true';
    }

    const athletes = await prisma.athlete.findMany({
      where,
      include: {
        _count: {
          select: {
            setLogs: true,
            workoutSessions: true,
            programAssignments: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(athletes);
  } catch (error) {
    console.error('Failed to fetch athletes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch athletes' },
      { status: 500 }
    );
  }
}
