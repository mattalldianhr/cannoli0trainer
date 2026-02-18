'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Calendar, Users, Dumbbell, BookTemplate } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type TabType = 'programs' | 'templates';

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
  const [activeTab, setActiveTab] = useState<TabType>('programs');

  const filtered = programs.filter((program) => {
    // Tab filter
    if (activeTab === 'templates' && !program.isTemplate) return false;
    if (activeTab === 'programs' && program.isTemplate) return false;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      const matchesName = program.name.toLowerCase().includes(q);
      const matchesDesc = program.description?.toLowerCase().includes(q);
      if (!matchesName && !matchesDesc) return false;
    }

    return true;
  });

  const programCount = programs.filter((p) => !p.isTemplate).length;
  const templateCount = programs.filter((p) => p.isTemplate).length;

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
        <button
          onClick={() => setActiveTab('programs')}
          className={cn(
            'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors',
            activeTab === 'programs'
              ? 'bg-primary text-primary-foreground border-transparent'
              : 'bg-background text-muted-foreground border-border hover:bg-muted'
          )}
        >
          <Dumbbell className="h-3.5 w-3.5 mr-1.5" />
          Programs ({programCount})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={cn(
            'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors',
            activeTab === 'templates'
              ? 'bg-primary text-primary-foreground border-transparent'
              : 'bg-background text-muted-foreground border-border hover:bg-muted'
          )}
        >
          <BookTemplate className="h-3.5 w-3.5 mr-1.5" />
          Templates ({templateCount})
        </button>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} {activeTab === 'templates' ? 'template' : 'program'}
        {filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Program Cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search
              ? `No ${activeTab} match your search.`
              : activeTab === 'templates'
                ? 'No templates yet. Save a program as a template to reuse it.'
                : 'No programs yet. Create one to get started.'}
          </CardContent>
        </Card>
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
                          {program.isTemplate && (
                            <Badge variant="outline" className="text-xs">Template</Badge>
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
                        {!program.isTemplate && (
                          <div>
                            <p className="text-xs text-muted-foreground">Athletes</p>
                            <p className="font-semibold flex items-center justify-end gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {program._count.assignments}
                            </p>
                          </div>
                        )}
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
