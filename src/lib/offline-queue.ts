/**
 * Offline queue for set logs.
 *
 * When an athlete logs a set and the network request fails,
 * the payload is stored in localStorage and replayed when
 * connectivity returns.
 */

const QUEUE_KEY = 'cannoli_offline_sets';
const MAX_QUEUE_SIZE = 100;

export interface SetLogPayload {
  workoutExerciseId: string;
  athleteId: string;
  setNumber: number;
  reps: number;
  weight: number;
  unit: string;
  rpe?: number | null;
  velocity?: number | null;
}

export interface QueuedSetLog {
  id: string;
  payload: SetLogPayload;
  queuedAt: string;
  retryCount: number;
}

export function getQueue(): QueuedSetLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedSetLog[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Add a set log payload to the offline queue.
 * Returns the queued entry, or null if the queue is full.
 */
export function enqueue(payload: SetLogPayload): QueuedSetLog | null {
  const queue = getQueue();
  if (queue.length >= MAX_QUEUE_SIZE) return null;
  const entry: QueuedSetLog = {
    id: crypto.randomUUID(),
    payload,
    queuedAt: new Date().toISOString(),
    retryCount: 0,
  };
  queue.push(entry);
  saveQueue(queue);
  return entry;
}

/** Remove a single entry from the queue by id. */
export function dequeue(id: string): void {
  const queue = getQueue().filter((e) => e.id !== id);
  saveQueue(queue);
}

/** Number of items currently in the queue. */
export function queueSize(): number {
  return getQueue().length;
}

/** Remove all queued items. */
export function clearQueue(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(QUEUE_KEY);
}

/**
 * Attempt to sync all queued set logs to the server.
 * Processes in FIFO order. Stops on the first network error
 * (still offline) but continues past server 4xx/5xx errors.
 */
export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const entry of queue) {
    try {
      const res = await fetch('/api/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry.payload),
      });

      if (res.ok || res.status === 409) {
        // Success or duplicate — remove from queue
        dequeue(entry.id);
        synced++;
      } else if (res.status === 404) {
        // Resource gone (e.g. workout exercise deleted) — discard
        dequeue(entry.id);
        synced++;
      } else {
        // Server error — increment retry, keep in queue
        entry.retryCount++;
        failed++;
      }
    } catch {
      // Network error — still offline, stop trying
      failed++;
      break;
    }
  }

  // Persist updated retry counts for items that failed
  if (failed > 0) {
    saveQueue(getQueue()); // re-read to get dequeued state, retryCount already mutated in-memory
  }

  return { synced, failed };
}
