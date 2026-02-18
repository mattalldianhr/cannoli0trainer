import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Container } from '@/components/layout/Container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Dumbbell, Plus } from 'lucide-react';
import { PRESCRIPTION_TYPE_LABELS } from '@/lib/programs/types';
import type { PrescriptionType } from '@prisma/client';
import { AssignAthletes } from '@/components/programs/AssignAthletes';
import { SaveAsTemplate } from '@/components/programs/SaveAsTemplate';
import { ProgramOverview } from '@/components/programs/ProgramOverview';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const program = await prisma.program.findUnique({
    where: { id },
    select: { name: true },
  });

  return {
    title: program ? `${program.name} | Cannoli Trainer` : 'Program | Cannoli Trainer',
  };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      workouts: {
        include: {
          exercises: {
            include: {
              exercise: { select: { id: true, name: true, category: true } },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: [{ weekNumber: 'asc' }, { dayNumber: 'asc' }],
      },
      assignments: {
        include: {
          athlete: { select: { id: true, name: true } },
        },
      },
      _count: { select: { workouts: true, assignments: true } },
    },
  });

  if (!program) {
    notFound();
  }

  // Group workouts by week
  const weekMap = new Map<number, typeof program.workouts>();
  for (const workout of program.workouts) {
    const existing = weekMap.get(workout.weekNumber) ?? [];
    existing.push(workout);
    weekMap.set(workout.weekNumber, existing);
  }

  const weeks = Array.from(weekMap.entries()).sort(([a], [b]) => a - b);

  return (
    <Container className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/programs">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{program.name}</h1>
          {program.description && (
            <p className="text-muted-foreground mt-1">{program.description}</p>
          )}
        </div>
        {program.isTemplate && (
          <Button asChild>
            <Link href={`/programs/new?templateId=${program.id}`}>
              <Plus className="h-4 w-4 mr-2" />
              Use Template
            </Link>
          </Button>
        )}
        {!program.isTemplate && (
          <>
            <SaveAsTemplate
              programId={program.id}
              programName={program.name}
              programDescription={program.description}
            />
            <AssignAthletes
              programId={program.id}
              assignedAthleteIds={program.assignments.map((a) => a.athlete.id)}
            />
          </>
        )}
        <Button variant={program.isTemplate ? 'outline' : 'default'} asChild>
          <Link href={`/programs/${program.id}/edit`}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
      </div>

      {/* Summary */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="secondary">{program.type}</Badge>
        {program.periodizationType && (
          <Badge variant="secondary">{program.periodizationType}</Badge>
        )}
        <Badge variant="outline">{weeks.length} week{weeks.length !== 1 ? 's' : ''}</Badge>
        <Badge variant="outline">
          {program._count.workouts} day{program._count.workouts !== 1 ? 's' : ''}
        </Badge>
        {program._count.assignments > 0 && (
          <Badge variant="outline">
            {program._count.assignments} athlete{program._count.assignments !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Program Overview Grid */}
      {weeks.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3">Program Overview</h2>
            <ProgramOverview weeks={weeks} />
          </CardContent>
        </Card>
      )}

      {/* Assigned Athletes */}
      {program.assignments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-2">Assigned Athletes</h2>
            <div className="flex gap-2 flex-wrap">
              {program.assignments.map((a) => (
                <Badge key={a.id} variant="secondary">
                  <Link href={`/athletes/${a.athlete.id}`} className="hover:underline">
                    {a.athlete.name}
                  </Link>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Program Structure */}
      {weeks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No workouts in this program yet.{' '}
            <Link href={`/programs/${program.id}/edit`} className="text-primary hover:underline">
              Edit to add weeks and exercises.
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {weeks.map(([weekNumber, workouts]) => (
            <Card key={weekNumber} id={`week-${weekNumber}`}>
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b border-border">
                  <span className="font-semibold text-sm">Week {weekNumber}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {workouts.length} day{workouts.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="p-4 space-y-3">
                  {workouts.map((workout) => (
                    <div key={workout.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">{workout.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      {workout.notes && (
                        <p className="text-xs text-muted-foreground mb-2">{workout.notes}</p>
                      )}
                      {workout.exercises.length > 0 && (
                        <div className="space-y-1">
                          {workout.exercises.map((ex) => (
                            <div
                              key={ex.id}
                              className="flex items-center gap-2 text-sm py-1"
                            >
                              <Dumbbell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{ex.exercise.name}</span>
                              <Badge variant="outline" className="text-xs shrink-0 ml-auto">
                                {PRESCRIPTION_TYPE_LABELS[ex.prescriptionType as PrescriptionType] ?? ex.prescriptionType}
                              </Badge>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatExerciseSummary(ex)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}

function formatExerciseSummary(ex: {
  prescriptionType: string;
  prescribedSets: string | null;
  prescribedReps: string | null;
  prescribedLoad: string | null;
  prescribedRPE: number | null;
  prescribedRIR: number | null;
  velocityTarget: number | null;
  percentageOf1RM: number | null;
}): string {
  const sr = [ex.prescribedSets, ex.prescribedReps].filter(Boolean).join('x');
  switch (ex.prescriptionType) {
    case 'percentage':
      return ex.percentageOf1RM ? `${sr} @ ${ex.percentageOf1RM}%` : sr;
    case 'rpe':
      return ex.prescribedRPE != null ? `${sr} @ RPE ${ex.prescribedRPE}` : sr;
    case 'rir':
      return ex.prescribedRIR != null ? `${sr} @ ${ex.prescribedRIR} RIR` : sr;
    case 'velocity':
      return ex.velocityTarget != null ? `${sr} @ ${ex.velocityTarget} m/s` : sr;
    case 'autoregulated':
      return ex.prescribedRPE != null ? `Work up to RPE ${ex.prescribedRPE}` : sr;
    case 'fixed':
      return ex.prescribedLoad ? `${sr} @ ${ex.prescribedLoad}` : sr;
    default:
      return sr;
  }
}
