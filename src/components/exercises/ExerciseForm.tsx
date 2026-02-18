'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Play } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';

interface ExerciseFormData {
  id?: string;
  name: string;
  category: string;
  force: string | null;
  level: string | null;
  mechanic: string | null;
  equipment: string | null;
  videoUrl: string | null;
  cues: string | null;
  tags: string[];
}

interface ExerciseFormProps {
  coachId: string;
  exercise?: ExerciseFormData;
}

const CATEGORIES = [
  { value: 'strength', label: 'Strength' },
  { value: 'powerlifting', label: 'Powerlifting' },
  { value: 'olympic weightlifting', label: 'Olympic Weightlifting' },
  { value: 'strongman', label: 'Strongman' },
  { value: 'plyometrics', label: 'Plyometrics' },
  { value: 'stretching', label: 'Stretching' },
  { value: 'cardio', label: 'Cardio' },
];

const FORCE_OPTIONS = [
  { value: '', label: '— None —' },
  { value: 'push', label: 'Push' },
  { value: 'pull', label: 'Pull' },
  { value: 'static', label: 'Static' },
];

const LEVEL_OPTIONS = [
  { value: '', label: '— None —' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
];

const MECHANIC_OPTIONS = [
  { value: '', label: '— None —' },
  { value: 'compound', label: 'Compound' },
  { value: 'isolation', label: 'Isolation' },
];

const TAG_OPTIONS = [
  { value: 'competition_lift', label: 'Competition Lift' },
  { value: 'competition_variation', label: 'Competition Variation' },
  { value: 'accessory', label: 'Accessory' },
  { value: 'gpp', label: 'GPP' },
];

function getVideoEmbedUrl(url: string): string | null {
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return null;
}

export function ExerciseForm({ coachId, exercise }: ExerciseFormProps) {
  const isEditing = !!exercise?.id;
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(exercise?.name ?? '');
  const [category, setCategory] = useState(exercise?.category ?? 'strength');
  const [force, setForce] = useState(exercise?.force ?? '');
  const [level, setLevel] = useState(exercise?.level ?? '');
  const [mechanic, setMechanic] = useState(exercise?.mechanic ?? '');
  const [equipment, setEquipment] = useState(exercise?.equipment ?? '');
  const [videoUrl, setVideoUrl] = useState(exercise?.videoUrl ?? '');
  const [cues, setCues] = useState(exercise?.cues ?? '');
  const [tags, setTags] = useState<string[]>(exercise?.tags ?? []);

  const embedUrl = videoUrl ? getVideoEmbedUrl(videoUrl) : null;

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...(isEditing ? {} : { coachId }),
        name: name.trim(),
        category,
        force: force || null,
        level: level || null,
        mechanic: mechanic || null,
        equipment: equipment.trim() || null,
        videoUrl: videoUrl.trim() || null,
        cues: cues.trim() || null,
        tags,
      };

      const url = isEditing ? `/api/exercises/${exercise.id}` : '/api/exercises';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} exercise`);
      }

      router.push('/exercises');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/exercises">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? `Edit: ${exercise.name}` : 'Add Exercise'}
        </h1>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Exercise Info</h2>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Larsen Press"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment">Equipment</Label>
            <Input
              id="equipment"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="e.g. barbell, dumbbell, cable"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="force">Force</Label>
              <select
                id="force"
                value={force}
                onChange={(e) => setForce(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {FORCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mechanic">Mechanic</Label>
              <select
                id="mechanic"
                value={mechanic}
                onChange={(e) => setMechanic(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {MECHANIC_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Tags</h2>
          <div className="flex gap-4 flex-wrap">
            {TAG_OPTIONS.map((tag) => (
              <div key={tag.value} className="flex items-center gap-2">
                <Checkbox
                  id={`tag-${tag.value}`}
                  checked={tags.includes(tag.value)}
                  onCheckedChange={() => toggleTag(tag.value)}
                />
                <Label htmlFor={`tag-${tag.value}`} className="cursor-pointer">
                  {tag.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Video & Cues</h2>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL (YouTube or Vimeo)</Label>
            <Input
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          {videoUrl && embedUrl && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Play className="h-4 w-4" />
                Video Preview
              </div>
              <div className="relative w-full aspect-video rounded-md overflow-hidden border border-border">
                <iframe
                  src={embedUrl}
                  title="Video preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          )}

          {videoUrl && !embedUrl && (
            <p className="text-sm text-muted-foreground">
              Enter a valid YouTube or Vimeo URL to see a preview.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="cues">Coaching Cues</Label>
            <Textarea
              id="cues"
              value={cues}
              onChange={(e) => setCues(e.target.value)}
              placeholder="Key coaching cues for this exercise..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" asChild>
          <Link href="/exercises">Cancel</Link>
        </Button>
        <Button type="submit" disabled={submitting || !name.trim()}>
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitting
            ? isEditing ? 'Saving...' : 'Creating...'
            : isEditing ? 'Save Changes' : 'Create Exercise'}
        </Button>
      </div>
    </form>
  );
}
