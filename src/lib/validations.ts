import { z } from 'zod';

// --- Athlete Form ---

export const athleteFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z
    .string()
    .trim()
    .transform((v) => v || null)
    .pipe(z.string().email('Enter a valid email address').nullable()),
  bodyweight: z
    .string()
    .transform((v) => (v ? parseFloat(v) : null))
    .pipe(
      z
        .number()
        .positive('Bodyweight must be positive')
        .max(500, 'Bodyweight seems too high')
        .nullable()
    ),
  weightClass: z
    .string()
    .trim()
    .transform((v) => v || null),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  isRemote: z.boolean(),
  isCompetitor: z.boolean(),
  federation: z
    .string()
    .trim()
    .transform((v) => v || null),
  notes: z
    .string()
    .trim()
    .transform((v) => v || null),
});

export type AthleteFormData = z.input<typeof athleteFormSchema>;

// --- Exercise Form ---

export const exerciseFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  force: z
    .string()
    .transform((v) => v || null),
  level: z
    .string()
    .transform((v) => v || null),
  mechanic: z
    .string()
    .transform((v) => v || null),
  equipment: z
    .string()
    .trim()
    .transform((v) => v || null),
  videoUrl: z
    .string()
    .trim()
    .transform((v) => v || null)
    .pipe(
      z
        .string()
        .url('Enter a valid URL')
        .nullable()
    ),
  cues: z
    .string()
    .trim()
    .transform((v) => v || null),
  tags: z.array(z.string()),
});

export type ExerciseFormData = z.input<typeof exerciseFormSchema>;

// --- Settings Form ---

export const settingsFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Enter a valid email address'),
  brandName: z
    .string()
    .trim()
    .transform((v) => v || null),
  defaultWeightUnit: z.enum(['kg', 'lbs']),
  timezone: z.string().min(1, 'Timezone is required'),
  defaultRestTimerSeconds: z
    .number()
    .int('Must be a whole number')
    .min(0, 'Must be at least 0 seconds')
    .max(600, 'Must be at most 600 seconds'),
  notificationPreferences: z.object({
    emailOnWorkoutComplete: z.boolean(),
    emailOnCheckIn: z.boolean(),
  }),
});

export type SettingsFormData = z.input<typeof settingsFormSchema>;

// --- Meet Form ---

export const meetFormSchema = z.object({
  name: z.string().trim().min(1, 'Meet name is required'),
  date: z.string().min(1, 'Date is required'),
  federation: z
    .string()
    .trim()
    .transform((v) => v || null),
  location: z
    .string()
    .trim()
    .transform((v) => v || null),
});

export type MeetFormData = z.input<typeof meetFormSchema>;

// --- Athlete Login ---

export const athleteLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Please enter your email address')
    .email('Enter a valid email address'),
});

export type AthleteLoginData = z.input<typeof athleteLoginSchema>;

// --- Helpers ---

/**
 * Validate a single field against a schema and return the error message or null.
 */
export function validateField<T extends z.ZodType>(
  schema: T,
  value: unknown
): string | null {
  const result = schema.safeParse(value);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? 'Invalid value';
}

/**
 * Validate an entire form object and return a record of field -> error message.
 */
export function validateForm<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): Record<string, string> {
  const result = schema.safeParse(data);
  if (result.success) return {};

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (path && !errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}
