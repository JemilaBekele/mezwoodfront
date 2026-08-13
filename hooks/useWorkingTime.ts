'use client';

/**
 * The factory's configured working time, for any screen that needs to reason
 * about hours or preview a schedule.
 *
 * Before this existed, `7.5` was hardcoded in seven places (the stage dialog,
 * the Gantt chart and five calendar views), so changing the shift window in
 * Scheduling Settings changed nothing the user could see. Everything now reads
 * from the same `/scheduling-settings` + `/holidays` pair the backend scheduler
 * uses, falling back to the historical defaults while the request is in flight.
 *
 * The response is cached per page load — the settings are a singleton that
 * changes at most a few times a year, and every consumer would otherwise refetch
 * it on mount.
 */
import { useEffect, useState } from 'react';
import { getSchedulingSettings } from '@/service/SchedulingSettings';
import { getHolidays } from '@/service/Holiday';
import { ISchedulingSettings } from '@/models/SchedulingSettings';
import {
  DEFAULT_WORKING_TIME,
  WorkingTimeConfig,
  toWorkingTimeConfig,
  workingHoursPerDayOf,
} from '@/lib/workingTime';

export interface UseWorkingTimeResult {
  workingTime: WorkingTimeConfig;
  workingHoursPerDay: number;
  settings: ISchedulingSettings | null;
  loading: boolean;
}

let cached: { workingTime: WorkingTimeConfig; settings: ISchedulingSettings } | null =
  null;
let inFlight: Promise<{
  workingTime: WorkingTimeConfig;
  settings: ISchedulingSettings;
}> | null = null;

const load = async () => {
  if (cached) return cached;
  if (!inFlight) {
    inFlight = (async () => {
      const [settings, holidays] = await Promise.all([
        getSchedulingSettings(),
        // Holidays are a nice-to-have for the preview: without them a stage
        // previewed onto a holiday just reads as a normal day, which the server
        // corrects on save.
        getHolidays().catch(() => []),
      ]);
      const result = {
        settings,
        workingTime: toWorkingTimeConfig(settings, holidays),
      };
      cached = result;
      return result;
    })().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
};

/** Drop the cache so the next mount refetches — call after saving settings. */
export const invalidateWorkingTime = () => {
  cached = null;
};

export function useWorkingTime(): UseWorkingTimeResult {
  const [workingTime, setWorkingTime] = useState<WorkingTimeConfig>(
    cached?.workingTime ?? DEFAULT_WORKING_TIME,
  );
  const [settings, setSettings] = useState<ISchedulingSettings | null>(
    cached?.settings ?? null,
  );
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let active = true;
    // When the cache is already warm `load()` resolves on the microtask queue,
    // so there is no separate synchronous path to short-circuit — the initial
    // state above already reads from the cache.
    load()
      .then((result) => {
        if (!active) return;
        setWorkingTime(result.workingTime);
        setSettings(result.settings);
      })
      .catch(() => {
        // Keep the defaults — a preview built on 08:30-17:00 is still far closer
        // than the raw wall-clock math this replaced.
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return {
    workingTime,
    workingHoursPerDay: workingHoursPerDayOf(workingTime),
    settings,
    loading,
  };
}
