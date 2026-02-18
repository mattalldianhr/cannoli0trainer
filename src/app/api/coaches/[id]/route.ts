import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const coach = await prisma.coach.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            athletes: true,
            programs: true,
            exercises: true,
            meets: true,
          },
        },
      },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(coach);
  } catch (error) {
    console.error('Failed to fetch coach:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coach' },
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

    const existing = await prisma.coach.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    if (body.email && body.email !== existing.email) {
      const emailTaken = await prisma.coach.findUnique({
        where: { email: body.email },
      });
      if (emailTaken) {
        return NextResponse.json(
          { error: 'A coach with this email already exists' },
          { status: 409 }
        );
      }
    }

    const coach = await prisma.coach.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.brandName !== undefined && { brandName: body.brandName }),
      },
    });

    return NextResponse.json(coach);
  } catch (error) {
    console.error('Failed to update coach:', error);
    return NextResponse.json(
      { error: 'Failed to update coach' },
      { status: 500 }
    );
  }
}
