'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface ArchiveAthleteDialogProps {
  athleteId: string;
  athleteName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArchiveAthleteDialog({
  athleteId,
  athleteName,
  open,
  onOpenChange,
}: ArchiveAthleteDialogProps) {
  const router = useRouter();
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleArchive() {
    setArchiving(true);
    setError(null);

    try {
      const res = await fetch(`/api/athletes/${athleteId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to archive athlete');
      }

      router.push('/athletes');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setArchiving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-muted-foreground" />
            Archive Athlete
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to archive <strong>{athleteName}</strong>? They will be hidden from
            your active roster but their training history and data will be preserved. You can
            reactivate them at any time from the Archived tab.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={archiving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleArchive}
            disabled={archiving}
          >
            {archiving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {archiving ? 'Archiving...' : 'Archive Athlete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Keep backward-compatible export name
export { ArchiveAthleteDialog as DeleteAthleteDialog };
