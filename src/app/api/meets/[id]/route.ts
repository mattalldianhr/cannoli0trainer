import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const meet = await prisma.competitionMeet.findUnique({
      where: { id },
      include: {
        coach: { select: { id: true, name: true } },
        entries: {
          include: {
            athlete: { select: { id: true, name: true, weightClass: true, bodyweight: true } },
          },
          orderBy: { athlete: { name: 'asc' } },
        },
      },
    });

    if (!meet) {
      return NextResponse.json(
        { error: 'Meet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(meet);
  } catch (error) {
    console.error('Failed to fetch meet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meet' },
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

    const existing = await prisma.competitionMeet.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Meet not found' },
        { status: 404 }
      );
    }

    const meet = await prisma.competitionMeet.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.date !== undefined && { date: new Date(body.date) }),
        ...(body.federation !== undefined && { federation: body.federation }),
        ...(body.location !== undefined && { location: body.location }),
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

    return NextResponse.json(meet);
  } catch (error) {
    console.error('Failed to update meet:', error);
    return NextResponse.json(
      { error: 'Failed to update meet' },
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

    const existing = await prisma.competitionMeet.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Meet not found' },
        { status: 404 }
      );
    }

    await prisma.competitionMeet.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete meet:', error);
    return NextResponse.json(
      { error: 'Failed to delete meet' },
      { status: 500 }
    );
  }
}
