/**
 * Client-side mirror of the backend working-time calendar.
 *
 * The authoritative implementation is `mezidwood/src/services/scheduling/
 * calendar.js`; every stage date the API returns has already been walked
 * through it. This module exists purely so the stage dialog can PREVIEW where a
 * duration will land before the user saves — without it the UI was doing
 * `start + minutes` in raw wall-clock time and happily showing an end of 17:40
 * for a factory that closes at 17:00, or 13:06 for work that actually runs
 * through the 12:30-13:30 lunch break.
 *
 * The model matches the server's: a working day is a list of SEGMENTS, not one
 * contiguous span:
 *
 *     [ 08:30 - 12:30 ]  lunch  [ 13:30 - 17:00 ]     = 7.5 working hours
 *
 * Durations are measured in WORKING time — never counting lunch, the night, a
 * non-working weekday or a holiday.
 *
 * Anything persisted is still re-normalized server-side, so a disagreement here
 * is a cosmetic preview drift, never bad data.
 */
import { parseWorkingDays, workingHoursOf } from '@/models/SchedulingSettings';

const EPS = 1e-6;
const MS_PER_HOUR = 3_600_000;

export interface WorkingTimeConfig {
  /** JS getDay() indices that are worked, e.g. [1,2,3,4,5,6] (Sunday off). */
  workingDays: number[];
  shiftStartHour: number;
  shiftEndHour: number;
  lunchStartHour: number;
  lunchEndHour: number;
  /** 'YYYY-MM-DD' fixed holidays. */
  holidays: string[];
  /** 'MM-DD' holidays that repeat every year. */
  recurringHolidays: string[];
}

/** The shape the app falls back to before settings load, or if the call fails. */
export const DEFAULT_WORKING_TIME: WorkingTimeConfig = {
  workingDays: [1, 2, 3, 4, 5, 6],
  shiftStartHour: 8.5,
  shiftEndHour: 17,
  lunchStartHour: 12.5,
  lunchEndHour: 13.5,
  holidays: [],
  recurringHolidays: [],
};

/** Build a config from a scheduling-settings row plus a holiday list. */
export const toWorkingTimeConfig = (
  settings?: {
    workingDays?: string | null;
    shiftStartHour?: number | null;
    shiftEndHour?: number | null;
    lunchStartHour?: number | null;
    lunchEndHour?: number | null;
  } | null,
  holidays: { date: string | Date; recurring?: boolean }[] = [],
): WorkingTimeConfig => {
  const days = parseWorkingDays(settings?.workingDays ?? undefined);
  const fixed: string[] = [];
  const recurring: string[] = [];
  for (const h of holidays) {
    // Holidays are stored as UTC-midnight day markers — read them in UTC so the
    // label does not shift a day in a non-UTC browser.
    const d = new Date(h.date);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    if (h.recurring) recurring.push(key.slice(5));
    else fixed.push(key);
  }
  return {
    workingDays: days.length ? days : DEFAULT_WORKING_TIME.workingDays,
    shiftStartHour: settings?.shiftStartHour ?? DEFAULT_WORKING_TIME.shiftStartHour,
    shiftEndHour: settings?.shiftEndHour ?? DEFAULT_WORKING_TIME.shiftEndHour,
    lunchStartHour: settings?.lunchStartHour ?? DEFAULT_WORKING_TIME.lunchStartHour,
    lunchEndHour: settings?.lunchEndHour ?? DEFAULT_WORKING_TIME.lunchEndHour,
    holidays: fixed,
    recurringHolidays: recurring,
  };
};

interface Segment {
  start: number;
  end: number;
}

/** The working segments of any day, as decimal hours. Lunch is the gap. */
const segmentsOf = (wt: WorkingTimeConfig): Segment[] =>
  (wt.lunchEndHour > wt.lunchStartHour
    ? [
        { start: wt.shiftStartHour, end: wt.lunchStartHour },
        { start: wt.lunchEndHour, end: wt.shiftEndHour },
      ]
    : [{ start: wt.shiftStartHour, end: wt.shiftEndHour }]
  ).filter((s) => s.end - s.start > EPS);

/** Working hours a single day contains. */
export const workingHoursPerDayOf = (wt: WorkingTimeConfig): number =>
  workingHoursOf({
    shiftStartHour: wt.shiftStartHour,
    shiftEndHour: wt.shiftEndHour,
    lunchStartHour: wt.lunchStartHour,
    lunchEndHour: wt.lunchEndHour,
  });

const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Decimal hour-of-day, e.g. 12:30 -> 12.5. */
const decimalHours = (d: Date) =>
  d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;

/** A calendar day that is worked: in the weekly set AND not a holiday. */
export const isWorkingDay = (date: Date, wt: WorkingTimeConfig): boolean => {
  if (!wt.workingDays.includes(date.getDay())) return false;
  const key = dayKey(date);
  if (wt.holidays.includes(key)) return false;
  if (wt.recurringHolidays.includes(key.slice(5))) return false;
  return true;
};

/** Build an instant at a given decimal wall-clock hour on `date`'s day. */
export const atDecimalHour = (date: Date, decimalHour: number): Date => {
  const d = new Date(date);
  const h = Math.floor(decimalHour);
  const m = Math.round((decimalHour % 1) * 60);
  d.setHours(h, m, 0, 0);
  return d;
};

/** Start-of-day of the next working day strictly after `date`. */
const nextWorkingDay = (date: Date, wt: WorkingTimeConfig): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 3650; i += 1) {
    d.setDate(d.getDate() + 1);
    if (isWorkingDay(d, wt)) return d;
  }
  return d;
};

/** True when `instant` sits inside a working segment of a working day. */
export const isWithinWorkingHours = (
  instant: Date,
  wt: WorkingTimeConfig,
): boolean => {
  if (!isWorkingDay(instant, wt)) return false;
  const dec = decimalHours(instant);
  return segmentsOf(wt).some((s) => dec >= s.start - EPS && dec < s.end - EPS);
};

/**
 * The first instant at or after `instant` at which work may legally begin.
 * Handles every out-of-hours case: non-working day, before opening, inside the
 * lunch gap, and at or after closing. Mirrors the server's `nextWorkingStart`.
 */
export const nextWorkingStart = (
  instant: Date,
  wt: WorkingTimeConfig,
): Date => {
  const segments = segmentsOf(wt);
  if (!segments.length) return new Date(instant);
  let d = new Date(instant);

  for (let guard = 0; guard < 3650; guard += 1) {
    if (!isWorkingDay(d, wt)) {
      d = atDecimalHour(nextWorkingDay(d, wt), wt.shiftStartHour);
      return d;
    }
    const dec = decimalHours(d);
    if (dec <= wt.shiftStartHour + EPS) return atDecimalHour(d, wt.shiftStartHour);

    // Already inside a segment? The instant stands.
    const inSeg = segments.find((s) => dec >= s.start - EPS && dec < s.end - EPS);
    if (inSeg) return d;

    // In the lunch gap -> jump to the next segment's start.
    const next = segments.find((s) => s.start > dec - EPS);
    if (next) return atDecimalHour(d, next.start);

    // At or past closing -> next working day.
    return atDecimalHour(nextWorkingDay(d, wt), wt.shiftStartHour);
  }
  return d;
};

/**
 * Walk `hours` of WORKING time forward from `start`, skipping lunch, nights,
 * non-working weekdays and holidays. Returns the instant work finishes.
 */
export const addWorkingHours = (
  start: Date,
  hours: number,
  wt: WorkingTimeConfig,
): Date => {
  const segments = segmentsOf(wt);
  let remaining = Math.max(0, hours);
  let cur = nextWorkingStart(start, wt);
  if (remaining <= EPS || !segments.length) return cur;

  for (let guard = 0; guard < 100000; guard += 1) {
    const dec = decimalHours(cur);
    const seg = segments.find((s) => dec >= s.start - EPS && dec < s.end - EPS);
    if (!seg) {
      cur = nextWorkingStart(cur, wt);
      continue;
    }
    const segRemaining = seg.end - dec;
    if (remaining <= segRemaining + EPS) {
      // Snap to the whole second — decimal-hour arithmetic otherwise lands on
      // 12:29:51 instead of 12:30:00.
      const end = new Date(cur.getTime() + remaining * MS_PER_HOUR);
      return new Date(Math.round(end.getTime() / 1000) * 1000);
    }
    remaining -= segRemaining;
    cur = nextWorkingStart(atDecimalHour(cur, seg.end), wt);
  }
  return cur;
};

/** Convenience: end instant for a start plus a duration in MINUTES. */
export const addWorkingMinutes = (
  start: Date,
  minutes: number,
  wt: WorkingTimeConfig,
): Date => addWorkingHours(start, (minutes || 0) / 60, wt);

/** Inclusive count of working days in [start, end]. */
export const workingDaysBetween = (
  start: Date,
  end: Date,
  wt: WorkingTimeConfig,
): number => {
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  let count = 0;
  for (let guard = 0; guard < 36500 && d.getTime() <= last.getTime(); guard += 1) {
    if (isWorkingDay(d, wt)) count += 1;
    d.setDate(d.getDate() + 1);
  }
  return count;
};

/**
 * Why an instant is not workable, as a short sentence for the UI — or null when
 * it is fine. Used to warn before a save that the server would silently move.
 */
export const outOfWorkingHoursReason = (
  instant: Date,
  wt: WorkingTimeConfig,
): string | null => {
  if (!instant || Number.isNaN(instant.getTime())) return null;
  if (isWithinWorkingHours(instant, wt)) return null;

  const key = dayKey(instant);
  if (wt.holidays.includes(key) || wt.recurringHolidays.includes(key.slice(5))) {
    return 'That day is a holiday.';
  }
  if (!wt.workingDays.includes(instant.getDay())) {
    return 'That day is not a working day.';
  }
  const dec = decimalHours(instant);
  if (dec < wt.shiftStartHour) return 'That is before the shift opens.';
  if (dec >= wt.shiftEndHour) return 'That is after the shift closes.';
  if (dec >= wt.lunchStartHour && dec < wt.lunchEndHour) {
    return 'That falls inside the lunch break.';
  }
  return 'That is outside working hours.';
};
