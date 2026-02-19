'use client';

import { useState } from 'react';
import { Scale } from 'lucide-react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormError } from '@/components/ui/form-error';
import { showSuccess, showError } from '@/lib/toast';

interface BodyweightLogDialogProps {
  athleteId: string;
  athleteName: string;
  defaultUnit?: string;
  onLogged?: () => void;
  /** Render a custom trigger instead of the default button */
  trigger?: React.ReactNode;
}

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function BodyweightLogDialog({
  athleteId,
  athleteName,
  defaultUnit = 'lbs',
  onLogged,
  trigger,
}: BodyweightLogDialogProps) {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState(defaultUnit);
  const [date, setDate] = useState(todayStr);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setWeight('');
    setUnit(defaultUnit);
    setDate(todayStr());
    setError(null);
  }

  async function handleSave() {
    const w = parseFloat(weight);
    if (!weight || isNaN(w) || w <= 0) {
      setError('Enter a valid weight');
      return;
    }
    if (w > 500) {
      setError('Weight seems too high — check the value');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/bodyweight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId,
          weight: w,
          unit,
          loggedAt: new Date(date + 'T12:00:00').toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to log bodyweight');
      }

      showSuccess(`Bodyweight logged: ${w} ${unit}`);
      setOpen(false);
      reset();
      onLogged?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      showError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Scale className="h-4 w-4 mr-1" />
            Log Bodyweight
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Bodyweight</DialogTitle>
          <DialogDescription>
            Record bodyweight for {athleteName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Weight + Unit */}
          <div className="space-y-2">
            <Label htmlFor="bw-weight">Weight</Label>
            <div className="flex gap-2">
              <Input
                id="bw-weight"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="e.g. 82.5"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  setError(null);
                }}
                className="flex-1"
                autoFocus
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </select>
            </div>
            <FormError message={error} />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="bw-date">Date</Label>
            <Input
              id="bw-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
