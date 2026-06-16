import { IncomingMessage } from 'http';

import { ICapacityLot, CapacityStage, ICapacityReport } from '@/models/CapacityLot';
import { axiosInstance } from './axiosIntance';

// ========================= RESPONSE TYPES ========================= //

interface CapacitySlotsResponse {
  success: boolean;
  count: number;
  capacitySlots: ICapacityLot[];
}

interface CapacitySlotResponse {
  success: boolean;
  capacitySlot: ICapacityLot;
}

// Get all capacity slots (client-side)
export const getAllCapacitySlots = async () => {
  try {
    const response = await axiosInstance.get<CapacitySlotsResponse>(`/capacity-slots`);

    // Handle cases where response.data is null or missing fields
    const capacitySlots = response?.data?.capacitySlots ?? [];

    return {
      capacitySlots,
      totalCount: response?.data?.count ?? capacitySlots.length,
      success: response?.data?.success ?? false
    };
  } catch (error) {
    console.error('Error fetching capacity slots:', error);

    // Return empty array instead of throwing error
    return {
      capacitySlots: [] as ICapacityLot[],
      totalCount: 0,
      success: false
    };
  }
};
// Get all capacity slots (server-side / with auth)
export const getCapacitySlots = async (req?: IncomingMessage) => {
  try {
    const response = await axiosInstance.get(`/capacity-slots`);
    return response.data.capacitySlots as ICapacityLot[];
  } catch (error) {
    throw error;
  }
};

// Get capacity slot by ID
export const getCapacitySlotById = async (
  id: string,
) => {
  try {
    const response = await axiosInstance.get<CapacitySlotResponse>(
      `/capacity-slots/${id}`
    );
    return response.data.capacitySlot;
  } catch (error) {
    throw error;
  }
};
interface CapacityReportResponse {
  success: boolean;
  data: ICapacityReport;
}

// Get Capacity Report
export const getCapacityReport = async (
  params?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<ICapacityReport> => {
  try {
    const query = new URLSearchParams();

    if (params?.startDate) {
      query.append('startDate', params.startDate);
    }

    if (params?.endDate) {
      query.append('endDate', params.endDate);
    }

    const response = await axiosInstance.get<CapacityReportResponse>(
      `/reports/capacity${query.toString() ? `?${query.toString()}` : ''}`
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Get capacity slot by stage
export const getCapacitySlotByStage = async (
  stage: CapacityStage,
) => {
  try {
    const response = await axiosInstance.get<CapacitySlotResponse>(
      `/capacity-slots/stage/${stage}`
    );
    return response.data.capacitySlot;
  } catch (error) {
    throw error;
  }
};

// Create capacity slot
export const createCapacitySlot = async (
  data: Pick<ICapacityLot, 'stage' | 'days'> &
    Partial<Pick<ICapacityLot, 'capacity' | 'workingHours' | 'parallelSlots'>>,
) => {
  try {
    const response = await axiosInstance.post(
      `/capacity-slots`,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update capacity slot
export const updateCapacitySlot = async (
  id: string,
  data: Partial<Pick<ICapacityLot, 'stage' | 'days' | 'capacity' | 'workingHours' | 'parallelSlots'>>,
) => {
  try {
    const response = await axiosInstance.put(
      `/capacity-slots/${id}`,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete capacity slot
export const deleteCapacitySlot = async (
  id: string,
) => {
  try {
    const response = await axiosInstance.delete(
      `/capacity-slots/${id}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
