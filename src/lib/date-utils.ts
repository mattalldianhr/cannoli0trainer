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
