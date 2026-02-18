'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Calendar,
  Dumbbell,
  Archive,
  Loader2,
  Copy,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/lib/toast';

interface TemplateData {
  id: string;
  name: string;
  description: string | null;
  type: string;
  periodizationType: string | null;
  startDate: string | null;
  endDate: string | null;
  updatedAt: string;
  _count: {
    workouts: number;
  };
}

interface TemplateListProps {
  templates: TemplateData[];
}

const PERIODIZATION_LABELS: Record<string, string> = {
  block: 'Block',
  dup: 'DUP',
  linear: 'Linear',
  rpe_based: 'RPE-Based',
  hybrid: 'Hybrid',
};

const PERIODIZATION_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'block', label: 'Block' },
  { value: 'dup', label: 'DUP' },
  { value: 'linear', label: 'Linear' },
  { value: 'rpe_based', label: 'RPE-Based' },
  { value: 'hybrid', label: 'Hybrid' },
];

function durationWeeks(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const weeks = Math.round(diff / (1000 * 60 * 60 * 24 * 7));
  if (weeks <= 0) return null;
  return `${weeks} week${weeks !== 1 ? 's' : ''}`;
}

export function TemplateList({ templates }: TemplateListProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [periodizationFilter, setPeriodizationFilter] = useState('');
  const [archiveTarget, setArchiveTarget] = useState<TemplateData | null>(null);
  const [archiving, setArchiving] = useState(false);

  const filtered = templates.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      const matchesName = t.name.toLowerCase().includes(q);
      const matchesDesc = t.description?.toLowerCase().includes(q);
      if (!matchesName && !matchesDesc) return false;
    }

    if (periodizationFilter && t.periodizationType !== periodizationFilter) {
      return false;
    }

    return true;
  });

  const handleArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);

    try {
      const res = await fetch(`/api/programs/${archiveTarget.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to archive template');
      }

      showSuccess('Template archived');
      setArchiveTarget(null);
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to archive template');
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search + Filters + New */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
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

      {/* Periodization Filter Chips */}
      <div className="flex gap-2 flex-wrap">
        {PERIODIZATION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriodizationFilter(opt.value)}
            className={cn(
              'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors',
              periodizationFilter === opt.value
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'bg-background text-muted-foreground border-border hover:bg-muted'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} template{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Template Cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search || periodizationFilter
              ? 'No templates match your filters.'
              : 'No templates yet. Save a program as a template to reuse it.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((template) => {
            const duration = durationWeeks(template.startDate, template.endDate);

            return (
              <Card key={template.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: clickable link area */}
                    <Link href={`/programs/${template.id}`} className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold truncate">{template.name}</span>
                        {template.periodizationType && (
                          <Badge variant="secondary" className="text-xs">
                            {PERIODIZATION_LABELS[template.periodizationType] ?? template.periodizationType}
                          </Badge>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">
                          {template.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        {duration && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {duration}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Dumbbell className="h-3.5 w-3.5" />
                          {template._count.workouts} workout{template._count.workouts !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </Link>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" asChild>
                        <Link href={`/programs/new?templateId=${template.id}`}>
                          <Plus className="h-4 w-4 mr-1" />
                          Use
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/programs/${template.id}`}>
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">View template</span>
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setArchiveTarget(template)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Archive className="h-4 w-4" />
                        <span className="sr-only">Archive template</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      <Dialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive &quot;{archiveTarget?.name}&quot;? It will be
              hidden from the template list. Programs created from this template will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setArchiveTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleArchive} disabled={archiving}>
              {archiving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Archive Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
