'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Search, Plus, Dumbbell, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { DeleteExerciseDialog } from './DeleteExerciseDialog';

interface ExerciseData {
  id: string;
  name: string;
  category: string;
  force: string | null;
  level: string | null;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  tags: string[];
  videoUrl: string | null;
}

const PAGE_SIZE = 30;

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'strength', label: 'Strength' },
  { key: 'powerlifting', label: 'Powerlifting' },
  { key: 'olympic weightlifting', label: 'Olympic' },
  { key: 'strongman', label: 'Strongman' },
  { key: 'plyometrics', label: 'Plyometrics' },
  { key: 'stretching', label: 'Stretching' },
  { key: 'cardio', label: 'Cardio' },
];

const TAG_FILTERS = [
  { key: 'competition_lift', label: 'Competition Lifts' },
  { key: 'competition_variation', label: 'Variations' },
  { key: 'accessory', label: 'Accessory' },
  { key: 'gpp', label: 'GPP' },
];

export function ExerciseList() {
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const buildUrl = useCallback((offset: number, searchVal: string, category: string, tags: string[]) => {
    const params = new URLSearchParams({
      paginated: 'true',
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (searchVal) params.set('search', searchVal);
    if (category !== 'all') params.set('category', category);
    if (tags.length > 0) params.set('tag', tags[0]);
    return `/api/exercises?${params.toString()}`;
  }, []);

  const fetchExercises = useCallback(async (offset: number, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await fetch(buildUrl(offset, search, activeCategory, activeTags));
      if (res.ok) {
        const json = await res.json();
        const data = json.data.map((ex: ExerciseData) => ({
          ...ex,
          primaryMuscles: (ex.primaryMuscles as string[]) ?? [],
          tags: (ex.tags as string[]) ?? [],
        }));
        if (append) {
          setExercises(prev => [...prev, ...data]);
        } else {
          setExercises(data);
        }
        setTotal(json.total);
        setHasMore(json.hasMore);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, activeCategory, activeTags, buildUrl]);

  // Fetch on mount and when filters change (debounced for search)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchExercises(0);
    }, search ? 300 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchExercises, search]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchExercises(exercises.length, true);
    }
  };

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="space-y-4">
      {/* Search + Add */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link href="/exercises/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Link>
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={cn(
              'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors',
              activeCategory === cat.key
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'bg-background text-muted-foreground border-border hover:bg-muted'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tag Filters */}
      <div className="flex gap-2 flex-wrap">
        {TAG_FILTERS.map((tag) => (
          <button
            key={tag.key}
            onClick={() => toggleTag(tag.key)}
            className={cn(
              'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors',
              activeTags.includes(tag.key)
                ? 'bg-secondary text-secondary-foreground border-transparent'
                : 'bg-background text-muted-foreground border-border hover:bg-muted'
            )}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        {loading ? 'Loading...' : `${total} exercise${total !== 1 ? 's' : ''}`}
        {!loading && exercises.length < total && ` (showing ${exercises.length})`}
      </p>

      {/* Exercise Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : exercises.length === 0 ? (
        (search || activeCategory !== 'all' || activeTags.length > 0) ? (
          <EmptyState
            icon={Search}
            title="No exercises match your filters"
            description="Try adjusting your search or filters."
          />
        ) : (
          <EmptyState
            icon={Dumbbell}
            title="No exercises found"
            description="Add a custom exercise to get started."
            action={
              <Button asChild>
                <Link href="/exercises/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exercise
                </Link>
              </Button>
            }
          />
        )
      ) : (
        <div className="grid gap-3">
          {exercises.map((exercise) => (
            <Card key={exercise.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Name + badges */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Dumbbell className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-semibold truncate">{exercise.name}</span>
                      {exercise.tags.includes('competition_lift') && (
                        <Badge variant="default" className="text-xs">Competition</Badge>
                      )}
                      {exercise.tags.includes('competition_variation') && (
                        <Badge variant="secondary" className="text-xs">Variation</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground ml-6">
                      <span className="capitalize">{exercise.category}</span>
                      {exercise.equipment && (
                        <span className="capitalize">{exercise.equipment}</span>
                      )}
                      {exercise.primaryMuscles.length > 0 && (
                        <span className="capitalize hidden sm:inline">
                          {exercise.primaryMuscles.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: metadata + edit */}
                  <div className="flex items-center gap-3 text-sm text-right shrink-0">
                    {exercise.force && (
                      <div className="hidden sm:block">
                        <p className="text-xs text-muted-foreground">Force</p>
                        <p className="font-semibold capitalize">{exercise.force}</p>
                      </div>
                    )}
                    {exercise.level && (
                      <div className="hidden sm:block">
                        <p className="text-xs text-muted-foreground">Level</p>
                        <p className="font-semibold capitalize">{exercise.level}</p>
                      </div>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/exercises/${exercise.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit {exercise.name}</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget({ id: exercise.id, name: exercise.name })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Delete {exercise.name}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Load More (${exercises.length} of ${total})`
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {deleteTarget && (
        <DeleteExerciseDialog
          exerciseId={deleteTarget.id}
          exerciseName={deleteTarget.name}
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
