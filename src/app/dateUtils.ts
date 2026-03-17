import humanizeDuration from "humanize-duration";

export function formatRelativeTime(date: Date | null | undefined, options?: { handleZero?: 'future' | 'past'}): string {
  options = {
    handleZero: 'future',
    ...options
  };

  if (!date)
    return "";

  const diff = isSameDay(date, new Date())
    ? 0
    : date.getTime() - new Date().getTime();

  const humanized = humanizeDuration(diff, {
    units: ["mo", "d"],
    round: true
  });

  const direction = diff > 0 ? 'future' : diff < 0 ? 'past' : options.handleZero;

  if (direction === 'future')
    return `in ${humanized}`;
  else
    return `${humanized} ago`;
}

function isSameDay(a: Date, b: Date) : boolean {
  return a.getFullYear() == b.getFullYear()
    && a.getMonth() == b.getMonth()
    && a.getDate() == b.getDate();
}

export function addDays(date: Date, n: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + n);
  return result;
}

/**
 * Formats a Date as a YYYY-MM-DD string using the browser's local timezone.
 * Use this to populate <input type="date"> values so the displayed date
 * matches what the user considers "today" rather than the UTC date.
 */
export function localDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parses a YYYY-MM-DD string (from <input type="date">) as local noon.
 * Using T12:00:00 avoids the ECMA spec edge case where bare "YYYY-MM-DD"
 * strings are parsed as UTC midnight, which can shift the calendar date
 * by a full day for users west of UTC.
 */
export function parseLocalDateInput(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

/**
 * Returns the Monday of the week containing `date`, at UTC midnight.
 * Always uses UTC methods so the result is consistent regardless of the
 * server or browser's local timezone.
 */
export function getUTCMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns a Mon=0 … Sun=6 day index derived from the UTC weekday.
 * Use this (instead of local .getDay()) when working with dates stored
 * as UTC midnight, so the weekday is stable across all timezones.
 */
export function utcDayIndex(date: Date): number {
  const day = date.getUTCDay(); // Sun=0, Mon=1, ..., Sat=6
  return day === 0 ? 6 : day - 1; // Mon=0 ... Sun=6
}