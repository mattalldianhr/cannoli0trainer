'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Trophy,
  Plus,
  Users,
  Loader2,
  Trash2,
  Save,
  Check,
  X,
  ClipboardList,
} from 'lucide-react';
import { WarmupCalculator } from '@/components/meets/WarmupCalculator';
import { FlightTracker } from '@/components/meets/FlightTracker';
import { MeetResultsSummary } from '@/components/meets/MeetResultsSummary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface AttemptResult {
  weight: number;
  good: boolean;
}

type AttemptResults = Record<string, AttemptResult[]>;

interface MeetEntryData {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteBodyweight: number | null;
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
  notes: string | null;
  attemptResults: AttemptResults | null;
  estimatedMaxes: {
    squat?: number;
    bench?: number;
    deadlift?: number;
  };
}

interface MeetData {
  id: string;
  name: string;
  date: string;
  federation: string | null;
  location: string | null;
  coachId: string;
  entries: MeetEntryData[];
}

interface AvailableAthlete {
  id: string;
  name: string;
  weightClass: string | null;
  bodyweight: number | null;
}

interface MeetDetailProps {
  meet: MeetData;
  availableAthletes: AvailableAthlete[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatKg(val: number | null | undefined): string {
  if (val == null) return '-';
  return `${val}`;
}

const LIFTS = ['squat', 'bench', 'deadlift'] as const;
type Lift = (typeof LIFTS)[number];
const ATTEMPTS = [1, 2, 3] as const;

function getAttemptKey(lift: Lift, attempt: number): string {
  return `${lift}${attempt}`;
}

function bestAttempt(
  entry: MeetEntryData,
  lift: Lift,
  localResults?: AttemptResults
): number | null {
  const results = localResults?.[lift] ?? entry.attemptResults?.[lift];
  if (results && results.length > 0) {
    const hasAnyResult = results.some((r) => r.weight > 0);
    if (hasAnyResult) {
      // Use only successful (good) attempts
      const goodAttempts = results
        .filter((r) => r.good && r.weight > 0)
        .map((r) => r.weight);
      return goodAttempts.length > 0 ? Math.max(...goodAttempts) : null;
    }
  }
  // Fallback: all planned attempts (no make/miss data yet)
  const vals = ATTEMPTS.map(
    (a) => entry[`${lift}${a}` as keyof MeetEntryData] as number | null
  ).filter((v): v is number => v != null);
  return vals.length > 0 ? Math.max(...vals) : null;
}

export function MeetDetail({ meet, availableAthletes }: MeetDetailProps) {
  const router = useRouter();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [addWeightClass, setAddWeightClass] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Track saving state per entry
  const [savingEntries, setSavingEntries] = useState<Record<string, boolean>>({});
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null);

  // Results mode toggle per entry
  const [resultsMode, setResultsMode] = useState<Record<string, boolean>>({});

  // Local attempt values for editing
  const [attemptValues, setAttemptValues] = useState<
    Record<string, Record<string, string>>
  >(() => {
    const initial: Record<string, Record<string, string>> = {};
    for (const entry of meet.entries) {
      initial[entry.id] = {};
      for (const lift of LIFTS) {
        for (const attempt of ATTEMPTS) {
          const key = getAttemptKey(lift, attempt);
          // If attemptResults exist with a nonzero weight, use those; otherwise use planned
          const results = entry.attemptResults?.[lift];
          const resultWeight = results?.[attempt - 1]?.weight;
          const plannedVal = entry[`${lift}${attempt}` as keyof MeetEntryData] as number | null;
          const val = resultWeight && resultWeight > 0 ? resultWeight : plannedVal;
          initial[entry.id][key] = val != null ? String(val) : '';
        }
      }
    }
    return initial;
  });

  // Local attempt results (make/miss) per entry
  const [localAttemptResults, setLocalAttemptResults] = useState<
    Record<string, AttemptResults>
  >(() => {
    const initial: Record<string, AttemptResults> = {};
    for (const entry of meet.entries) {
      if (entry.attemptResults) {
        initial[entry.id] = { ...entry.attemptResults };
      }
    }
    return initial;
  });

  function setAttemptValue(entryId: string, key: string, value: string) {
    setAttemptValues((prev) => ({
      ...prev,
      [entryId]: { ...prev[entryId], [key]: value },
    }));
  }

  function toggleAttemptResult(entryId: string, lift: Lift, attemptIndex: number) {
    setLocalAttemptResults((prev) => {
      const entryResults = prev[entryId] ?? {};
      const liftResults = [...(entryResults[lift] ?? [])];

      // Get the current weight from attempt values
      const key = getAttemptKey(lift, attemptIndex + 1);
      const vals = attemptValues[entryId] ?? {};
      const weight = vals[key] ? parseFloat(vals[key]) : 0;
      if (!weight) return prev; // Can't toggle without a weight

      // Ensure array is long enough
      while (liftResults.length <= attemptIndex) {
        liftResults.push({ weight: 0, good: false });
      }

      const current = liftResults[attemptIndex];
      if (current.weight === 0 && !current.good) {
        // First click: mark as good
        liftResults[attemptIndex] = { weight, good: true };
      } else if (current.good) {
        // Was good, switch to miss
        liftResults[attemptIndex] = { weight, good: false };
      } else {
        // Was miss, clear the result
        liftResults[attemptIndex] = { weight: 0, good: false };
      }

      return {
        ...prev,
        [entryId]: { ...entryResults, [lift]: liftResults },
      };
    });
  }

  function getAttemptResultStatus(
    entryId: string,
    lift: Lift,
    attemptIndex: number
  ): 'good' | 'miss' | 'none' {
    const results = localAttemptResults[entryId]?.[lift];
    if (!results || !results[attemptIndex]) return 'none';
    const r = results[attemptIndex];
    if (r.weight === 0) return 'none';
    return r.good ? 'good' : 'miss';
  }

  async function handleAddAthlete(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAthleteId) return;

    setAdding(true);
    setAddError(null);

    try {
      const res = await fetch(`/api/meets/${meet.id}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: selectedAthleteId,
          weightClass: addWeightClass.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add athlete');
      }

      setSelectedAthleteId('');
      setAddWeightClass('');
      setAddDialogOpen(false);
      router.refresh();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveAttempts(entryId: string) {
    setSavingEntries((prev) => ({ ...prev, [entryId]: true }));

    try {
      const vals = attemptValues[entryId] ?? {};
      const payload: Record<string, unknown> = {};
      for (const lift of LIFTS) {
        for (const attempt of ATTEMPTS) {
          const key = getAttemptKey(lift, attempt);
          const raw = vals[key];
          payload[key] = raw ? parseFloat(raw) : null;
        }
      }

      // Include attemptResults if results mode is active or results already exist
      const entryResultsExist = localAttemptResults[entryId];
      if (resultsMode[entryId] || entryResultsExist) {
        // Build attemptResults from current weight values + good/miss status
        const attemptResultsPayload: AttemptResults = {};
        for (const lift of LIFTS) {
          const liftResults: AttemptResult[] = [];
          for (const attempt of ATTEMPTS) {
            const key = getAttemptKey(lift, attempt);
            const weight = vals[key] ? parseFloat(vals[key]) : 0;
            const status = getAttemptResultStatus(entryId, lift, attempt - 1);
            if (weight > 0 && status !== 'none') {
              liftResults.push({ weight, good: status === 'good' });
            } else if (weight > 0) {
              // Weight entered but no result marked — keep weight, default to unset
              liftResults.push({ weight, good: false });
            } else {
              liftResults.push({ weight: 0, good: false });
            }
          }
          attemptResultsPayload[lift] = liftResults;
        }
        payload.attemptResults = attemptResultsPayload;
      }

      const res = await fetch(`/api/meets/${meet.id}/entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save attempts');
      }

      router.refresh();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSavingEntries((prev) => ({ ...prev, [entryId]: false }));
    }
  }

  async function handleRemoveAthlete(entryId: string) {
    if (!confirm('Remove this athlete from the meet?')) return;

    setDeletingEntry(entryId);
    try {
      const res = await fetch(`/api/meets/${meet.id}/entries/${entryId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to remove athlete');
      }

      router.refresh();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingEntry(null);
    }
  }

  // Calculate total for an entry
  function getTotal(
    entry: MeetEntryData,
    localResults?: AttemptResults
  ): number | null {
    const sq = bestAttempt(entry, 'squat', localResults);
    const bp = bestAttempt(entry, 'bench', localResults);
    const dl = bestAttempt(entry, 'deadlift', localResults);
    if (sq == null && bp == null && dl == null) return null;
    return (sq ?? 0) + (bp ?? 0) + (dl ?? 0);
  }

  const isPast = new Date(meet.date) < new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/meets"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Meets
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{meet.name}</h1>
              {isPast && (
                <Badge variant="secondary">Completed</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(meet.date)}
              </span>
              {meet.federation && (
                <span className="inline-flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  {meet.federation}
                </span>
              )}
              {meet.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {meet.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4" />
                {meet.entries.length} athlete{meet.entries.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {availableAthletes.length > 0 && (
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Athlete
            </Button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {meet.entries.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No athletes added to this meet yet.</p>
            {availableAthletes.length > 0 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Athlete
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Multi-Athlete Flight Tracker */}
      {meet.entries.length >= 2 && (
        <FlightTracker
          entries={meet.entries.map((entry) => ({
            id: entry.id,
            athleteId: entry.athleteId,
            athleteName: entry.athleteName,
            plannedOpeners: {
              squat: entry.squat1 ?? undefined,
              bench: entry.bench1 ?? undefined,
              deadlift: entry.deadlift1 ?? undefined,
            },
          }))}
        />
      )}

      {/* Athlete Entry Cards */}
      {meet.entries.map((entry) => {
        const vals = attemptValues[entry.id] ?? {};
        const entryLocalResults = localAttemptResults[entry.id];
        const total = getTotal(entry, entryLocalResults);
        const isSaving = savingEntries[entry.id];
        const isDeleting = deletingEntry === entry.id;
        const hasExistingResults = entry.attemptResults != null;
        const isResultsMode = resultsMode[entry.id] ?? hasExistingResults;

        return (
          <Card key={entry.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    <Link
                      href={`/athletes/${entry.athleteId}`}
                      className="hover:underline"
                    >
                      {entry.athleteName}
                    </Link>
                  </CardTitle>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    {entry.weightClass && (
                      <span>{entry.weightClass} kg</span>
                    )}
                    {entry.athleteBodyweight && (
                      <span>BW: {entry.athleteBodyweight} kg</span>
                    )}
                    {total != null && (
                      <Badge variant="secondary">Total: {total} kg</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isResultsMode ? 'default' : 'outline'}
                    onClick={() =>
                      setResultsMode((prev) => ({
                        ...prev,
                        [entry.id]: !prev[entry.id],
                      }))
                    }
                  >
                    <ClipboardList className="h-4 w-4 mr-1" />
                    Results
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSaveAttempts(entry.id)}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveAthlete(entry.id)}
                    disabled={isDeleting}
                    className="text-destructive hover:text-destructive"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Attempt Planning Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium">Lift</th>
                      <th className="text-center py-2 px-2 font-medium text-muted-foreground text-xs">
                        Est. 1RM
                      </th>
                      <th className="text-center py-2 px-2 font-medium">
                        Opener
                      </th>
                      <th className="text-center py-2 px-2 font-medium">
                        2nd
                      </th>
                      <th className="text-center py-2 px-2 font-medium">
                        3rd
                      </th>
                      <th className="text-center py-2 px-2 font-medium text-muted-foreground text-xs">
                        Best
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {LIFTS.map((lift) => {
                      const e1rm = entry.estimatedMaxes[lift];
                      const best = bestAttempt(entry, lift, entryLocalResults);

                      return (
                        <tr key={lift} className="border-b last:border-b-0">
                          <td className="py-3 pr-4 font-medium capitalize">
                            {lift === 'bench' ? 'Bench' : lift === 'squat' ? 'Squat' : 'Deadlift'}
                          </td>
                          <td className="py-3 px-2 text-center text-muted-foreground text-xs">
                            {e1rm ? `${formatKg(e1rm)} kg` : '-'}
                          </td>
                          {ATTEMPTS.map((attempt) => {
                            const key = getAttemptKey(lift, attempt);
                            const pct = e1rm && vals[key]
                              ? Math.round((parseFloat(vals[key]) / e1rm) * 100)
                              : null;
                            const resultStatus = getAttemptResultStatus(
                              entry.id,
                              lift,
                              attempt - 1
                            );

                            return (
                              <td key={attempt} className="py-3 px-2">
                                <div className="flex flex-col items-center gap-0.5">
                                  <Input
                                    type="number"
                                    step="0.5"
                                    className={`w-20 text-center h-8 text-sm ${
                                      isResultsMode && resultStatus === 'good'
                                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                        : isResultsMode && resultStatus === 'miss'
                                          ? 'border-red-500 bg-red-50 dark:bg-red-950'
                                          : ''
                                    }`}
                                    placeholder="kg"
                                    value={vals[key] ?? ''}
                                    onChange={(e) =>
                                      setAttemptValue(entry.id, key, e.target.value)
                                    }
                                  />
                                  {isResultsMode && vals[key] ? (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleAttemptResult(
                                            entry.id,
                                            lift,
                                            attempt - 1
                                          )
                                        }
                                        className={`rounded-full p-0.5 transition-colors ${
                                          resultStatus === 'good'
                                            ? 'bg-green-500 text-white'
                                            : resultStatus === 'miss'
                                              ? 'bg-red-500 text-white'
                                              : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20'
                                        }`}
                                        title={
                                          resultStatus === 'good'
                                            ? 'Good lift — click to mark miss'
                                            : resultStatus === 'miss'
                                              ? 'No lift — click to clear'
                                              : 'Click to mark good lift'
                                        }
                                      >
                                        {resultStatus === 'good' ? (
                                          <Check className="h-3 w-3" />
                                        ) : resultStatus === 'miss' ? (
                                          <X className="h-3 w-3" />
                                        ) : (
                                          <Check className="h-3 w-3" />
                                        )}
                                      </button>
                                    </div>
                                  ) : (
                                    pct != null && (
                                      <span className="text-[10px] text-muted-foreground">
                                        {pct}%
                                      </span>
                                    )
                                  )}
                                </div>
                              </td>
                            );
                          })}
                          <td className="py-3 px-2 text-center font-semibold">
                            {formatKg(best)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              {entry.notes && (
                <p className="mt-3 text-sm text-muted-foreground italic">
                  {entry.notes}
                </p>
              )}

              {/* Warm-up Calculator */}
              <div className="mt-4">
                <WarmupCalculator
                  athleteName={entry.athleteName}
                  entryId={entry.id}
                  estimatedMaxes={entry.estimatedMaxes}
                  plannedOpeners={{
                    squat: entry.squat1 ?? undefined,
                    bench: entry.bench1 ?? undefined,
                    deadlift: entry.deadlift1 ?? undefined,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Meet Results Summary with DOTS/Wilks scores */}
      <MeetResultsSummary entries={meet.entries} />

      {/* Add Athlete Dialog */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedAthleteId('');
            setAddWeightClass('');
            setAddError(null);
          }
          setAddDialogOpen(isOpen);
        }}
      >
        <DialogContent>
          <form onSubmit={handleAddAthlete}>
            <DialogHeader>
              <DialogTitle>Add Athlete to Meet</DialogTitle>
              <DialogDescription>
                Select an athlete and assign their weight class for this meet.
              </DialogDescription>
            </DialogHeader>

            {addError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive mt-4">
                {addError}
              </div>
            )}

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="athlete-select">Athlete *</Label>
                <select
                  id="athlete-select"
                  value={selectedAthleteId}
                  onChange={(e) => {
                    setSelectedAthleteId(e.target.value);
                    // Auto-fill weight class from athlete profile
                    const athlete = availableAthletes.find(
                      (a) => a.id === e.target.value
                    );
                    if (athlete?.weightClass) {
                      setAddWeightClass(athlete.weightClass);
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Select an athlete...</option>
                  {availableAthletes.map((athlete) => (
                    <option key={athlete.id} value={athlete.id}>
                      {athlete.name}
                      {athlete.weightClass ? ` (${athlete.weightClass} kg)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight-class">Weight Class (kg)</Label>
                <Input
                  id="weight-class"
                  value={addWeightClass}
                  onChange={(e) => setAddWeightClass(e.target.value)}
                  placeholder="e.g. 83, 93, 105"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedAthleteId('');
                  setAddWeightClass('');
                  setAddError(null);
                  setAddDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={adding || !selectedAthleteId}>
                {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {adding ? 'Adding...' : 'Add to Meet'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
