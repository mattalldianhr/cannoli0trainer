# Offline Queue Design: Set Log Sync

## Overview

When an athlete logs a set during a workout and their device has no network connectivity, the set data should be queued locally and synced to the server when connectivity returns. This prevents data loss during gym sessions where cellular/WiFi is unreliable.

## Architecture

```
[Log Set Button]
       │
       ▼
[POST /api/sets] ──success──▶ [Normal flow: refresh, rest timer]
       │
     failure
       │
       ▼
[localStorage queue] ──▶ [Pending sync badge]
       │
       ▼
[Background sync loop] ──online──▶ [Replay queued POSTs]
       │                                    │
       ▼                                  success
  [Check every 30s]                         │
                                            ▼
                                 [Remove from queue, refresh UI]
```

## Queue Storage

**Key:** `cannoli_offline_sets`

**Shape:**
```typescript
interface QueuedSetLog {
  id: string;                  // Client-generated UUID for dedup
  payload: {
    workoutExerciseId: string;
    athleteId: string;
    setNumber: number;
    reps: number;
    weight: number;
    unit: string;
    rpe?: number | null;
    velocity?: number | null;
  };
  queuedAt: string;           // ISO timestamp
  retryCount: number;          // Starts at 0
}
```

**Stored as:** `JSON.stringify(QueuedSetLog[])` in localStorage.

**Capacity limit:** 100 entries max. If the queue reaches 100, show a warning and stop accepting new entries until some are synced. At ~200 bytes per entry, this is ~20 KB — well within localStorage limits.

## Implementation Plan

### 1. Queue Manager Module

**File:** `src/lib/offline-queue.ts`

```typescript
const QUEUE_KEY = 'cannoli_offline_sets';
const MAX_QUEUE_SIZE = 100;

export function getQueue(): QueuedSetLog[] {
  const raw = localStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function enqueue(payload: SetLogPayload): QueuedSetLog | null {
  const queue = getQueue();
  if (queue.length >= MAX_QUEUE_SIZE) return null; // Queue full
  const entry: QueuedSetLog = {
    id: crypto.randomUUID(),
    payload,
    queuedAt: new Date().toISOString(),
    retryCount: 0,
  };
  queue.push(entry);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return entry;
}

export function dequeue(id: string): void {
  const queue = getQueue().filter(e => e.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function queueSize(): number {
  return getQueue().length;
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}
```

### 2. Sync Function

**File:** `src/lib/offline-queue.ts` (same module)

```typescript
export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  // Process in order (oldest first)
  for (const entry of queue) {
    try {
      const res = await fetch('/api/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry.payload),
      });

      if (res.ok) {
        dequeue(entry.id);
        synced++;
      } else if (res.status === 409) {
        // Duplicate — already synced, remove from queue
        dequeue(entry.id);
        synced++;
      } else {
        entry.retryCount++;
        failed++;
      }
    } catch {
      // Still offline — stop trying
      failed++;
      break;
    }
  }

  return { synced, failed };
}
```

### 3. Integration into ExerciseCard

Modify the `handleLogSet()` function in `TrainingLog.tsx`:

```typescript
// Current flow (simplified):
const res = await fetch('/api/sets', { method: 'POST', body: JSON.stringify(body) });
if (!res.ok) throw new Error('Failed to log set');

// New flow:
try {
  const res = await fetch('/api/sets', { method: 'POST', body: JSON.stringify(body) });
  if (!res.ok) throw new Error('Failed to log set');
  // Normal success path: refresh, rest timer, etc.
} catch (err) {
  // Network failure — queue locally
  const queued = enqueue(body);
  if (queued) {
    // Show set as "pending" in UI (optimistic)
    // Update local state to reflect the logged set
    // Show "pending sync" indicator
  } else {
    // Queue full — show error
  }
}
```

### 4. Background Sync Loop

**Hook:** `src/hooks/useOfflineSync.ts`

```typescript
export function useOfflineSync(onSync?: () => void) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Update count on mount
    setPendingCount(queueSize());

    // Sync on online event
    const handleOnline = async () => {
      const result = await syncQueue();
      setPendingCount(queueSize());
      if (result.synced > 0) onSync?.(); // Trigger data refresh
    };

    // Periodic check every 30 seconds
    const interval = setInterval(async () => {
      if (navigator.onLine && queueSize() > 0) {
        const result = await syncQueue();
        setPendingCount(queueSize());
        if (result.synced > 0) onSync?.();
      }
    }, 30_000);

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [onSync]);

  return { pendingCount };
}
```

### 5. Pending Sync UI

A small badge on the training log page when queued sets exist:

```
┌─────────────────────────────┐
│  ⚠ 3 sets pending sync     │
└─────────────────────────────┘
```

- Yellow badge, positioned near the top of the training log
- Disappears when queue is empty
- Tapping it could show details (timestamps, exercises)

Individual queued sets appear in the set list with a "pending" style (e.g., dashed border, clock icon) instead of the normal checkmark.

## Server-Side Considerations

### Idempotency

The queue uses client-generated UUIDs. To support idempotent replays:

**Option A (simple):** Accept duplicate set logs. The `setNumber` field + `workoutExerciseId` combo should be unique enough that duplicates are unlikely. If the first POST actually succeeded but the client didn't get the response, the retry creates a duplicate set. Coach/athlete can delete it manually.

**Option B (recommended for Task 21.4):** Add a `clientId` field to the SetLog model. The POST endpoint checks for an existing SetLog with the same `clientId` and returns 200 (or 409) instead of creating a duplicate. This is a small schema change:

```prisma
model SetLog {
  // ... existing fields
  clientId String? @unique  // Client-generated UUID for offline dedup
}
```

### Session Status

When queued sets sync, the server's `updateSessionStatus()` runs for each set. This correctly updates the WorkoutSession completion percentage, even if multiple sets sync at once (they process sequentially).

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Device goes offline mid-workout | Sets queue locally, sync when back online |
| App closed while queue has items | Queue persists in localStorage, syncs on next visit |
| Queue full (100 items) | Warning shown, new sets rejected until sync |
| Server returns 500 on sync | Retry on next cycle, increment retryCount |
| Stale queued set (>24h old) | Still attempt sync — server decides validity |
| Multiple tabs open | localStorage is shared — queue deduplication by `id` handles this |
| Set deleted on server before sync | 404 on sync — dequeue silently |
| Athlete logs in on new device | Old device's queue stays local (no cross-device sync) |

## What This Does NOT Cover

- **Offline workout loading**: The workout structure (exercises, prescriptions) must be fetched while online. This only queues _set completion_ writes.
- **Offline reads**: Previous performance data requires connectivity.
- **Cross-device sync**: The queue is device-local via localStorage.
- **Service worker**: No service worker caching. The app requires an initial online load.

## Implementation Sequence (Task 21.4)

1. Create `src/lib/offline-queue.ts` with queue manager + sync function
2. Create `src/hooks/useOfflineSync.ts` hook
3. Modify `handleLogSet()` in `ExerciseCard` to catch network errors and enqueue
4. Add pending sync badge component to TrainingLog
5. Add optimistic set display for queued items
6. (Optional) Add `clientId` to SetLog schema for idempotent replays
7. Test by throttling network in Chrome DevTools
