'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Dumbbell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface ExercisePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exercise: ExerciseData) => void;
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

export function ExercisePicker({ open, onOpenChange, onSelect }: ExercisePickerProps) {
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/exercises');
      if (res.ok) {
        const data = await res.json();
        setExercises(data);
      }
    } catch {
      // silently fail — empty list shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && exercises.length === 0) {
      fetchExercises();
    }
  }, [open, exercises.length, fetchExercises]);

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
        const exerciseTags = exercise.tags as string[];
        const hasTag = activeTags.some((tag) => exerciseTags.includes(tag));
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

  const handleSelect = (exercise: ExerciseData) => {
    onSelect(exercise);
    onOpenChange(false);
    setSearch('');
    setActiveCategory('all');
    setActiveTags([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Exercise</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
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
        <div className="flex gap-1.5 flex-wrap">
          {TAG_FILTERS.map((tag) => (
            <button
              key={tag.key}
              onClick={() => toggleTag(tag.key)}
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
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
        <p className="text-xs text-muted-foreground">
          {loading ? 'Loading...' : `${filtered.length} exercise${filtered.length !== 1 ? 's' : ''}`}
        </p>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Loading exercises...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {search || activeCategory !== 'all' || activeTags.length > 0
                ? 'No exercises match your filters.'
                : 'No exercises found.'}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => handleSelect(exercise)}
                  className="w-full text-left rounded-md border border-transparent px-3 py-2 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-sm truncate">{exercise.name}</span>
                    {exercise.tags.includes('competition_lift') && (
                      <Badge variant="default" className="text-xs shrink-0">Competition</Badge>
                    )}
                    {exercise.tags.includes('competition_variation') && (
                      <Badge variant="secondary" className="text-xs shrink-0">Variation</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground ml-6">
                    <span className="capitalize">{exercise.category}</span>
                    {exercise.equipment && (
                      <span className="capitalize">{exercise.equipment}</span>
                    )}
                    {exercise.primaryMuscles.length > 0 && (
                      <span className="capitalize hidden sm:inline">
                        {(exercise.primaryMuscles as string[]).slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
