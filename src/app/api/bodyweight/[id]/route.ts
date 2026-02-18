import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const log = await prisma.bodyweightLog.findUnique({
      where: { id },
      include: { athlete: true },
    });

    if (!log) {
      return NextResponse.json(
        { error: 'Bodyweight log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error('Failed to fetch bodyweight log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bodyweight log' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.bodyweightLog.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Bodyweight log not found' },
        { status: 404 }
      );
    }

    const log = await prisma.bodyweightLog.update({
      where: { id },
      data: {
        ...(body.weight != null && { weight: body.weight }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.loggedAt !== undefined && { loggedAt: new Date(body.loggedAt) }),
      },
      include: { athlete: true },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error('Failed to update bodyweight log:', error);
    return NextResponse.json(
      { error: 'Failed to update bodyweight log' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.bodyweightLog.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Bodyweight log not found' },
        { status: 404 }
      );
    }

    await prisma.bodyweightLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete bodyweight log:', error);
    return NextResponse.json(
      { error: 'Failed to delete bodyweight log' },
      { status: 500 }
    );
  }
}
