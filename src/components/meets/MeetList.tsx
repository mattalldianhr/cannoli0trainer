'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, MapPin, Trophy, Calendar, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { CreateMeetDialog } from './CreateMeetDialog';

type FilterType = 'all' | 'upcoming' | 'past';

interface MeetData {
  id: string;
  name: string;
  date: string;
  federation: string | null;
  location: string | null;
  athleteCount: number;
}

interface MeetListProps {
  meets: MeetData[];
  coachId: string;
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function MeetList({ meets, coachId }: MeetListProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = meets.filter((meet) => {
    if (search) {
      const q = search.toLowerCase();
      const matchesName = meet.name.toLowerCase().includes(q);
      const matchesFed = meet.federation?.toLowerCase().includes(q);
      const matchesLoc = meet.location?.toLowerCase().includes(q);
      if (!matchesName && !matchesFed && !matchesLoc) return false;
    }

    const now = new Date();
    const meetDate = new Date(meet.date);

    switch (activeFilter) {
      case 'upcoming':
        return meetDate >= now;
      case 'past':
        return meetDate < now;
      default:
        return true;
    }
  });

  return (
    <div className="space-y-4">
      {/* Search + Create */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">New Meet</span>
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
        {filtered.length} meet{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Meet Cards */}
      {filtered.length === 0 ? (
        search ? (
          <EmptyState
            icon={Search}
            title="No meets match your search"
            description="Try a different search term."
          />
        ) : meets.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No meets scheduled yet"
            description="Create your first meet to start tracking competition prep."
            action={
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Your First Meet
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Calendar}
            title="No meets match the selected filter"
            description="Try a different filter."
          />
        )
      ) : (
        <div className="grid gap-3">
          {filtered.map((meet) => {
            const days = daysUntil(meet.date);
            const isUpcoming = days >= 0;
            const isPast = days < 0;

            return (
              <Link key={meet.id} href={`/meets/${meet.id}`} className="min-w-0">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      {/* Left: Name + details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold truncate">{meet.name}</span>
                          {isUpcoming && days <= 30 && (
                            <Badge variant="default" className="text-xs">
                              {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d away`}
                            </Badge>
                          )}
                          {isPast && (
                            <Badge variant="secondary" className="text-xs">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-muted-foreground flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(meet.date)}
                          </span>
                          {meet.federation && (
                            <span className="inline-flex items-center gap-1">
                              <Trophy className="h-3.5 w-3.5" />
                              {meet.federation}
                            </span>
                          )}
                          {meet.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {meet.location}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Athlete count */}
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                        <Users className="h-4 w-4" />
                        <span className="font-semibold">{meet.athleteCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <CreateMeetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        coachId={coachId}
      />
    </div>
  );
}
