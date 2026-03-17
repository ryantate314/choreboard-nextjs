import { describe, it, expect } from 'vitest';
import {
  addDays,
  localDateString,
  parseLocalDateInput,
  getUTCMonday,
  utcDayIndex,
} from './dateUtils';

describe('addDays', () => {
  it('adds a positive number of days to a UTC midnight date', () => {
    const result = addDays(new Date('2026-03-16T00:00:00Z'), 7);
    expect(result.toISOString()).toBe('2026-03-23T00:00:00.000Z');
  });

  it('subtracts days when n is negative', () => {
    const result = addDays(new Date('2026-03-23T00:00:00Z'), -7);
    expect(result.toISOString()).toBe('2026-03-16T00:00:00.000Z');
  });

  it('returns the same timestamp when n is zero', () => {
    const date = new Date('2026-03-16T00:00:00Z');
    const result = addDays(date, 0);
    expect(result.toISOString()).toBe(date.toISOString());
  });

  it('does not mutate the input date', () => {
    const original = new Date('2026-03-16T00:00:00Z');
    const originalTime = original.getTime();
    addDays(original, 7);
    expect(original.getTime()).toBe(originalTime);
  });

  // DST regression: US spring-forward is March 8, 2026 (2am → 3am ET).
  // ms-arithmetic on a LOCAL midnight date would produce 1am or 11pm after the
  // transition; UTC-based setUTCDate must keep the result at UTC midnight.
  it('preserves UTC midnight across a DST spring-forward boundary', () => {
    const result = addDays(new Date('2026-03-07T00:00:00Z'), 7);
    expect(result.toISOString()).toBe('2026-03-14T00:00:00.000Z');
  });

  // DST regression: US fall-back is November 1, 2026 (2am → 1am ET).
  it('preserves UTC midnight across a DST fall-back boundary', () => {
    const result = addDays(new Date('2026-11-01T00:00:00Z'), 7);
    expect(result.toISOString()).toBe('2026-11-08T00:00:00.000Z');
  });

  it('handles month and year boundaries', () => {
    expect(addDays(new Date('2026-01-28T00:00:00Z'), 7).toISOString()).toBe('2026-02-04T00:00:00.000Z');
    expect(addDays(new Date('2026-12-28T00:00:00Z'), 7).toISOString()).toBe('2027-01-04T00:00:00.000Z');
  });
});

describe('localDateString', () => {
  it('formats a local midnight date as YYYY-MM-DD', () => {
    // new Date(year, month, day) creates local midnight — result must match the local calendar date
    expect(localDateString(new Date(2026, 2, 16))).toBe('2026-03-16');
  });

  it('zero-pads single-digit months and days', () => {
    expect(localDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(localDateString(new Date(2026, 8, 9))).toBe('2026-09-09');
  });

  it('round-trips with parseLocalDateInput', () => {
    const input = '2026-03-16';
    expect(localDateString(parseLocalDateInput(input))).toBe(input);
  });

  it('round-trips at year and month boundaries', () => {
    expect(localDateString(parseLocalDateInput('2026-01-01'))).toBe('2026-01-01');
    expect(localDateString(parseLocalDateInput('2026-12-31'))).toBe('2026-12-31');
  });
});

describe('parseLocalDateInput', () => {
  // Regression: bare "YYYY-MM-DD" strings are spec-defined to parse as UTC midnight.
  // For a UTC-5 user that is the previous calendar day at 7pm local — the resulting
  // Date would have getDate() one less than the intended day.
  // parseLocalDateInput avoids this by parsing as local noon (T12:00:00).
  it('sets the hour to local noon (not UTC midnight)', () => {
    const result = parseLocalDateInput('2026-03-16');
    expect(result.getHours()).toBe(12);
  });

  it('produces local calendar components that match the input string', () => {
    const result = parseLocalDateInput('2026-03-16');
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(2); // March
    expect(result.getDate()).toBe(16);
  });

  it('handles month boundary inputs', () => {
    const jan = parseLocalDateInput('2026-01-01');
    expect(jan.getFullYear()).toBe(2026);
    expect(jan.getMonth()).toBe(0);
    expect(jan.getDate()).toBe(1);

    const dec = parseLocalDateInput('2026-12-31');
    expect(dec.getFullYear()).toBe(2026);
    expect(dec.getMonth()).toBe(11);
    expect(dec.getDate()).toBe(31);
  });

  it('round-trips with localDateString', () => {
    expect(localDateString(parseLocalDateInput('2026-06-15'))).toBe('2026-06-15');
  });
});

describe('getUTCMonday', () => {
  it('returns the same UTC midnight when the input is already a Monday', () => {
    // 2026-03-16 is a Monday
    const monday = new Date('2026-03-16T00:00:00Z');
    expect(getUTCMonday(monday).toISOString()).toBe('2026-03-16T00:00:00.000Z');
  });

  it('returns the preceding Monday for a Wednesday input', () => {
    // 2026-03-18 is a Wednesday
    expect(getUTCMonday(new Date('2026-03-18T00:00:00Z')).toISOString()).toBe('2026-03-16T00:00:00.000Z');
  });

  it('returns the preceding Monday for a Sunday input', () => {
    // 2026-03-22 is a Sunday — should go back to March 16
    expect(getUTCMonday(new Date('2026-03-22T00:00:00Z')).toISOString()).toBe('2026-03-16T00:00:00.000Z');
  });

  it('always returns UTC midnight, not local midnight', () => {
    const result = getUTCMonday(new Date('2026-03-16T00:00:00Z'));
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });

  // Timezone regression: a date that is "Sunday evening" in UTC-5 is actually
  // "Monday early morning" in UTC.  The old local-time getMonday() would have
  // resolved this to the *previous* Monday; getUTCMonday must resolve it to
  // the *current* Monday (March 16).
  it('resolves a UTC-Monday-morning timestamp to that same Monday, not the prior week', () => {
    // 2026-03-16T03:00:00Z = Sunday 10pm ET — local getDay() returns 0 (Sunday)
    // but the UTC date is Monday March 16
    const sundayEveningLocal = new Date('2026-03-16T03:00:00Z');
    expect(getUTCMonday(sundayEveningLocal).toISOString()).toBe('2026-03-16T00:00:00.000Z');
  });

  it('does not mutate the input date', () => {
    const input = new Date('2026-03-18T00:00:00Z');
    const originalTime = input.getTime();
    getUTCMonday(input);
    expect(input.getTime()).toBe(originalTime);
  });
});

describe('utcDayIndex', () => {
  // All seven days of the week starting 2026-03-16 (Monday) through 2026-03-22 (Sunday)
  it('returns 0 for Monday', () => {
    expect(utcDayIndex(new Date('2026-03-16T00:00:00Z'))).toBe(0);
  });

  it('returns 1 for Tuesday', () => {
    expect(utcDayIndex(new Date('2026-03-17T00:00:00Z'))).toBe(1);
  });

  it('returns 2 for Wednesday', () => {
    expect(utcDayIndex(new Date('2026-03-18T00:00:00Z'))).toBe(2);
  });

  it('returns 3 for Thursday', () => {
    expect(utcDayIndex(new Date('2026-03-19T00:00:00Z'))).toBe(3);
  });

  it('returns 4 for Friday', () => {
    expect(utcDayIndex(new Date('2026-03-20T00:00:00Z'))).toBe(4);
  });

  it('returns 5 for Saturday', () => {
    expect(utcDayIndex(new Date('2026-03-21T00:00:00Z'))).toBe(5);
  });

  it('returns 6 for Sunday', () => {
    expect(utcDayIndex(new Date('2026-03-22T00:00:00Z'))).toBe(6);
  });

  // Timezone regression: the old sprintBoard code used local .getDay(), so a UTC
  // Monday midnight date (2026-03-16T00:00:00Z) would appear as Sunday (getDay()=0 →
  // dayIndex=6) for a UTC-5 user browsing at 7pm on a Sunday evening.
  // utcDayIndex must always return 0 (Monday) for this timestamp.
  it('returns 0 (Monday) for UTC Monday midnight regardless of local timezone', () => {
    // This is the exact timestamp where the old code failed for UTC-5 users
    expect(utcDayIndex(new Date('2026-03-16T00:00:00Z'))).toBe(0);
  });
});
