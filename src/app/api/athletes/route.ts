import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';

export async function POST(request: Request) {
  try {
    const coachId = await getCurrentCoachId();
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    const athlete = await prisma.athlete.create({
      data: {
        coachId,
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
    const coachId = await getCurrentCoachId();
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search');
    const isCompetitor = searchParams.get('isCompetitor');
    const isRemote = searchParams.get('isRemote');
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = { coachId };

    // Default to active athletes unless explicitly requesting archived
    if (isActive === 'false') {
      where.isActive = false;
    } else if (isActive !== 'all') {
      where.isActive = true;
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
