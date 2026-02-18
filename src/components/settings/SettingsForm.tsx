'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { showSuccess, showError } from '@/lib/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormError } from '@/components/ui/form-error';
import { settingsFormSchema, validateForm } from '@/lib/validations';

interface CoachSettings {
  id: string;
  name: string;
  email: string;
  brandName: string | null;
  defaultWeightUnit: 'kg' | 'lbs';
  timezone: string;
  defaultRestTimerSeconds: number;
  notificationPreferences: {
    emailOnWorkoutComplete: boolean;
    emailOnCheckIn: boolean;
  };
}

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Asia/Tokyo',
  'Asia/Singapore',
];

export function SettingsForm({ initialData }: { initialData: CoachSettings }) {
  const [formData, setFormData] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errors = validateForm(settingsFormSchema, formData);
    setFieldErrors(errors);
  }

  function fieldError(field: string) {
    return touched[field] ? fieldErrors[field] : undefined;
  }

  async function handleSave() {
    const errors = validateForm(settingsFormSchema, formData);
    setFieldErrors(errors);

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    for (const key of Object.keys(formData)) {
      allTouched[key] = true;
    }
    setTouched(allTouched);

    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        const errMsg = data.error || 'Failed to save settings.';
        setMessage({ type: 'error', text: errMsg });
        showError(errMsg);
        return;
      }

      const updated = await res.json();
      setFormData(updated);
      setFieldErrors({});
      setMessage({ type: 'success', text: 'Settings saved successfully.' });
      showSuccess('Settings saved');
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      showError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your coaching profile information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onBlur={() => handleBlur('name')}
              className={fieldError('name') ? 'border-destructive' : ''}
            />
            <FormError message={fieldError('name')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onBlur={() => handleBlur('email')}
              className={fieldError('email') ? 'border-destructive' : ''}
            />
            <FormError message={fieldError('email')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brandName">Brand Name</Label>
            <Input
              id="brandName"
              value={formData.brandName ?? ''}
              placeholder="e.g. Cannoli Strength"
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value || null })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Default settings for training and display.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultWeightUnit">Default Weight Unit</Label>
            <select
              id="defaultWeightUnit"
              value={formData.defaultWeightUnit}
              onChange={(e) =>
                setFormData({ ...formData, defaultWeightUnit: e.target.value as 'kg' | 'lbs' })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="lbs">Pounds (lbs)</option>
              <option value="kg">Kilograms (kg)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultRestTimerSeconds">Default Rest Timer (seconds) *</Label>
            <Input
              id="defaultRestTimerSeconds"
              type="number"
              min={0}
              max={600}
              value={formData.defaultRestTimerSeconds}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultRestTimerSeconds: parseInt(e.target.value) || 0,
                })
              }
              onBlur={() => handleBlur('defaultRestTimerSeconds')}
              className={fieldError('defaultRestTimerSeconds') ? 'border-destructive' : ''}
            />
            <FormError message={fieldError('defaultRestTimerSeconds')} />
            {!fieldError('defaultRestTimerSeconds') && (
              <p className="text-xs text-muted-foreground">
                Default rest period between sets (0-600 seconds).
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Email notification preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="emailOnWorkoutComplete"
              checked={formData.notificationPreferences.emailOnWorkoutComplete}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  notificationPreferences: {
                    ...formData.notificationPreferences,
                    emailOnWorkoutComplete: checked === true,
                  },
                })
              }
            />
            <Label htmlFor="emailOnWorkoutComplete" className="font-normal">
              Email me when an athlete completes a workout
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="emailOnCheckIn"
              checked={formData.notificationPreferences.emailOnCheckIn}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  notificationPreferences: {
                    ...formData.notificationPreferences,
                    emailOnCheckIn: checked === true,
                  },
                })
              }
            />
            <Label htmlFor="emailOnCheckIn" className="font-normal">
              Email me for athlete check-in reminders
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        {message && (
          <p
            className={
              message.type === 'success' ? 'text-sm text-green-600' : 'text-sm text-red-600'
            }
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
