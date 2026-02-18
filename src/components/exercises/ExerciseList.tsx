'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Plus, Dumbbell, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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

interface ExerciseListProps {
  exercises: ExerciseData[];
}

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

export function ExerciseList({ exercises }: ExerciseListProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return exercises.filter((exercise) => {
      if (search) {
        const q = search.toLowerCase();
        if (!exercise.name.toLowerCase().includes(q)) return false;
      }

      if (activeCategory !== 'all') {
        if (exercise.category.toLowerCase() !== activeCategory) return false;
      }

      if (activeTags.length > 0) {
        const hasTag = activeTags.some((tag) => exercise.tags.includes(tag));
        if (!hasTag) return false;
      }

      return true;
    });
  }, [exercises, search, activeCategory, activeTags]);

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
        {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Exercise Cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search || activeCategory !== 'all' || activeTags.length > 0
              ? 'No exercises match your filters.'
              : 'No exercises found.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((exercise) => (
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
