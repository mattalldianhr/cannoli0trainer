'use client';

import { useState, useEffect, useCallback } from 'react';
import { queueSize, syncQueue } from '@/lib/offline-queue';

const SYNC_INTERVAL_MS = 30_000;

/**
 * Hook that manages background syncing of the offline set log queue.
 *
 * - Syncs immediately when the browser comes back online
 * - Polls every 30 seconds while items are queued
 * - Returns the current pending count for UI display
 * - Calls `onSync` after successfully syncing items so the caller can refresh data
 */
export function useOfflineSync(onSync?: () => void) {
  const [pendingCount, setPendingCount] = useState(0);

  const refreshCount = useCallback(() => {
    setPendingCount(queueSize());
  }, []);

  const attemptSync = useCallback(async () => {
    if (queueSize() === 0) return;
    const result = await syncQueue();
    setPendingCount(queueSize());
    if (result.synced > 0) {
      onSync?.();
    }
  }, [onSync]);

  useEffect(() => {
    // Initial count
    refreshCount();

    // Sync when browser comes back online
    const handleOnline = () => {
      attemptSync();
    };

    // Periodic sync check
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine && queueSize() > 0) {
        attemptSync();
      }
    }, SYNC_INTERVAL_MS);

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [attemptSync, refreshCount]);

  return { pendingCount, refreshCount };
}
