'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

export function AssignAthletes({ programId, assignedAthleteIds }: AssignAthletesProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
        body: JSON.stringify({ athleteIds: newSelections }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to assign athletes');
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign to Athletes</DialogTitle>
          <DialogDescription>
            Select athletes to assign this program to.
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
          <div className="space-y-1 max-h-64 overflow-y-auto">
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
        )}

        {error && athletes.length > 0 && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!hasChanges || saving}>
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
