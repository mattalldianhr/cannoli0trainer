'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Calendar, Users, Dumbbell, BookTemplate, ClipboardList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';

interface ProgramData {
  id: string;
  name: string;
  description: string | null;
  type: string;
  periodizationType: string | null;
  isTemplate: boolean;
  startDate: string | null;
  endDate: string | null;
  updatedAt: string;
  _count: {
    workouts: number;
    assignments: number;
  };
}

interface ProgramListProps {
  programs: ProgramData[];
}

const PERIODIZATION_LABELS: Record<string, string> = {
  block: 'Block',
  dup: 'DUP',
  linear: 'Linear',
  rpe_based: 'RPE-Based',
  hybrid: 'Hybrid',
};

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function durationWeeks(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const weeks = Math.round(diff / (1000 * 60 * 60 * 24 * 7));
  if (weeks <= 0) return null;
  return `${weeks} week${weeks !== 1 ? 's' : ''}`;
}

export function ProgramList({ programs }: ProgramListProps) {
  const [search, setSearch] = useState('');

  const nonTemplates = programs.filter((p) => !p.isTemplate);
  const templateCount = programs.filter((p) => p.isTemplate).length;

  const filtered = nonTemplates.filter((program) => {
    if (search) {
      const q = search.toLowerCase();
      const matchesName = program.name.toLowerCase().includes(q);
      const matchesDesc = program.description?.toLowerCase().includes(q);
      if (!matchesName && !matchesDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search + New Program */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link href="/programs/new">
            <Plus className="h-4 w-4 mr-2" />
            New Program
          </Link>
        </Button>
      </div>

      {/* Tab Chips */}
      <div className="flex gap-2">
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-primary text-primary-foreground border-transparent">
          <Dumbbell className="h-3.5 w-3.5 mr-1.5" />
          Programs ({nonTemplates.length})
        </span>
        <Link
          href="/programs/templates"
          className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors bg-background text-muted-foreground border-border hover:bg-muted"
        >
          <BookTemplate className="h-3.5 w-3.5 mr-1.5" />
          Templates ({templateCount})
        </Link>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} program{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Program Cards */}
      {filtered.length === 0 ? (
        search ? (
          <EmptyState
            icon={Search}
            title="No programs match your search"
            description="Try a different search term."
          />
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No training programs yet"
            description="Create your first program to start building athlete training plans."
            action={
              <Button asChild>
                <Link href="/programs/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Program
                </Link>
              </Button>
            }
          />
        )
      ) : (
        <div className="grid gap-3">
          {filtered.map((program) => {
            const duration = durationWeeks(program.startDate, program.endDate);

            return (
              <Link key={program.id} href={`/programs/${program.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Name + metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold truncate">{program.name}</span>
                          {program.periodizationType && (
                            <Badge variant="secondary" className="text-xs">
                              {PERIODIZATION_LABELS[program.periodizationType] ?? program.periodizationType}
                            </Badge>
                          )}
                        </div>
                        {program.description && (
                          <p className="text-sm text-muted-foreground mt-0.5 truncate">
                            {program.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          {duration && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {duration}
                            </span>
                          )}
                          {program.startDate && !duration && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(program.startDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick stats */}
                      <div className="flex items-center gap-4 text-sm text-right shrink-0">
                        <div>
                          <p className="text-xs text-muted-foreground">Workouts</p>
                          <p className="font-semibold">{program._count.workouts}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Athletes</p>
                          <p className="font-semibold flex items-center justify-end gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {program._count.assignments}
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
