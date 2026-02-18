import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id: meetId, entryId } = await params;
    const body = await request.json();

    const entry = await prisma.meetEntry.findFirst({
      where: { id: entryId, meetId },
    });
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const updated = await prisma.meetEntry.update({
      where: { id: entryId },
      data: {
        ...(body.weightClass !== undefined && { weightClass: body.weightClass }),
        ...(body.squat1 !== undefined && { squat1: body.squat1 }),
        ...(body.squat2 !== undefined && { squat2: body.squat2 }),
        ...(body.squat3 !== undefined && { squat3: body.squat3 }),
        ...(body.bench1 !== undefined && { bench1: body.bench1 }),
        ...(body.bench2 !== undefined && { bench2: body.bench2 }),
        ...(body.bench3 !== undefined && { bench3: body.bench3 }),
        ...(body.deadlift1 !== undefined && { deadlift1: body.deadlift1 }),
        ...(body.deadlift2 !== undefined && { deadlift2: body.deadlift2 }),
        ...(body.deadlift3 !== undefined && { deadlift3: body.deadlift3 }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.attemptResults !== undefined && { attemptResults: body.attemptResults }),
      },
      include: {
        athlete: { select: { id: true, name: true, weightClass: true, bodyweight: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update entry:', error);
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id: meetId, entryId } = await params;

    const entry = await prisma.meetEntry.findFirst({
      where: { id: entryId, meetId },
    });
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    await prisma.meetEntry.delete({ where: { id: entryId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
}
