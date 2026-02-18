'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showSuccess, showError } from '@/lib/toast';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/confirm-dialog';

interface DeleteExerciseDialogProps {
  exerciseId: string;
  exerciseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteExerciseDialog({
  exerciseId,
  exerciseName,
  open,
  onOpenChange,
}: DeleteExerciseDialogProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState<number | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    setUsageCount(null);

    try {
      const res = await fetch(`/api/exercises/${exerciseId}`, {
        method: 'DELETE',
      });

      if (res.status === 409) {
        const data = await res.json();
        setUsageCount(data.usageCount ?? 0);
        const msg = data.error || 'Cannot delete exercise that is used in workouts';
        setError(msg);
        showError(msg);
        setDeleting(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete exercise');
      }

      showSuccess('Exercise deleted');
      router.push('/exercises');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      showError(message);
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Exercise
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{exerciseName}</strong>? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {usageCount !== null && (
              <div className="flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{error}</p>
                  <p className="mt-1 text-muted-foreground">
                    This exercise is referenced in {usageCount} workout
                    {usageCount !== 1 ? 's' : ''}. Remove it from all workouts
                    before deleting.
                  </p>
                </div>
              </div>
            )}
            {usageCount === null && error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          {usageCount === null && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete Exercise'}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
