'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showSuccess, showError } from '@/lib/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ArchiveProgramProps {
  programId: string;
  programName: string;
}

export function ArchiveProgram({ programId, programName }: ArchiveProgramProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleArchive = async () => {
    setArchiving(true);
    setError(null);

    try {
      const res = await fetch(`/api/programs/${programId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to archive program');
      }

      showSuccess('Program archived');
      setOpen(false);
      router.push('/programs');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive program';
      setError(message);
      showError(message);
    } finally {
      setArchiving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive Program</DialogTitle>
          <DialogDescription>
            Are you sure you want to archive &quot;{programName}&quot;? It will be hidden
            from your programs list. Existing athlete assignments and workout history
            will be preserved.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleArchive} disabled={archiving}>
            {archiving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Archive Program
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
