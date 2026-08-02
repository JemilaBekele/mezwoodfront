/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Clock, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getSchedulingSettings, updateSchedulingSettings } from '@/service/SchedulingSettings';
import {
  WEEKDAY_LABELS,
  decimalToTime,
  parseWorkingDays,
  serializeWorkingDays,
  timeToDecimal,
  workingHoursOf,
} from '@/models/SchedulingSettings';

// Difficulty percentages are stored as fractions (0.4) on the backend but shown
// to the user as whole percentages (40) — convert on load/save.
export default function SchedulingSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [contingencyDays, setContingencyDays] = useState('3');
  const [easyPercent, setEasyPercent] = useState('0');
  const [mediumPercent, setMediumPercent] = useState('40');
  const [hardPercent, setHardPercent] = useState('50');

  // Working time. These used to be hardcoded on the server while this form
  // offered a free-text "working hours / day" box — so setting it to anything
  // other than 7.5 scheduled work past the (unchangeable) 17:00 close. The
  // window is now the input and the hours are the derived read-out.
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [shiftStart, setShiftStart] = useState('08:30');
  const [shiftEnd, setShiftEnd] = useState('17:00');
  const [lunchStart, setLunchStart] = useState('12:30');
  const [lunchEnd, setLunchEnd] = useState('13:30');
  const [timezone, setTimezone] = useState('Africa/Addis_Ababa');

  useEffect(() => {
    (async () => {
      try {
        const s = await getSchedulingSettings();
        setContingencyDays(String(s.contingencyDays));
        setEasyPercent(String(Math.round((s.easyPercent ?? 0) * 100)));
        setMediumPercent(String(Math.round((s.mediumPercent ?? 0) * 100)));
        setHardPercent(String(Math.round((s.hardPercent ?? 0) * 100)));
        setWorkingDays(parseWorkingDays(s.workingDays ?? '1,2,3,4,5,6'));
        setShiftStart(decimalToTime(s.shiftStartHour ?? 8.5));
        setShiftEnd(decimalToTime(s.shiftEndHour ?? 17));
        setLunchStart(decimalToTime(s.lunchStartHour ?? 12.5));
        setLunchEnd(decimalToTime(s.lunchEndHour ?? 13.5));
        setTimezone(s.timezone ?? 'Africa/Addis_Ababa');
      } catch (e: any) {
        toast.error(e.message || 'Failed to load scheduling settings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // The working hours a day actually contains, given the window. Shown live so
  // the operator can see what the scheduler will use.
  const derivedHours = useMemo(
    () =>
      workingHoursOf({
        shiftStartHour: timeToDecimal(shiftStart),
        shiftEndHour: timeToDecimal(shiftEnd),
        lunchStartHour: timeToDecimal(lunchStart),
        lunchEndHour: timeToDecimal(lunchEnd),
      }),
    [shiftStart, shiftEnd, lunchStart, lunchEnd],
  );

  const toggleDay = (index: number) =>
    setWorkingDays((prev) =>
      prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index],
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextContingency = Number(contingencyDays);
    const nextEasy = Number(easyPercent);
    const nextMedium = Number(mediumPercent);
    const nextHard = Number(hardPercent);

    if (
      !Number.isInteger(nextContingency) ||
      nextContingency < 0 ||
      [nextEasy, nextMedium, nextHard].some((n) => Number.isNaN(n) || n < 0)
    ) {
      toast.error('Enter a valid contingency and difficulty allowance');
      return;
    }
    if (workingDays.length === 0) {
      toast.error('Select at least one working day');
      return;
    }
    if (timeToDecimal(shiftEnd) <= timeToDecimal(shiftStart)) {
      toast.error('Closing time must be after opening time');
      return;
    }
    if (timeToDecimal(lunchEnd) < timeToDecimal(lunchStart)) {
      toast.error('Lunch end must not be before lunch start');
      return;
    }
    if (derivedHours <= 0) {
      toast.error('The working day must contain some working time');
      return;
    }

    setSaving(true);
    try {
      await updateSchedulingSettings({
        contingencyDays: nextContingency,
        easyPercent: nextEasy / 100,
        mediumPercent: nextMedium / 100,
        hardPercent: nextHard / 100,
        workingDays: serializeWorkingDays(workingDays),
        shiftStartHour: timeToDecimal(shiftStart),
        shiftEndHour: timeToDecimal(shiftEnd),
        lunchStartHour: timeToDecimal(lunchStart),
        lunchEndHour: timeToDecimal(lunchEnd),
        timezone,
      });
      toast.success('Scheduling settings saved — new quotes & projects use them');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update scheduling settings');
    } finally {
      setSaving(false);
    }
  };

  const numericChange =
    (setter: (v: string) => void, allowDecimal = false) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      const re = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/;
      if (v === '' || re.test(v)) setter(v);
    };

  // Live worked example (A = 10 production days) — recomputed as the user types.
  const preview = useMemo(() => {
    const A = 10;
    const cont = parseInt(contingencyDays, 10) || 0;
    const calc = (p: number) => A + Math.ceil(A * p) + cont;
    return {
      cont,
      easy: calc((parseFloat(easyPercent) || 0) / 100),
      medium: calc((parseFloat(mediumPercent) || 0) / 100),
      hard: calc((parseFloat(hardPercent) || 0) / 100),
    };
  }, [contingencyDays, easyPercent, mediumPercent, hardPercent]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-lg bg-muted/50" />
        <div className="h-16 animate-pulse rounded-lg bg-muted/50" />
        <div className="h-24 animate-pulse rounded-lg bg-muted/50" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contingency */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contingency">Contingency buffer</Label>
          <div className="relative">
            <Input
              id="contingency"
              inputMode="numeric"
              value={contingencyDays}
              onChange={numericChange(setContingencyDays)}
              className="pr-16 font-mono"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
              days
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Fixed working-day buffer added after production ends.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="timezone">Business timezone</Label>
          <Input
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">All shift times are read in this zone.</p>
        </div>
      </div>

      {/* Working time */}
      <div className="space-y-3 rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Working time
          </Label>
          <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
            {derivedHours}h / day
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Nothing is ever scheduled outside this window. A project created after hours
          starts at the next opening; work pauses over lunch and resumes after it.
        </p>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Working days
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_LABELS.map((label, index) => {
              const active = workingDays.includes(index);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleDay(index)}
                  aria-pressed={active}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {label.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {([
            ['shift-start', 'Opens', shiftStart, setShiftStart],
            ['shift-end', 'Closes', shiftEnd, setShiftEnd],
            ['lunch-start', 'Lunch from', lunchStart, setLunchStart],
            ['lunch-end', 'Lunch to', lunchEnd, setLunchEnd],
          ] as const).map(([id, label, value, setter]) => (
            <div key={id} className="space-y-1.5">
              <Label htmlFor={id} className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
              </Label>
              <Input
                id={id}
                type="time"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="font-mono"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Set lunch from and to the same time for no break. Working hours per day is
          derived from this window — it is not a separate setting.
        </p>
      </div>

      {/* Difficulty multipliers */}
      <div className="space-y-2">
        <Label>Difficulty allowance</Label>
        <div className="grid grid-cols-3 gap-3">
          {([
            ['easy', 'Easy', easyPercent, setEasyPercent, 'text-emerald-600 dark:text-emerald-400'],
            ['medium', 'Medium', mediumPercent, setMediumPercent, 'text-amber-600 dark:text-amber-400'],
            ['hard', 'Hard', hardPercent, setHardPercent, 'text-rose-600 dark:text-rose-400'],
          ] as const).map(([id, label, val, setter, tone]) => (
            <div key={id} className="space-y-1.5">
              <Label htmlFor={`diff-${id}`} className={`text-xs font-semibold uppercase tracking-wide ${tone}`}>
                {label}
              </Label>
              <div className="relative">
                <Input
                  id={`diff-${id}`}
                  inputMode="decimal"
                  value={val}
                  onChange={numericChange(setter, true)}
                  className="pr-8 font-mono"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Extra time added on top of the production span, by difficulty level (1/2/3).
        </p>
      </div>

      {/* Live formula preview */}
      <div className="rounded-lg border border-border bg-muted/40 p-3.5">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Delivery formula
        </p>
        <p className="font-mono text-sm">
          FinalDays = A + ⌈A × difficulty⌉ + {preview.cont}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-xs">
          {([
            ['Easy', preview.easy, 'text-emerald-600 dark:text-emerald-400'],
            ['Medium', preview.medium, 'text-amber-600 dark:text-amber-400'],
            ['Hard', preview.hard, 'text-rose-600 dark:text-rose-400'],
          ] as const).map(([label, days, tone]) => (
            <div key={label} className="rounded-md border border-border bg-background py-2">
              <div className={`text-[10px] uppercase ${tone}`}>{label}</div>
              <div className="text-lg font-semibold leading-tight">{days}</div>
              <div className="text-[10px] text-muted-foreground">working days</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Example for a 10-working-day production span.</p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="gap-1.5">
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </form>
  );
}
