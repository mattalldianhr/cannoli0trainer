'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Pause, Play, X, Timer, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RestTimerProps {
  /** Duration in seconds */
  duration: number;
  /** Called when timer is dismissed (manually or after expiring) */
  onDismiss: () => void;
  /** Exercise name for context */
  exerciseName?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RestTimer({ duration, onDismiss, exerciseName }: RestTimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const [paused, setPaused] = useState(false);
  const [expired, setExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAlertedRef = useRef(false);

  const alertUser = useCallback(() => {
    if (hasAlertedRef.current) return;
    hasAlertedRef.current = true;

    // Vibration (mobile)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    // Audio beep using Web Audio API
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
      // Second beep
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = 880;
          gain2.gain.value = 0.3;
          osc2.start();
          osc2.stop(ctx.currentTime + 0.15);
        } catch {
          // Audio not available
        }
      }, 250);
    } catch {
      // AudioContext not available
    }
  }, []);

  useEffect(() => {
    if (paused || expired) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setExpired(true);
          alertUser();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [paused, expired, alertUser]);

  const handleReset = () => {
    setRemaining(duration);
    setExpired(false);
    setPaused(false);
    hasAlertedRef.current = false;
  };

  const progress = duration > 0 ? ((duration - remaining) / duration) * 100 : 100;

  return (
    <div
      className={cn(
        'rounded-md border p-3 transition-colors',
        expired
          ? 'border-green-300 bg-green-50/80 dark:border-green-800 dark:bg-green-950/30'
          : 'border-primary/30 bg-primary/5',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Timer
            className={cn(
              'h-4 w-4 flex-shrink-0',
              expired ? 'text-green-600' : 'text-primary',
            )}
          />
          <div className="min-w-0">
            <span
              className={cn(
                'text-xl font-mono font-semibold tabular-nums',
                expired ? 'text-green-600' : 'text-foreground',
              )}
            >
              {formatTime(remaining)}
            </span>
            {exerciseName && (
              <p className="text-xs text-muted-foreground truncate">
                {expired ? 'Rest complete' : 'Rest timer'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!expired && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPaused(!paused)}
              aria-label={paused ? 'Resume timer' : 'Pause timer'}
            >
              {paused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleReset}
            aria-label="Reset timer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onDismiss}
            aria-label="Dismiss timer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000 ease-linear',
            expired ? 'bg-green-500' : 'bg-primary',
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
