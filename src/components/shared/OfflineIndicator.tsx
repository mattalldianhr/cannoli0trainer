'use client';

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * Shows a small "Offline" badge when the browser is disconnected.
 * Renders nothing when online.
 */
export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300">
      <WifiOff className="h-3 w-3" />
      <span>Offline</span>
    </div>
  );
}
