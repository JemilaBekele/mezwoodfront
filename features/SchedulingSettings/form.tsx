/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Clock, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getSchedulingSettings, updateSchedulingSettings } from '@/service/SchedulingSettings';

// Difficulty percentages are stored as fractions (0.4) on the backend but shown
// to the user as whole percentages (40) — convert on load/save.
export default function SchedulingSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [contingencyDays, setContingencyDays] = useState('3');
  const [easyPercent, setEasyPercent] = useState('0');
  const [mediumPercent, setMediumPercent] = useState('40');
  const [hardPercent, setHardPercent] = useState('50');
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState('7.5');

  useEffect(() => {
    (async () => {
      try {
        const s = await getSchedulingSettings();
        setContingencyDays(String(s.contingencyDays));
        setEasyPercent(String(Math.round((s.easyPercent ?? 0) * 100)));
        setMediumPercent(String(Math.round((s.mediumPercent ?? 0) * 100)));
        setHardPercent(String(Math.round((s.hardPercent ?? 0) * 100)));
        setWorkingHoursPerDay(String(s.workingHoursPerDay ?? 7.5));
      } catch (e: any) {
        toast.error(e.message || 'Failed to load scheduling settings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextContingency = Number(contingencyDays);
    const nextEasy = Number(easyPercent);
    const nextMedium = Number(mediumPercent);
    const nextHard = Number(hardPercent);
    const nextWorkingHours = Number(workingHoursPerDay);
    if (
      !Number.isInteger(nextContingency) ||
      nextContingency < 0 ||
      [nextEasy, nextMedium, nextHard].some((n) => Number.isNaN(n) || n < 0) ||
      Number.isNaN(nextWorkingHours) ||
      nextWorkingHours <= 0
    ) {
      toast.error('Enter a valid contingency, difficulty allowance, and working-hours value');
      return;
    }
    setSaving(true);
    try {
      await updateSchedulingSettings({
        contingencyDays: nextContingency,
        easyPercent: nextEasy / 100,
        mediumPercent: nextMedium / 100,
        hardPercent: nextHard / 100,
        workingHoursPerDay: nextWorkingHours,
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
      {/* Contingency + working hours */}
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
          <p className="text-xs text-muted-foreground">Fixed working-day buffer added to every project.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="working-hours" className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Working hours / day
          </Label>
          <div className="relative">
            <Input
              id="working-hours"
              inputMode="decimal"
              value={workingHoursPerDay}
              onChange={numericChange(setWorkingHoursPerDay, true)}
              className="pr-16 font-mono"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
              hours
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Reference length of a full working day.</p>
        </div>
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
