import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';

export async function POST(request: Request) {
  try {
    const coachId = await getCurrentCoachId();
    const body = await request.json();

    if (!body.name || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category' },
        { status: 400 }
      );
    }

    const exercise = await prisma.exercise.create({
      data: {
        coachId,
        name: body.name,
        category: body.category,
        force: body.force ?? null,
        level: body.level ?? null,
        mechanic: body.mechanic ?? null,
        equipment: body.equipment ?? null,
        primaryMuscles: body.primaryMuscles ?? [],
        secondaryMuscles: body.secondaryMuscles ?? [],
        instructions: body.instructions ?? [],
        images: body.images ?? [],
        videoUrl: body.videoUrl ?? null,
        cues: body.cues ?? null,
        tags: body.tags ?? [],
      },
    });

    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    console.error('Failed to create exercise:', error);
    return NextResponse.json(
      { error: 'Failed to create exercise' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const coachId = await getCurrentCoachId();
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Include global exercises (coachId=null) and coach-specific exercises
    const where: Record<string, unknown> = {
      OR: [{ coachId: null }, { coachId }],
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (tag) {
      where.tags = { array_contains: [tag] };
    }

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: { name: 'asc' },
      ...(limit ? { take: parseInt(limit, 10) } : {}),
      ...(offset ? { skip: parseInt(offset, 10) } : {}),
    });

    return NextResponse.json(exercises);
  } catch (error) {
    console.error('Failed to fetch exercises:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
}
