'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/lib/toast';

interface Program {
  id: string;
  name: string;
  type: string | null;
  _count?: { workouts: number };
}

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAthleteIds: string[];
  selectedAthleteNames: string[];
  onSuccess: () => void;
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

export function BulkAssignDialog({
  open,
  onOpenChange,
  selectedAthleteIds,
  selectedAthleteNames,
  onSuccess,
}: BulkAssignDialogProps) {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(getNextMonday);
  const [trainingDays, setTrainingDays] = useState<number[]>([1, 2, 4, 5]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setSelectedProgramId(null);
    setSearch('');
    fetch('/api/programs?isTemplate=false')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch programs');
        return res.json();
      })
      .then((data) => setPrograms(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open]);

  const toggleTrainingDay = (day: number) => {
    setTrainingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const activePreset = PRESETS.find((p) => arraysEqual(p.days, trainingDays));

  const filteredPrograms = programs.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedProgramId || selectedAthleteIds.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/programs/${selectedProgramId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteIds: selectedAthleteIds,
          startDate: startDate || undefined,
          trainingDays: trainingDays.length > 0 ? trainingDays : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || 'Failed to assign program');
      }
      showSuccess(`Program assigned to ${selectedAthleteIds.length} athlete${selectedAthleteIds.length !== 1 ? 's' : ''}`);
      onOpenChange(false);
      onSuccess();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign program';
      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Program</DialogTitle>
          <DialogDescription>
            Assign a program to {selectedAthleteIds.length} selected athlete{selectedAthleteIds.length !== 1 ? 's' : ''}: {selectedAthleteNames.join(', ')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error && programs.length === 0 ? (
          <p className="text-sm text-destructive py-4">{error}</p>
        ) : programs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No programs found. Create a program first.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Program selection */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Program</Label>
              <Input
                placeholder="Search programs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-1.5"
              />
              <div className="space-y-1 max-h-40 overflow-y-auto mt-1.5">
                {filteredPrograms.map((program) => (
                  <button
                    key={program.id}
                    type="button"
                    onClick={() => setSelectedProgramId(program.id)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
                      selectedProgramId === program.id
                        ? 'bg-primary/10 border border-primary'
                        : 'hover:bg-accent border border-transparent'
                    )}
                  >
                    <span className="text-sm flex-1">{program.name}</span>
                    {program.type && (
                      <span className="text-xs text-muted-foreground capitalize">{program.type}</span>
                    )}
                  </button>
                ))}
                {filteredPrograms.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2 px-3">No programs match your search.</p>
                )}
              </div>
            </div>

            {/* Start date */}
            <div>
              <Label htmlFor="bulk-start-date" className="text-xs text-muted-foreground uppercase tracking-wider">
                Start Date
              </Label>
              <div className="relative mt-1.5">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="bulk-start-date"
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

        {error && programs.length > 0 && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedProgramId || saving || trainingDays.length === 0}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {selectedProgramId
              ? `Assign to ${selectedAthleteIds.length} athlete${selectedAthleteIds.length !== 1 ? 's' : ''}`
              : 'Select a program'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
