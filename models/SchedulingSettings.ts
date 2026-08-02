// Business-tunable scheduling settings (singleton on the backend).
//
// Two groups:
//   1. DELIVERY FORMULA — FinalDays = A + ceil(A x difficulty%) + contingencyDays,
//      where A is the production span in working days. The buffer is applied
//      from the END of production, not from its start.
//   2. WORKING TIME — which weekdays are worked, when the shift opens and
//      closes, when lunch falls, and the business timezone. These used to be
//      hardcoded on the server, which meant setting `workingHoursPerDay` here
//      to anything other than 7.5 scheduled work past closing time.
export interface ISchedulingSettings {
  id: string;

  // --- delivery formula ---
  contingencyDays: number; // fixed working-day buffer added to every project
  easyPercent: number; // difficulty multiplier for EASY  (0 = +0%)
  mediumPercent: number; // difficulty multiplier for MEDIUM (0.4 = +40%)
  hardPercent: number; // difficulty multiplier for HARD   (0.5 = +50%)

  // --- working time ---
  // DERIVED on the server from the shift and lunch windows below. Read-only:
  // sending it is ignored, because an independent value could contradict the
  // window the scheduler actually works.
  workingHoursPerDay: number;

  workingDays: string; // JS getDay() indices, e.g. "1,2,3,4,5,6" (Sunday off)
  shiftStartHour: number; // decimal hours, e.g. 8.5 = 08:30
  shiftEndHour: number; // e.g. 17.0 = 17:00
  lunchStartHour: number; // e.g. 12.5 = 12:30 (set == lunchEnd for no break)
  lunchEndHour: number; // e.g. 13.5 = 13:30
  timezone: string; // e.g. "Africa/Addis_Ababa"

  createdAt: string;
  updatedAt: string;
}

// workingHoursPerDay is intentionally NOT updatable — it is derived server-side.
export type SchedulingSettingsUpdate = Partial<
  Pick<
    ISchedulingSettings,
    | 'contingencyDays'
    | 'easyPercent'
    | 'mediumPercent'
    | 'hardPercent'
    | 'workingDays'
    | 'shiftStartHour'
    | 'shiftEndHour'
    | 'lunchStartHour'
    | 'lunchEndHour'
    | 'timezone'
  >
>;

export const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/** "1,2,3" -> [1,2,3] */
export const parseWorkingDays = (value?: string | null): number[] =>
  (value || '')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);

/** [1,2,3] -> "1,2,3" */
export const serializeWorkingDays = (days: number[]): string =>
  [...new Set(days)].sort((a, b) => a - b).join(',');

/** 8.5 -> "08:30" */
export const decimalToTime = (value: number): string => {
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** "08:30" -> 8.5 */
export const timeToDecimal = (value: string): number => {
  const [h, m] = value.split(':').map(Number);
  return (h || 0) + (m || 0) / 60;
};

/** The working hours a given window implies — mirrors the server's derivation. */
export const workingHoursOf = (s: {
  shiftStartHour: number;
  shiftEndHour: number;
  lunchStartHour: number;
  lunchEndHour: number;
}): number => {
  const span = s.shiftEndHour - s.shiftStartHour;
  const lunch =
    s.lunchEndHour > s.lunchStartHour ? s.lunchEndHour - s.lunchStartHour : 0;
  return Math.round((span - lunch) * 100) / 100;
};
