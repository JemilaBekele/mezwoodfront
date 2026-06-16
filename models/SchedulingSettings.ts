// Business-tunable scheduling settings (singleton on the backend).
// Drives the delivery formula: FinalDays = A + ceil(A x difficulty%) + contingencyDays.
export interface ISchedulingSettings {
  id: string;
  contingencyDays: number;    // fixed working-day buffer added to every project
  easyPercent: number;        // difficulty multiplier for EASY  (0 = +0%)
  mediumPercent: number;      // difficulty multiplier for MEDIUM (0.4 = +40%)
  hardPercent: number;        // difficulty multiplier for HARD   (0.5 = +50%)
  workingHoursPerDay: number; // reference full working-day length (default 7.5)
  createdAt: string;
  updatedAt: string;
}

export type SchedulingSettingsUpdate = Partial<
  Pick<
    ISchedulingSettings,
    'contingencyDays' | 'easyPercent' | 'mediumPercent' | 'hardPercent' | 'workingHoursPerDay'
  >
>;
