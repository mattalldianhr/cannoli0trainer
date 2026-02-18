'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showSuccess, showError } from '@/lib/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface ArchiveProgramProps {
  programId: string;
  programName: string;
}

export function ArchiveProgram({ programId, programName }: ArchiveProgramProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const handleArchive = async () => {
    setArchiving(true);

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
      showError(message);
    } finally {
      setArchiving(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Archive className="h-4 w-4 mr-2" />
        Archive
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Archive Program"
        description={
          <>
            Are you sure you want to archive &quot;{programName}&quot;? It will be hidden
            from your programs list. Existing athlete assignments and workout history
            will be preserved.
          </>
        }
        confirmLabel={archiving ? 'Archiving...' : 'Archive Program'}
        variant="destructive"
        loading={archiving}
        onConfirm={handleArchive}
      />
    </>
  );
}
