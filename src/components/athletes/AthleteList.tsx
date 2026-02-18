'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, UserPlus, ClipboardList, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { BulkAssignDialog } from './BulkAssignDialog';

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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

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

  const isSelecting = selected.size > 0;

  const toggleAthlete = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((a) => a.id)));
    }
  };

  const clearSelection = () => {
    setSelected(new Set());
  };

  const selectedNames = athletes
    .filter((a) => selected.has(a.id))
    .map((a) => a.name);

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

      {/* Results Count + Select All */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} athlete{filtered.length !== 1 ? 's' : ''}
        </p>
        {filtered.length > 0 && (
          <button
            onClick={toggleAll}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {selected.size === filtered.length ? 'Deselect all' : 'Select all'}
          </button>
        )}
      </div>

      {/* Bulk Action Bar */}
      {isSelecting && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2.5">
          <span className="text-sm font-medium">
            {selected.size} selected
          </span>
          <div className="flex-1" />
          <Button
            size="sm"
            onClick={() => setAssignDialogOpen(true)}
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Assign Program
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={clearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

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
            const isChecked = selected.has(athlete.id);

            return (
              <Card
                key={athlete.id}
                className={cn(
                  'hover:bg-muted/50 transition-colors cursor-pointer',
                  isChecked && 'ring-2 ring-primary bg-primary/5'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <div
                      className="shrink-0"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleAthlete(athlete.id);
                      }}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleAthlete(athlete.id)}
                        aria-label={`Select ${athlete.name}`}
                      />
                    </div>

                    {/* Card content as link */}
                    <Link href={`/athletes/${athlete.id}`} className="flex-1 min-w-0">
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
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bulk Assign Dialog */}
      <BulkAssignDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        selectedAthleteIds={[...selected]}
        selectedAthleteNames={selectedNames}
        onSuccess={clearSelection}
      />
    </div>
  );
}
