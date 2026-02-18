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
} from 'lucide-react';
import { WarmupCalculator } from '@/components/meets/WarmupCalculator';
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

function bestAttempt(entry: MeetEntryData, lift: Lift): number | null {
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
          const val = entry[`${lift}${attempt}` as keyof MeetEntryData] as number | null;
          initial[entry.id][key] = val != null ? String(val) : '';
        }
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
      const payload: Record<string, number | null> = {};
      for (const lift of LIFTS) {
        for (const attempt of ATTEMPTS) {
          const key = getAttemptKey(lift, attempt);
          const raw = vals[key];
          payload[key] = raw ? parseFloat(raw) : null;
        }
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
  function getTotal(entry: MeetEntryData): number | null {
    const sq = bestAttempt(entry, 'squat');
    const bp = bestAttempt(entry, 'bench');
    const dl = bestAttempt(entry, 'deadlift');
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

      {/* Athlete Entry Cards */}
      {meet.entries.map((entry) => {
        const vals = attemptValues[entry.id] ?? {};
        const total = getTotal(entry);
        const isSaving = savingEntries[entry.id];
        const isDeleting = deletingEntry === entry.id;

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
                      const best = bestAttempt(entry, lift);

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

                            return (
                              <td key={attempt} className="py-3 px-2">
                                <div className="flex flex-col items-center gap-0.5">
                                  <Input
                                    type="number"
                                    step="0.5"
                                    className="w-20 text-center h-8 text-sm"
                                    placeholder="kg"
                                    value={vals[key] ?? ''}
                                    onChange={(e) =>
                                      setAttemptValue(entry.id, key, e.target.value)
                                    }
                                  />
                                  {pct != null && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {pct}%
                                    </span>
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

      {/* Summary Card (when there are entries with attempts) */}
      {meet.entries.some((e) => getTotal(e) != null) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Results Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">Athlete</th>
                    <th className="text-center py-2 px-3 font-medium">Class</th>
                    <th className="text-center py-2 px-3 font-medium">Squat</th>
                    <th className="text-center py-2 px-3 font-medium">Bench</th>
                    <th className="text-center py-2 px-3 font-medium">Deadlift</th>
                    <th className="text-center py-2 px-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {meet.entries
                    .filter((e) => getTotal(e) != null)
                    .sort((a, b) => (getTotal(b) ?? 0) - (getTotal(a) ?? 0))
                    .map((entry) => (
                      <tr key={entry.id} className="border-b last:border-b-0">
                        <td className="py-2 pr-4 font-medium">{entry.athleteName}</td>
                        <td className="py-2 px-3 text-center text-muted-foreground">
                          {entry.weightClass ?? '-'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {formatKg(bestAttempt(entry, 'squat'))}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {formatKg(bestAttempt(entry, 'bench'))}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {formatKg(bestAttempt(entry, 'deadlift'))}
                        </td>
                        <td className="py-2 px-3 text-center font-bold">
                          {formatKg(getTotal(entry))}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
