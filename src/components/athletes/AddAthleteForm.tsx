'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { showSuccess, showError } from '@/lib/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { athleteFormSchema, validateForm } from '@/lib/validations';

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bodyweight, setBodyweight] = useState('');
  const [weightClass, setWeightClass] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('intermediate');
  const [isRemote, setIsRemote] = useState(true);
  const [isCompetitor, setIsCompetitor] = useState(false);
  const [federation, setFederation] = useState('');
  const [notes, setNotes] = useState('');

  function getFormData() {
    return {
      name,
      email,
      bodyweight,
      weightClass,
      experienceLevel,
      isRemote,
      isCompetitor,
      federation,
      notes,
    };
  }

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errors = validateForm(athleteFormSchema, getFormData());
    setFieldErrors(errors);
  }

  function fieldError(field: string) {
    return touched[field] ? fieldErrors[field] : undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = getFormData();
    const errors = validateForm(athleteFormSchema, data);
    setFieldErrors(errors);

    // Mark all fields as touched on submit
    const allTouched: Record<string, boolean> = {};
    for (const key of Object.keys(data)) {
      allTouched[key] = true;
    }
    setTouched(allTouched);

    if (Object.keys(errors).length > 0) return;

    const parsed = athleteFormSchema.safeParse(data);
    if (!parsed.success) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId,
          ...parsed.data,
        }),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || 'Failed to create athlete');
      }

      showSuccess('Athlete created successfully');
      router.push('/athletes');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      showError(message);
      setSubmitting(false);
    }
  }

  const hasErrors = Object.keys(fieldErrors).length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
              onBlur={() => handleBlur('name')}
              placeholder="Athlete name"
              className={fieldError('name') ? 'border-destructive' : ''}
            />
            <FormError message={fieldError('name')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="athlete@example.com"
              className={fieldError('email') ? 'border-destructive' : ''}
            />
            <FormError message={fieldError('email')} />
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
                onBlur={() => handleBlur('bodyweight')}
                placeholder="82.5"
                className={fieldError('bodyweight') ? 'border-destructive' : ''}
              />
              <FormError message={fieldError('bodyweight')} />
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
        <Button type="submit" disabled={submitting || hasErrors}>
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitting ? 'Creating...' : 'Create Athlete'}
        </Button>
      </div>
    </form>
  );
}
