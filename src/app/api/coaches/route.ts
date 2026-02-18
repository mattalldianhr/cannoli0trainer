import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email' },
        { status: 400 }
      );
    }

    const existing = await prisma.coach.findUnique({
      where: { email: body.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A coach with this email already exists' },
        { status: 409 }
      );
    }

    const coach = await prisma.coach.create({
      data: {
        name: body.name,
        email: body.email,
        brandName: body.brandName ?? null,
      },
    });

    return NextResponse.json(coach, { status: 201 });
  } catch (error) {
    console.error('Failed to create coach:', error);
    return NextResponse.json(
      { error: 'Failed to create coach' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const coaches = await prisma.coach.findMany({
      include: {
        _count: {
          select: {
            athletes: true,
            programs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(coaches);
  } catch (error) {
    console.error('Failed to fetch coaches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coaches' },
      { status: 500 }
    );
  }
}
