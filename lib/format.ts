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
 * Display a scheduling time that is stored in Ethiopian format.
 *
 * The backend scheduling engine stores times in Ethiopian time (offset -6h
 * from Gregorian), e.g. 2:30 stored = 2:30 ጧት = 8:30 AM Gregorian.
 *
 * This function reads the stored hour directly and adds the correct
 * Ethiopian period label:
 *   Hours 0-5   → ጧት      (morning:   6:00 AM – 11:59 AM Gregorian)
 *   Hours 6-11  → ከሰዓት    (afternoon: 12:00 PM – 5:59 PM Gregorian)
 *   Hours 12-17 → ሌሊት     (evening:   6:00 PM – 11:59 PM Gregorian)
 *   Hours 18-23 → ንጋት     (dawn:      12:00 AM – 5:59 AM Gregorian)
 */
export function formatTimeEth(date: Date | string | number | undefined) {
  if (!date) return '';
  try {
    const g = new Date(date);
    const storedHour = g.getHours(); // already Ethiopian
    const minutes = g.getMinutes();

    // 12-hour display
    let displayHour = storedHour % 12;
    if (displayHour === 0) displayHour = 12;

    // Ethiopian period
    let period: string;
    if (storedHour < 6) {
      period = 'ጧት';       // morning
    } else if (storedHour < 12) {
      period = 'ከሰዓት';     // afternoon
    } else if (storedHour < 18) {
      period = 'ሌሊት';      // evening / night
    } else {
      period = 'ንጋት';      // dawn / late night
    }

    return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
  } catch {
    return '';
  }
}

/**
 * Convert a scheduling time stored in Ethiopian format to Gregorian AM/PM.
 *
 * Ethiopian time + 6 hours = Gregorian time.
 *   Stored 2:30  → 8:30 AM   (2:30 ጧት)
 *   Stored 10:30 → 4:30 PM   (10:30 ከሰዓት)
 *   Stored 11:30 → 5:30 PM   (11:30 ከሰዓት)
 */
export function formatTimeGregorian(date: Date | string | number | undefined) {
  if (!date) return '';
  try {
    const g = new Date(date);
    const storedHour = g.getHours(); // Ethiopian hour
    const minutes = g.getMinutes();

    // Convert to Gregorian by adding 6 hours
    const gregHour24 = (storedHour + 6) % 24;
    const gregHour12 = gregHour24 % 12 || 12;
    const ampm = gregHour24 < 12 ? 'AM' : 'PM';

    return `${gregHour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  } catch {
    return '';
  }
}
