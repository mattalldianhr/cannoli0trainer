import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentCoachId } from '@/lib/coach';

const settingsUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').optional(),
  email: z.string().trim().email('Invalid email address').optional(),
  brandName: z.string().trim().nullable().optional(),
  defaultWeightUnit: z.enum(['kg', 'lbs']).optional(),
  timezone: z.string().optional(),
  defaultRestTimerSeconds: z
    .number()
    .int()
    .min(0, 'Rest timer must be at least 0 seconds')
    .max(600, 'Rest timer must be at most 600 seconds')
    .optional(),
  notificationPreferences: z
    .object({
      emailOnWorkoutComplete: z.boolean(),
      emailOnCheckIn: z.boolean(),
    })
    .optional(),
});

const coachSelect = {
  id: true,
  name: true,
  email: true,
  brandName: true,
  defaultWeightUnit: true,
  timezone: true,
  defaultRestTimerSeconds: true,
  notificationPreferences: true,
} as const;

export async function GET() {
  try {
    const coachId = await getCurrentCoachId();

    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
      select: coachSelect,
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

    const result = settingsUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    const coach = await prisma.coach.update({
      where: { id: coachId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.brandName !== undefined && { brandName: data.brandName || null }),
        ...(data.defaultWeightUnit !== undefined && { defaultWeightUnit: data.defaultWeightUnit }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.defaultRestTimerSeconds !== undefined && {
          defaultRestTimerSeconds: data.defaultRestTimerSeconds,
        }),
        ...(data.notificationPreferences !== undefined && {
          notificationPreferences: data.notificationPreferences,
        }),
      },
      select: coachSelect,
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
