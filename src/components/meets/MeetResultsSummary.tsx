'use client';

import { useState, useMemo } from 'react';
import { Trophy, Check, X, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  calculateMeetResult,
  formatScore,
  type Gender,
  type MeetResultSummary,
} from '@/lib/meets/results';

interface AttemptResult {
  weight: number;
  good: boolean;
}

type AttemptResults = Record<string, AttemptResult[]>;

interface MeetEntryData {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteBodyweight: number | null;
  weightClass: string | null;
  squat1: number | null;
  squat2: number | null;
  squat3: number | null;
  bench1: number | null;
  bench2: number | null;
  bench3: number | null;
  deadlift1: number | null;
  deadlift2: number | null;
  deadlift3: number | null;
  attemptResults: AttemptResults | null;
}

interface MeetResultsSummaryProps {
  entries: MeetEntryData[];
}

function formatKg(val: number | null | undefined): string {
  if (val == null) return '-';
  return `${val}`;
}

function AttemptBadge({ good }: { good: boolean | null }) {
  if (good === null) return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (good) return <Check className="h-3 w-3 text-green-600" />;
  return <X className="h-3 w-3 text-red-500" />;
}

export function MeetResultsSummary({ entries }: MeetResultsSummaryProps) {
  // Gender overrides per athlete (default to 'male')
  const [genderOverrides, setGenderOverrides] = useState<Record<string, Gender>>({});

  const results: MeetResultSummary[] = useMemo(() => {
    return entries
      .map((entry) => {
        const gender = genderOverrides[entry.athleteId] ?? 'male';
        return calculateMeetResult({
          athleteName: entry.athleteName,
          bodyweight: entry.athleteBodyweight,
          weightClass: entry.weightClass,
          gender,
          attemptResults: entry.attemptResults,
          squat1: entry.squat1,
          squat2: entry.squat2,
          squat3: entry.squat3,
          bench1: entry.bench1,
          bench2: entry.bench2,
          bench3: entry.bench3,
          deadlift1: entry.deadlift1,
          deadlift2: entry.deadlift2,
          deadlift3: entry.deadlift3,
        });
      })
      .filter((r) => r.total != null)
      .sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  }, [entries, genderOverrides]);

  if (results.length === 0) return null;

  const hasScores = results.some((r) => r.dotsScore != null);
  const hasAttemptResults = results.some((r) => r.attemptedCount > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-lg">Meet Results</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-3 font-medium">Athlete</th>
                <th className="text-center py-2 px-2 font-medium">Class</th>
                <th className="text-center py-2 px-2 font-medium">BW</th>
                <th className="text-center py-2 px-2 font-medium">Squat</th>
                <th className="text-center py-2 px-2 font-medium">Bench</th>
                <th className="text-center py-2 px-2 font-medium">Deadlift</th>
                <th className="text-center py-2 px-2 font-medium">Total</th>
                {hasAttemptResults && (
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground text-xs">
                    Made
                  </th>
                )}
                {hasScores && (
                  <>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground text-xs">
                      DOTS
                    </th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground text-xs">
                      Wilks
                    </th>
                  </>
                )}
                {hasScores && (
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground text-xs">
                    Gender
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => {
                const entry = entries.find(
                  (e) => e.athleteName === result.athleteName
                )!;
                const currentGender =
                  genderOverrides[entry.athleteId] ?? 'male';

                return (
                  <tr key={entry.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        {index === 0 && results.length > 1 && (
                          <span className="text-yellow-500 text-xs font-bold">
                            1st
                          </span>
                        )}
                        <span className="font-medium">
                          {result.athleteName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center text-muted-foreground">
                      {result.weightClass ?? '-'}
                    </td>
                    <td className="py-3 px-2 text-center text-muted-foreground">
                      {result.bodyweight ? `${result.bodyweight}` : '-'}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-semibold">
                          {formatKg(result.squat.best)}
                        </span>
                        {hasAttemptResults &&
                          result.squat.attempts.some(
                            (a) => a.good !== null
                          ) && (
                            <div className="flex items-center gap-0.5">
                              {result.squat.attempts
                                .filter((a) => a.weight > 0)
                                .map((a, i) => (
                                  <AttemptBadge key={i} good={a.good} />
                                ))}
                            </div>
                          )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-semibold">
                          {formatKg(result.bench.best)}
                        </span>
                        {hasAttemptResults &&
                          result.bench.attempts.some(
                            (a) => a.good !== null
                          ) && (
                            <div className="flex items-center gap-0.5">
                              {result.bench.attempts
                                .filter((a) => a.weight > 0)
                                .map((a, i) => (
                                  <AttemptBadge key={i} good={a.good} />
                                ))}
                            </div>
                          )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-semibold">
                          {formatKg(result.deadlift.best)}
                        </span>
                        {hasAttemptResults &&
                          result.deadlift.attempts.some(
                            (a) => a.good !== null
                          ) && (
                            <div className="flex items-center gap-0.5">
                              {result.deadlift.attempts
                                .filter((a) => a.weight > 0)
                                .map((a, i) => (
                                  <AttemptBadge key={i} good={a.good} />
                                ))}
                            </div>
                          )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="font-bold text-base">
                        {formatKg(result.total)}
                      </span>
                    </td>
                    {hasAttemptResults && (
                      <td className="py-3 px-2 text-center text-muted-foreground text-xs">
                        {result.attemptedCount > 0
                          ? `${result.madeCount}/${result.attemptedCount}`
                          : '-'}
                      </td>
                    )}
                    {hasScores && (
                      <>
                        <td className="py-3 px-2 text-center">
                          {result.dotsScore != null ? (
                            <Badge variant="secondary" className="font-mono text-xs">
                              {formatScore(result.dotsScore)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              -
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {result.wilksScore != null ? (
                            <Badge variant="outline" className="font-mono text-xs">
                              {formatScore(result.wilksScore)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              -
                            </span>
                          )}
                        </td>
                      </>
                    )}
                    {hasScores && (
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setGenderOverrides((prev) => ({
                              ...prev,
                              [entry.athleteId]:
                                currentGender === 'male' ? 'female' : 'male',
                            }))
                          }
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          title="Click to toggle gender for score calculation"
                        >
                          {currentGender === 'male' ? 'M' : 'F'}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!hasScores && results.some((r) => r.bodyweight == null) && (
          <p className="mt-3 text-xs text-muted-foreground">
            DOTS and Wilks scores require bodyweight data. Update athlete
            profiles to see scores.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
