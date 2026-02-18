import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';

export async function GET() {
  try {
    const coachId = await getCurrentCoachId();

    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
      select: {
        id: true,
        name: true,
        email: true,
        brandName: true,
        defaultWeightUnit: true,
        timezone: true,
        defaultRestTimerSeconds: true,
        notificationPreferences: true,
      },
    });

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    return NextResponse.json(coach);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const coachId = await getCurrentCoachId();
    const body = await request.json();

    // Validate weight unit
    if (body.defaultWeightUnit && !['kg', 'lbs'].includes(body.defaultWeightUnit)) {
      return NextResponse.json(
        { error: 'Invalid weight unit. Must be "kg" or "lbs".' },
        { status: 400 }
      );
    }

    // Validate rest timer
    if (body.defaultRestTimerSeconds !== undefined) {
      const seconds = Number(body.defaultRestTimerSeconds);
      if (isNaN(seconds) || seconds < 0 || seconds > 600) {
        return NextResponse.json(
          { error: 'Rest timer must be between 0 and 600 seconds.' },
          { status: 400 }
        );
      }
    }

    // Validate name is non-empty if provided
    if (body.name !== undefined && !body.name?.trim()) {
      return NextResponse.json(
        { error: 'Name cannot be empty.' },
        { status: 400 }
      );
    }

    const coach = await prisma.coach.update({
      where: { id: coachId },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.email !== undefined && { email: body.email.trim() }),
        ...(body.brandName !== undefined && { brandName: body.brandName?.trim() || null }),
        ...(body.defaultWeightUnit !== undefined && { defaultWeightUnit: body.defaultWeightUnit }),
        ...(body.timezone !== undefined && { timezone: body.timezone }),
        ...(body.defaultRestTimerSeconds !== undefined && {
          defaultRestTimerSeconds: Number(body.defaultRestTimerSeconds),
        }),
        ...(body.notificationPreferences !== undefined && {
          notificationPreferences: body.notificationPreferences,
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        brandName: true,
        defaultWeightUnit: true,
        timezone: true,
        defaultRestTimerSeconds: true,
        notificationPreferences: true,
      },
    });

    return NextResponse.json(coach);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
