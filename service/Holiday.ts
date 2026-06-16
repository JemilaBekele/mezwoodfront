/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from 'http';
import { IHoliday } from '@/models/Holiday';
import { axiosInstance } from './axiosIntance';

interface HolidaysResponse {
  success: boolean;
  holidays: IHoliday[];
  count: number;
}

// List all holidays (ascending by date).
export const getHolidays = async (req?: IncomingMessage) => {
  const response = await axiosInstance.get<HolidaysResponse>(`/holidays`);
  return response.data.holidays ?? [];
};

// Add a non-working date.
export const createHoliday = async (
  data: { date: string; name: string; recurring?: boolean },
) => {
  try {
    const response = await axiosInstance.post(`/holidays`, data);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) throw new Error(error.response.data.error);
    if (error.response?.data?.message) throw new Error(error.response.data.message);
    throw error;
  }
};

// Remove a holiday.
export const deleteHoliday = async (id: string, req?: IncomingMessage) => {
  try {
    const response = await axiosInstance.delete(`/holidays/${id}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) throw new Error(error.response.data.error);
    throw error;
  }
};
