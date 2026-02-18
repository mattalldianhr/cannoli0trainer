'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { showSuccess, showError } from '@/lib/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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

  async function handleArchive() {
    setArchiving(true);

    try {
      const res = await fetch(`/api/athletes/${athleteId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to archive athlete');
      }

      showSuccess('Athlete archived');
      router.push('/athletes');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      showError(message);
      setArchiving(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Archive Athlete"
      description={
        <>
          Are you sure you want to archive <strong>{athleteName}</strong>? They will be hidden from
          your active roster but their training history and data will be preserved. You can
          reactivate them at any time from the Archived tab.
        </>
      }
      confirmLabel={archiving ? 'Archiving...' : 'Archive Athlete'}
      variant="destructive"
      loading={archiving}
      onConfirm={handleArchive}
    />
  );
}

// Keep backward-compatible export name
export { ArchiveAthleteDialog as DeleteAthleteDialog };
