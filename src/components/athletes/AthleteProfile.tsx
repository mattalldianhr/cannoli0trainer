'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Dumbbell,
  BarChart3,
  Trophy,
  Calendar,
  Weight,
  MapPin,
  Mail,
  Pencil,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { EditAthleteForm } from './EditAthleteForm';
import { DeleteAthleteDialog } from './DeleteAthleteDialog';

type TabKey = 'info' | 'training' | 'analytics';

interface AthleteProfileData {
  id: string;
  name: string;
  email: string | null;
  bodyweight: number | null;
  weightClass: string | null;
  experienceLevel: string;
  isRemote: boolean;
  isCompetitor: boolean;
  federation: string | null;
  notes: string | null;
  createdAt: string;
  coach: { id: string; name: string; brandName: string | null };
  programAssignments: {
    id: string;
    assignedAt: string;
    program: {
      id: string;
      name: string;
      type: string;
      startDate: string | null;
      endDate: string | null;
    };
  }[];
  workoutSessions: {
    id: string;
    date: string;
    status: string;
    completionPercentage: number;
    completedItems: number;
    totalItems: number;
    title: string | null;
  }[];
  currentMaxes: {
    id: string;
    workingMax: number;
    generatedMax: number | null;
    date: string;
    exercise: { id: string; name: string; category: string | null };
  }[];
  bodyweightLogs: {
    id: string;
    weight: number;
    unit: string;
    loggedAt: string;
  }[];
  meetEntries: {
    id: string;
    weightClass: string | null;
    squat1: number | null;
    squat2: number | null;
    squat3: number | null;
    bench1: number | null;
    bench2: number | null;
    bench3: number | null;
    deadlift1: number | null;
    deadlift2: number | null;
    deadlift3: number | null;
    meet: {
      id: string;
      name: string;
      date: string;
      location: string | null;
      federation: string | null;
    };
  }[];
  _count: {
    setLogs: number;
    workoutSessions: number;
    programAssignments: number;
    bodyweightLogs: number;
    meetEntries: number;
    maxSnapshots: number;
  };
}

const TABS: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: 'info', label: 'Info', icon: User },
  { key: 'training', label: 'Training', icon: Dumbbell },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function bestAttempt(...attempts: (number | null)[]): number | null {
  const valid = attempts.filter((a): a is number => a !== null && a > 0);
  return valid.length > 0 ? Math.max(...valid) : null;
}

export function AthleteProfile({ athlete }: { athlete: AthleteProfileData }) {
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const currentProgram = athlete.programAssignments[0] ?? null;
  const lastSession = athlete.workoutSessions[0] ?? null;
  const lastSessionDays = lastSession ? daysSince(lastSession.date) : null;

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Profile
          </Button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Edit {athlete.name}</h1>
        <EditAthleteForm athlete={athlete} onCancel={() => setIsEditing(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/athletes">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Athletes
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{athlete.name}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {athlete.isCompetitor && <Badge variant="default">Competitor</Badge>}
            {athlete.isRemote && <Badge variant="secondary">Remote</Badge>}
            <Badge variant="outline" className="capitalize">
              {athlete.experienceLevel}
            </Badge>
            {athlete.federation && (
              <Badge variant="outline">{athlete.federation}</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <DeleteAthleteDialog
        athleteId={athlete.id}
        athleteName={athlete.name}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{athlete._count.workoutSessions}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{athlete._count.setLogs.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Sets Logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{athlete._count.maxSnapshots}</p>
            <p className="text-xs text-muted-foreground">PRs Tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className={cn('text-2xl font-bold', lastSessionDays !== null && lastSessionDays >= 3 && 'text-destructive')}>
              {lastSessionDays !== null
                ? lastSessionDays === 0
                  ? 'Today'
                  : lastSessionDays === 1
                    ? '1d'
                    : `${lastSessionDays}d`
                : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Last Workout</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                  activeTab === tab.key
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && <InfoTab athlete={athlete} currentProgram={currentProgram} />}
      {activeTab === 'training' && <TrainingTab athlete={athlete} />}
      {activeTab === 'analytics' && <AnalyticsTab athlete={athlete} />}
    </div>
  );
}

function InfoTab({
  athlete,
  currentProgram,
}: {
  athlete: AthleteProfileData;
  currentProgram: AthleteProfileData['programAssignments'][number] | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Profile Details */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Profile</h2>
          <dl className="space-y-3 text-sm">
            {athlete.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <dd>{athlete.email}</dd>
              </div>
            )}
            {athlete.bodyweight && (
              <div className="flex items-center gap-2">
                <Weight className="h-4 w-4 text-muted-foreground shrink-0" />
                <dd>{athlete.bodyweight} kg</dd>
              </div>
            )}
            {athlete.weightClass && (
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-muted-foreground shrink-0" />
                <dd>{athlete.weightClass} class</dd>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <dd>Member since {formatDate(athlete.createdAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Current Program */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Current Program</h2>
          {currentProgram ? (
            <div className="space-y-2">
              <p className="font-medium">{currentProgram.program.name}</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="capitalize">Type: {currentProgram.program.type}</p>
                <p>Assigned: {formatDate(currentProgram.assignedAt)}</p>
                {currentProgram.program.startDate && (
                  <p>
                    {formatDate(currentProgram.program.startDate)}
                    {currentProgram.program.endDate && ` — ${formatDate(currentProgram.program.endDate)}`}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No program assigned</p>
          )}

          {athlete.programAssignments.length > 1 && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Previous programs ({athlete.programAssignments.length - 1})
              </p>
              <div className="space-y-1">
                {athlete.programAssignments.slice(1, 4).map((pa) => (
                  <p key={pa.id} className="text-sm text-muted-foreground">
                    {pa.program.name} — {formatDate(pa.assignedAt)}
                  </p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {athlete.notes && (
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-2">
            <h2 className="text-lg font-semibold">Notes</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{athlete.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Competition History */}
      {athlete.meetEntries.length > 0 && (
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Competition History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Meet</th>
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 pr-4 font-medium text-right">Squat</th>
                    <th className="pb-2 pr-4 font-medium text-right">Bench</th>
                    <th className="pb-2 pr-4 font-medium text-right">Deadlift</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {athlete.meetEntries.map((entry) => {
                    const bestSquat = bestAttempt(entry.squat1, entry.squat2, entry.squat3);
                    const bestBench = bestAttempt(entry.bench1, entry.bench2, entry.bench3);
                    const bestDead = bestAttempt(entry.deadlift1, entry.deadlift2, entry.deadlift3);
                    const total =
                      bestSquat !== null && bestBench !== null && bestDead !== null
                        ? bestSquat + bestBench + bestDead
                        : null;
                    return (
                      <tr key={entry.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          <p className="font-medium">{entry.meet.name}</p>
                          {entry.meet.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {entry.meet.location}
                            </p>
                          )}
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {formatDate(entry.meet.date)}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {bestSquat !== null ? `${bestSquat} kg` : '—'}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {bestBench !== null ? `${bestBench} kg` : '—'}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {bestDead !== null ? `${bestDead} kg` : '—'}
                        </td>
                        <td className="py-2 text-right font-semibold tabular-nums">
                          {total !== null ? `${total} kg` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TrainingTab({ athlete }: { athlete: AthleteProfileData }) {
  return (
    <div className="space-y-6">
      {/* Current Maxes */}
      {athlete.currentMaxes.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Current Estimated Maxes</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {athlete.currentMaxes.map((max) => (
                <div
                  key={max.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{max.exercise.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(max.date)}</p>
                  </div>
                  <p className="text-lg font-bold tabular-nums shrink-0 ml-3">
                    {max.workingMax} kg
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sessions */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">
            Recent Training ({athlete._count.workoutSessions} total)
          </h2>
          {athlete.workoutSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No training sessions recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {athlete.workoutSessions.map((session) => {
                const pct = Math.round(session.completionPercentage);
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm">
                        {session.title ?? formatDate(session.date)}
                      </p>
                      {session.title && (
                        <p className="text-xs text-muted-foreground">{formatDate(session.date)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="text-xs text-muted-foreground">
                        {session.completedItems}/{session.totalItems} exercises
                      </span>
                      <Badge
                        variant={pct >= 80 ? 'default' : pct >= 50 ? 'secondary' : 'outline'}
                        className="text-xs tabular-nums"
                      >
                        {pct}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {athlete._count.workoutSessions > athlete.workoutSessions.length && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Showing {athlete.workoutSessions.length} of {athlete._count.workoutSessions} sessions
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsTab({ athlete }: { athlete: AthleteProfileData }) {
  return (
    <div className="space-y-6">
      {/* View Full Analytics Link */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/analytics?athleteId=${athlete.id}`}>
            <BarChart3 className="h-4 w-4 mr-1" />
            View Full Analytics
            <ExternalLink className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Training Frequency Heatmap */}
      {athlete.workoutSessions.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Recent Training Frequency</h2>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 28 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (27 - i));
                const dateStr = date.toISOString().split('T')[0];
                const hasSession = athlete.workoutSessions.some(
                  (s) => s.date.split('T')[0] === dateStr
                );
                return (
                  <div
                    key={i}
                    className={cn(
                      'aspect-square rounded-sm',
                      hasSession ? 'bg-primary' : 'bg-muted'
                    )}
                    title={`${dateStr}${hasSession ? ' - trained' : ''}`}
                  />
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">Last 4 weeks</p>
          </CardContent>
        </Card>
      )}

      {/* Embedded Analytics Dashboard (pre-filtered to this athlete) */}
      <AnalyticsDashboard
        athletes={[{ id: athlete.id, name: athlete.name }]}
        initialAthleteId={athlete.id}
        compact
      />
    </div>
  );
}
