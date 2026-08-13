export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: opts.month ?? 'long',
      day: opts.day ?? 'numeric',
      year: opts.year ?? 'numeric',
      ...opts
    }).format(new Date(date));
  } catch (_err) {
    return '';
  }
}

export function formatTime(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: opts.hour ?? '2-digit',
      minute: opts.minute ?? '2-digit',
      hour12: opts.hour12 ?? true,
      ...opts
    }).format(new Date(date));
  } catch (_err) {
    return '';
  }
}

export const formatMinutes = (minutes?: number) => {
  if (!minutes && minutes !== 0) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
};

/* ------------------------------------------------------------------ *
 * Ethiopian (Ge'ez) calendar helpers
 * ------------------------------------------------------------------ */
const ETHIOPIAN_MONTHS = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume',
];

/** Convert a Gregorian Date to Ethiopian { year, month, date }. */
export function gregorianToEthiopian(g: Date) {
  if (!g || Number.isNaN(g.getTime())) return { year: 2018, month: 1, date: 1 };
  const gy = g.getFullYear();
  const gm = g.getMonth() + 1;
  const gd = g.getDate();
  const afterNewYear = gm > 9 || (gm === 9 && gd > 10);
  const months = [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 5];
  let ny = new Date(gy, 8, 11);
  let doy = Math.floor((g.getTime() - ny.getTime()) / 86400000) + 1;
  let year = gy - 7;
  if (doy < 1) {
    ny = new Date(gy - 1, 8, 11);
    doy = Math.floor((g.getTime() - ny.getTime()) / 86400000) + 1;
    year = gy - 8;
  } else if (!afterNewYear) {
    year = gy - 8;
  }
  let m = 1;
  let d = doy;
  for (let i = 0; i < months.length; i += 1) {
    if (d <= months[i]) { m = i + 1; break; }
    d -= months[i];
  }
  return { year, month: m, date: d };
}

/** Format a date as an Ethiopian calendar string, e.g. "4 Sene 2018". */
export function formatDateEth(date: Date | string | number | undefined) {
  if (!date) return '';
  try {
    const g = new Date(date);
    const e = gregorianToEthiopian(g);
    return `${e.date} ${ETHIOPIAN_MONTHS[e.month - 1]} ${e.year}`;
  } catch {
    return '';
  }
}

/**
 * Display a scheduling time in Ethiopian (local) time.
 *
 * The backend scheduling engine (services/scheduling/calendar.js) stores plain
 * GREGORIAN instants in the factory timezone — a stage that opens at 08:30 is
 * stored as 08:30. Ethiopian clock time runs 6 hours behind that, counting from
 * dawn, so the conversion is Gregorian − 6h:
 *   08:30 AM → 2:30 ጧት
 *   4:21 PM  → 10:21 ከሰዓት
 *
 * The period label is derived from the GREGORIAN hour, which is what actually
 * says whether the instant is morning, afternoon, evening or the small hours:
 *   Gregorian 6-11  → ጧት     (morning)
 *   Gregorian 12-17 → ከሰዓት   (afternoon)
 *   Gregorian 18-23 → ሌሊት    (evening / night)
 *   Gregorian 0-5   → ንጋት    (dawn / late night)
 */
export function formatTimeEth(date: Date | string | number | undefined) {
  if (!date) return '';
  try {
    const g = new Date(date);
    if (Number.isNaN(g.getTime())) return '';
    const gregHour = g.getHours();
    const minutes = g.getMinutes();

    // Ethiopian clock runs 6 hours behind the Gregorian wall clock.
    const ethHour24 = (gregHour - 6 + 24) % 24;
    const displayHour = ethHour24 % 12 || 12;

    // Period comes from the Gregorian hour, not the Ethiopian one.
    let period: string;
    if (gregHour < 6) {
      period = 'ንጋት';       // dawn / late night
    } else if (gregHour < 12) {
      period = 'ጧት';        // morning
    } else if (gregHour < 18) {
      period = 'ከሰዓት';      // afternoon
    } else {
      period = 'ሌሊት';       // evening / night
    }

    return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
  } catch {
    return '';
  }
}

/**
 * Display a scheduling time as Gregorian AM/PM.
 *
 * Stored instants are already Gregorian factory-local time, so this is a
 * straight render with no offset applied.
 *   Stored 08:30 → 8:30 AM
 *   Stored 16:21 → 4:21 PM
 */
export function formatTimeGregorian(date: Date | string | number | undefined) {
  if (!date) return '';
  try {
    const g = new Date(date);
    if (Number.isNaN(g.getTime())) return '';
    const hour24 = g.getHours();
    const minutes = g.getMinutes();

    const hour12 = hour24 % 12 || 12;
    const ampm = hour24 < 12 ? 'AM' : 'PM';

    return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  } catch {
    return '';
  }
}

/** Ethiopian date + Ethiopian time on one line, e.g. "2 Nehase 2018 10:21 ከሰዓት". */
export function formatDateTimeEth(date: Date | string | number | undefined) {
  if (!date) return '';
  const d = formatDateEth(date);
  const t = formatTimeEth(date);
  return [d, t].filter(Boolean).join(' ');
}
