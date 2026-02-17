import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.generatedAt || !body.trainerProfile || !body.sections || !body.rawAnswers) {
      return NextResponse.json(
        { error: 'Missing required fields: generatedAt, trainerProfile, sections, rawAnswers' },
        { status: 400 }
      );
    }

    const submission = await prisma.submission.create({
      data: {
        generatedAt: new Date(body.generatedAt),
        trainerProfile: body.trainerProfile,
        sections: body.sections,
        rawAnswers: body.rawAnswers,
      },
    });

    return NextResponse.json({ id: submission.id }, { status: 201 });
  } catch (error) {
    console.error('Failed to create submission:', error);
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const submissions = await prisma.submission.findMany({
      select: {
        id: true,
        generatedAt: true,
        trainerProfile: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Failed to fetch submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
