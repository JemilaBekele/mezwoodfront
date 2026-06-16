/* eslint-disable @typescript-eslint/no-explicit-any */

import { ISchedulingSettings, SchedulingSettingsUpdate } from '@/models/SchedulingSettings';
import { axiosInstance } from './axiosIntance';

interface SchedulingSettingsResponse {
  success: boolean;
  settings: ISchedulingSettings;
}

// Read the singleton scheduling settings (creates defaults server-side if absent).
export const getSchedulingSettings = async () => {
  const response = await axiosInstance.get<SchedulingSettingsResponse>(
    `/scheduling-settings`
  );
  return response.data.settings;
};

// Update the tunable delivery-formula knobs.
export const updateSchedulingSettings = async (
  data: SchedulingSettingsUpdate,
) => {
  try {
    const response = await axiosInstance.put<SchedulingSettingsResponse>(
      `/scheduling-settings`,
      data
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) throw new Error(error.response.data.error);
    throw error;
  }
};
