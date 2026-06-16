// A working-calendar exception. Combined with the 6-day work week, holidays are
// the dates the workshop is closed; the scheduler skips them.
export interface IHoliday {
  id: string;
  date: string;        // ISO — stored as a UTC-midnight day marker
  name: string;
  recurring: boolean;  // repeats every year on the same month/day
  createdAt: string;
  updatedAt: string;
}
