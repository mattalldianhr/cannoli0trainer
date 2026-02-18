'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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

interface CreateMeetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachId: string;
}

export function CreateMeetDialog({ open, onOpenChange, coachId }: CreateMeetDialogProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [federation, setFederation] = useState('');
  const [location, setLocation] = useState('');

  function resetForm() {
    setName('');
    setDate('');
    setFederation('');
    setLocation('');
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !date) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/meets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId,
          name: name.trim(),
          date,
          federation: federation.trim() || null,
          location: location.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create meet');
      }

      resetForm();
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Meet</DialogTitle>
            <DialogDescription>
              Create a competition meet to plan attempts and warm-ups.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive mt-4">
              {error}
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="meet-name">Meet Name *</Label>
              <Input
                id="meet-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="2026 North Brooklyn Classic"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meet-date">Date *</Label>
              <Input
                id="meet-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meet-federation">Federation</Label>
              <Input
                id="meet-federation"
                value={federation}
                onChange={(e) => setFederation(e.target.value)}
                placeholder="USAPL, IPF, USPA..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meet-location">Location</Label>
              <Input
                id="meet-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Brooklyn, NY"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim() || !date}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? 'Creating...' : 'Create Meet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
