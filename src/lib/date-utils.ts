/**
 * Timezone-safe date utilities.
 *
 * The core problem: `new Date("2026-02-19")` parses as UTC midnight, but
 * local getters like `getDate()` return local-time values — shifting the
 * day back by one in western timezones. Similarly, `toISOString()` converts
 * to UTC before extracting the date string, which can shift forward.
 *
 * These helpers always operate in the user's local timezone.
 */

/** Format a Date object as YYYY-MM-DD using local timezone. */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Get today's date as YYYY-MM-DD in local timezone. */
export function todayLocal(): string {
  return formatLocalDate(new Date());
}

/**
 * Parse a date string (YYYY-MM-DD or full ISO) as local midnight.
 * This avoids the UTC-parsing trap of `new Date("2026-02-19")`.
 */
export function parseLocalDate(dateStr: string): Date {
  // If it's a bare YYYY-MM-DD, parse components directly
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  // For full ISO strings (from APIs), append T00:00:00 trick won't help —
  // extract the date portion and parse as local
  const datePart = dateStr.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [y, m, d] = datePart.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  // Fallback: return as-is (shouldn't happen with well-formed dates)
  return new Date(dateStr);
}

/** Add days to a date, returning YYYY-MM-DD in local timezone. */
export function addDaysLocal(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

/** Get Monday of the week containing the given date, as YYYY-MM-DD local. */
export function getMondayLocal(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return formatLocalDate(d);
}

/** Human-readable local date: "Monday, February 19, 2026" */
export function displayLocalDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Short local date: "Feb 19, 2026" */
export function shortLocalDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Short date without year: "Feb 19" */
export function shortLocalDateNoYear(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Weekday + short date: "Wed, Feb 19" */
export function weekdayShortDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ────────────────────────────────────────────────────────────────
// Server-side timezone-aware utilities
//
// On the server (Railway, UTC), `new Date()` returns UTC time.
// These functions use Intl.DateTimeFormat to convert to the
// coach's IANA timezone before extracting the date.
// ────────────────────────────────────────────────────────────────

/**
 * Format a Date as YYYY-MM-DD in a specific IANA timezone.
 * Works on server (UTC) by using Intl.DateTimeFormat.
 */
export function formatDateInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // en-CA gives YYYY-MM-DD
}

/**
 * Get "today" as YYYY-MM-DD in a specific timezone.
 */
export function todayInTimezone(timezone: string): string {
  return formatDateInTimezone(new Date(), timezone);
}

/**
 * Get "today" as a Date object (midnight UTC for Prisma @db.Date queries)
 * in a specific timezone.
 */
export function todayDateInTimezone(timezone: string): Date {
  const dateStr = todayInTimezone(timezone);
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Convert a Prisma DateTime/@db.Date value to YYYY-MM-DD string.
 * Prisma @db.Date stores as UTC midnight — extract with UTC getters.
 */
export function formatPrismaDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parse YYYY-MM-DD to a Date suitable for Prisma @db.Date queries.
 * Creates UTC midnight (matching how Prisma stores @db.Date).
 */
export function parseDateForPrisma(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Get start of week (Monday) in a timezone, as YYYY-MM-DD.
 */
export function getMondayInTimezone(timezone: string): string {
  const todayStr = todayInTimezone(timezone);
  const [y, m, d] = todayStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return formatLocalDate(date);
}
