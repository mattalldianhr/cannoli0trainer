'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showSuccess, showError } from '@/lib/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/ui/form-error';
import { meetFormSchema, validateForm } from '@/lib/validations';
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
    setFieldErrors({});
    setTouched({});
  }

  function getFormData() {
    return { name, date, federation, location };
  }

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errors = validateForm(meetFormSchema, getFormData());
    setFieldErrors(errors);
  }

  function fieldError(field: string) {
    return touched[field] ? fieldErrors[field] : undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = getFormData();
    const errors = validateForm(meetFormSchema, data);
    setFieldErrors(errors);

    const allTouched: Record<string, boolean> = {};
    for (const key of Object.keys(data)) {
      allTouched[key] = true;
    }
    setTouched(allTouched);

    if (Object.keys(errors).length > 0) return;

    const parsed = meetFormSchema.safeParse(data);
    if (!parsed.success) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/meets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId,
          ...parsed.data,
        }),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || 'Failed to create meet');
      }

      showSuccess('Meet created');
      resetForm();
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const hasErrors = Object.keys(fieldErrors).length > 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate>
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
                onBlur={() => handleBlur('name')}
                placeholder="2026 North Brooklyn Classic"
                className={fieldError('name') ? 'border-destructive' : ''}
              />
              <FormError message={fieldError('name')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meet-date">Date *</Label>
              <Input
                id="meet-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onBlur={() => handleBlur('date')}
                className={fieldError('date') ? 'border-destructive' : ''}
              />
              <FormError message={fieldError('date')} />
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
            <Button type="submit" disabled={submitting || hasErrors}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? 'Creating...' : 'Create Meet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
