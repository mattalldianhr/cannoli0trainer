'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star } from 'lucide-react';

interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
  isRecent: boolean;
  category: string;
  tags: string[];
}

interface PersonalRecordsListProps {
  personalRecords: PersonalRecord[];
}

const CATEGORY_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Competition Lifts', value: 'competition_lift' },
  { label: 'Variations', value: 'competition_variation' },
  { label: 'Accessories', value: 'accessory' },
] as const;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Personal records list showing all-time bests per exercise.
 * "New PR" badge for records set in the last 7 days.
 * Filterable by exercise category (competition lifts, variations, accessories).
 * Sorted most recent first.
 */
export function PersonalRecordsList({
  personalRecords,
}: PersonalRecordsListProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filteredRecords = useMemo(() => {
    if (activeFilter === 'all') return personalRecords;
    return personalRecords.filter((pr) => pr.tags.includes(activeFilter));
  }, [personalRecords, activeFilter]);

  // Count records per category for filter chip counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: personalRecords.length };
    for (const pr of personalRecords) {
      for (const tag of pr.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1;
      }
    }
    return counts;
  }, [personalRecords]);

  if (personalRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-5 w-5" />
            Personal Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            Hit PRs in training to see your records here.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-5 w-5" />
          Personal Records
          <Badge variant="outline" className="ml-auto text-xs font-normal">
            {personalRecords.length} exercises
          </Badge>
        </CardTitle>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {CATEGORY_FILTERS.map((filter) => {
            const count = categoryCounts[filter.value] ?? 0;
            if (filter.value !== 'all' && count === 0) return null;
            const isActive = activeFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {filter.label}
                {filter.value !== 'all' && (
                  <span className="ml-1 opacity-70">({count})</span>
                )}
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {filteredRecords.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            No records in this category.
          </div>
        ) : (
          <div className="divide-y">
            {filteredRecords.map((pr) => (
              <div
                key={pr.exerciseId}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                {/* PR icon */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    pr.isRecent
                      ? 'bg-amber-50 text-amber-500'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Star
                    className={`h-4 w-4 ${pr.isRecent ? 'fill-amber-500' : ''}`}
                  />
                </div>

                {/* Exercise info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {pr.exerciseName}
                    </p>
                    {pr.isRecent && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 shrink-0 text-[10px] px-1.5 py-0">
                        New PR
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(pr.date)}
                  </p>
                </div>

                {/* Weight */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tabular-nums">
                    {pr.weight}
                    <span className="text-xs font-normal text-muted-foreground ml-0.5">
                      kg
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
