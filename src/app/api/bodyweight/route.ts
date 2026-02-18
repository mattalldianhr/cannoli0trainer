import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.athleteId || body.weight == null) {
      return NextResponse.json(
        { error: 'Missing required fields: athleteId, weight' },
        { status: 400 }
      );
    }

    const athlete = await prisma.athlete.findUnique({
      where: { id: body.athleteId },
    });

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      );
    }

    const log = await prisma.bodyweightLog.create({
      data: {
        athleteId: body.athleteId,
        weight: body.weight,
        unit: body.unit ?? 'lbs',
        loggedAt: body.loggedAt ? new Date(body.loggedAt) : new Date(),
      },
      include: { athlete: true },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Failed to create bodyweight log:', error);
    return NextResponse.json(
      { error: 'Failed to create bodyweight log' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const athleteId = searchParams.get('athleteId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Missing required query param: athleteId' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { athleteId };

    if (from || to) {
      const loggedAt: Record<string, Date> = {};
      if (from) loggedAt.gte = new Date(from);
      if (to) loggedAt.lte = new Date(to);
      where.loggedAt = loggedAt;
    }

    const logs = await prisma.bodyweightLog.findMany({
      where,
      orderBy: { loggedAt: 'desc' },
      ...(limit ? { take: parseInt(limit, 10) } : {}),
      ...(offset ? { skip: parseInt(offset, 10) } : {}),
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to fetch bodyweight logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bodyweight logs' },
      { status: 500 }
    );
  }
}
