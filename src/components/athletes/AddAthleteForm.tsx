'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';

interface AddAthleteFormProps {
  coachId: string;
}

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export function AddAthleteForm({ coachId }: AddAthleteFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bodyweight, setBodyweight] = useState('');
  const [weightClass, setWeightClass] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('intermediate');
  const [isRemote, setIsRemote] = useState(true);
  const [isCompetitor, setIsCompetitor] = useState(false);
  const [federation, setFederation] = useState('');
  const [notes, setNotes] = useState('');

  const nameError = name.trim() === '' ? 'Name is required' : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (nameError) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId,
          name: name.trim(),
          email: email.trim() || null,
          bodyweight: bodyweight ? parseFloat(bodyweight) : null,
          weightClass: weightClass.trim() || null,
          experienceLevel,
          isRemote,
          isCompetitor,
          federation: federation.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create athlete');
      }

      router.push('/athletes');
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
          <Link href="/athletes">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Add Athlete</h1>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Basic Info</h2>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Athlete name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="athlete@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bodyweight">Bodyweight (kg)</Label>
              <Input
                id="bodyweight"
                type="number"
                step="0.1"
                min="0"
                value={bodyweight}
                onChange={(e) => setBodyweight(e.target.value)}
                placeholder="82.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weightClass">Weight Class</Label>
              <Input
                id="weightClass"
                value={weightClass}
                onChange={(e) => setWeightClass(e.target.value)}
                placeholder="83 kg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experienceLevel">Experience Level</Label>
            <select
              id="experienceLevel"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {EXPERIENCE_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Training Details</h2>

          <div className="flex items-center gap-3">
            <Checkbox
              id="isRemote"
              checked={isRemote}
              onCheckedChange={(checked) => setIsRemote(checked === true)}
            />
            <Label htmlFor="isRemote" className="cursor-pointer">
              Remote athlete
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="isCompetitor"
              checked={isCompetitor}
              onCheckedChange={(checked) => setIsCompetitor(checked === true)}
            />
            <Label htmlFor="isCompetitor" className="cursor-pointer">
              Competitor
            </Label>
          </div>

          {isCompetitor && (
            <div className="space-y-2">
              <Label htmlFor="federation">Federation</Label>
              <Input
                id="federation"
                value={federation}
                onChange={(e) => setFederation(e.target.value)}
                placeholder="USAPL, IPF, USPA..."
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Notes</h2>

          <div className="space-y-2">
            <Label htmlFor="notes">Coach Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Injury history, goals, preferences..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" asChild>
          <Link href="/athletes">Cancel</Link>
        </Button>
        <Button type="submit" disabled={submitting || !name.trim()}>
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitting ? 'Creating...' : 'Create Athlete'}
        </Button>
      </div>
    </form>
  );
}
