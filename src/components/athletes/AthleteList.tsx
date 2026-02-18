'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'competitors' | 'remote' | 'needs_attention';

interface AthleteData {
  id: string;
  name: string;
  email: string | null;
  bodyweight: number | null;
  weightClass: string | null;
  experienceLevel: string;
  isRemote: boolean;
  isCompetitor: boolean;
  federation: string | null;
  notes: string | null;
  _count: {
    setLogs: number;
    workoutSessions: number;
    programAssignments: number;
  };
  lastWorkoutDate: string | null;
  currentProgram: string | null;
}

interface AthleteListProps {
  athletes: AthleteData[];
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'competitors', label: 'Competitors' },
  { key: 'remote', label: 'Remote' },
  { key: 'needs_attention', label: 'Needs Attention' },
];

function daysSinceDate(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function AthleteList({ athletes }: AthleteListProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filtered = athletes.filter((athlete) => {
    if (search) {
      const q = search.toLowerCase();
      const matchesName = athlete.name.toLowerCase().includes(q);
      const matchesEmail = athlete.email?.toLowerCase().includes(q);
      if (!matchesName && !matchesEmail) return false;
    }

    switch (activeFilter) {
      case 'competitors':
        return athlete.isCompetitor;
      case 'remote':
        return athlete.isRemote;
      case 'needs_attention': {
        const days = daysSinceDate(athlete.lastWorkoutDate);
        return days === null || days >= 3;
      }
      default:
        return true;
    }
  });

  return (
    <div className="space-y-4">
      {/* Search + Add */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search athletes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link href="/athletes/new">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Athlete
          </Link>
        </Button>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={cn(
              'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors',
              activeFilter === filter.key
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'bg-background text-muted-foreground border-border hover:bg-muted'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} athlete{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Athlete Cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search ? 'No athletes match your search.' : 'No athletes found.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((athlete) => {
            const daysSince = daysSinceDate(athlete.lastWorkoutDate);
            const needsAttention = daysSince === null || daysSince >= 3;

            return (
              <Link key={athlete.id} href={`/athletes/${athlete.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Name + badges */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold truncate">{athlete.name}</span>
                          {athlete.isCompetitor && (
                            <Badge variant="default" className="text-xs">Competitor</Badge>
                          )}
                          {athlete.isRemote && (
                            <Badge variant="secondary" className="text-xs">Remote</Badge>
                          )}
                          {needsAttention && (
                            <Badge variant="destructive" className="text-xs">Needs Attention</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          {athlete.currentProgram && (
                            <span>{athlete.currentProgram}</span>
                          )}
                          {athlete.bodyweight && (
                            <span>{athlete.bodyweight} kg</span>
                          )}
                          {athlete.experienceLevel && (
                            <span className="capitalize">{athlete.experienceLevel}</span>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick stats */}
                      <div className="flex items-center gap-4 text-sm text-right shrink-0">
                        <div>
                          <p className="text-xs text-muted-foreground">Sessions</p>
                          <p className="font-semibold">{athlete._count.workoutSessions}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Sets</p>
                          <p className="font-semibold">{athlete._count.setLogs}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-xs text-muted-foreground">Last Workout</p>
                          <p className={cn('font-semibold', needsAttention && 'text-destructive')}>
                            {athlete.lastWorkoutDate
                              ? daysSince === 0
                                ? 'Today'
                                : daysSince === 1
                                  ? 'Yesterday'
                                  : `${daysSince}d ago`
                              : 'Never'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
