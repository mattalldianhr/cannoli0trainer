import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCoachId, getCoachTimezone } from '@/lib/coach';
import { parseDateForPrisma, todayDateInTimezone } from '@/lib/date-utils';

export async function POST(request: Request) {
  try {
    const coachId = await getCurrentCoachId();
    const body = await request.json();

    if (!body.name || !body.date) {
      return NextResponse.json(
        { error: 'Missing required fields: name, date' },
        { status: 400 }
      );
    }

    const meet = await prisma.competitionMeet.create({
      data: {
        coachId,
        name: body.name,
        date: parseDateForPrisma(body.date),
        federation: body.federation ?? null,
        location: body.location ?? null,
        entries: body.entries
          ? {
              create: body.entries.map(
                (e: {
                  athleteId: string;
                  weightClass?: string;
                  squat1?: number;
                  squat2?: number;
                  squat3?: number;
                  bench1?: number;
                  bench2?: number;
                  bench3?: number;
                  deadlift1?: number;
                  deadlift2?: number;
                  deadlift3?: number;
                  openers?: Record<string, unknown>;
                  warmupPlan?: Record<string, unknown>;
                  notes?: string;
                }) => ({
                  athleteId: e.athleteId,
                  weightClass: e.weightClass ?? null,
                  squat1: e.squat1 ?? null,
                  squat2: e.squat2 ?? null,
                  squat3: e.squat3 ?? null,
                  bench1: e.bench1 ?? null,
                  bench2: e.bench2 ?? null,
                  bench3: e.bench3 ?? null,
                  deadlift1: e.deadlift1 ?? null,
                  deadlift2: e.deadlift2 ?? null,
                  deadlift3: e.deadlift3 ?? null,
                  openers: e.openers ?? null,
                  warmupPlan: e.warmupPlan ?? null,
                  notes: e.notes ?? null,
                })
              ),
            }
          : undefined,
      },
      include: {
        entries: {
          include: {
            athlete: { select: { id: true, name: true, weightClass: true } },
          },
        },
        _count: { select: { entries: true } },
      },
    });

    return NextResponse.json(meet, { status: 201 });
  } catch (error) {
    console.error('Failed to create meet:', error);
    return NextResponse.json(
      { error: 'Failed to create meet' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const coachId = await getCurrentCoachId();
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search');
    const upcoming = searchParams.get('upcoming');

    const where: Record<string, unknown> = { coachId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { federation: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (upcoming === 'true') {
      const tz = await getCoachTimezone(coachId);
      where.date = { gte: todayDateInTimezone(tz) };
    }

    const meets = await prisma.competitionMeet.findMany({
      where,
      include: {
        coach: { select: { id: true, name: true } },
        _count: { select: { entries: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(meets);
  } catch (error) {
    console.error('Failed to fetch meets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meets' },
      { status: 500 }
    );
  }
}
