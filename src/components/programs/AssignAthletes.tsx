'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Loader2, Check, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Athlete {
  id: string;
  name: string;
}

interface AssignAthletesProps {
  programId: string;
  /** Athletes already assigned to this program */
  assignedAthleteIds: string[];
}

const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
] as const;

const PRESETS: { label: string; days: number[] }[] = [
  { label: '4-Day', days: [1, 2, 4, 5] },
  { label: '3-Day', days: [1, 3, 5] },
  { label: '5-Day', days: [1, 2, 3, 4, 5] },
];

function getNextMonday(): string {
  const today = new Date();
  const day = today.getDay();
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  const nextMon = new Date(today);
  nextMon.setDate(today.getDate() + daysUntilMonday);
  return nextMon.toISOString().split('T')[0];
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

export function AssignAthletes({ programId, assignedAthleteIds }: AssignAthletesProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState(getNextMonday);
  const [trainingDays, setTrainingDays] = useState<number[]>([1, 2, 4, 5]);

  // Fetch athletes when dialog opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch('/api/athletes')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch athletes');
        return res.json();
      })
      .then((data) => {
        setAthletes(data);
        // Pre-select already-assigned athletes
        setSelected(new Set(assignedAthleteIds));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open, assignedAthleteIds]);

  const toggleAthlete = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleTrainingDay = (day: number) => {
    setTrainingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const activePreset = PRESETS.find((p) => arraysEqual(p.days, trainingDays));

  const newSelections = [...selected].filter((id) => !assignedAthleteIds.includes(id));
  const hasChanges = newSelections.length > 0;

  const handleAssign = async () => {
    if (!hasChanges) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/programs/${programId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteIds: newSelections,
          startDate: startDate || undefined,
          trainingDays: trainingDays.length > 0 ? trainingDays : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || 'Failed to assign athletes');
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign athletes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Users className="h-4 w-4 mr-2" />
          Assign to Athletes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign to Athletes</DialogTitle>
          <DialogDescription>
            Select athletes and configure the training schedule.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error && athletes.length === 0 ? (
          <p className="text-sm text-destructive py-4">{error}</p>
        ) : athletes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No athletes found. Add athletes first.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Athlete selection */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Athletes</Label>
              <div className="space-y-1 max-h-40 overflow-y-auto mt-1.5">
                {athletes.map((athlete) => {
                  const isAssigned = assignedAthleteIds.includes(athlete.id);
                  const isChecked = selected.has(athlete.id);
                  return (
                    <label
                      key={athlete.id}
                      className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleAthlete(athlete.id)}
                        disabled={isAssigned}
                      />
                      <span className="text-sm flex-1">{athlete.name}</span>
                      {isAssigned && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Assigned
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Start date */}
            <div>
              <Label htmlFor="start-date" className="text-xs text-muted-foreground uppercase tracking-wider">
                Start Date
              </Label>
              <div className="relative mt-1.5">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Training days */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Training Days</Label>
              <div className="flex gap-1.5 mt-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setTrainingDays([...preset.days])}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                      activePreset?.label === preset.label
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:bg-accent'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {}}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                    !activePreset && trainingDays.length > 0
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border'
                  }`}
                  disabled
                >
                  Custom
                </button>
              </div>
              <div className="flex gap-1 mt-2">
                {WEEKDAYS.map((day) => {
                  const isSelected = trainingDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleTrainingDay(day.value)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              {trainingDays.length === 0 && (
                <p className="text-xs text-destructive mt-1">Select at least one training day</p>
              )}
            </div>
          </div>
        )}

        {error && athletes.length > 0 && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!hasChanges || saving || trainingDays.length === 0}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {hasChanges
              ? `Assign ${newSelections.length} athlete${newSelections.length !== 1 ? 's' : ''}`
              : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
