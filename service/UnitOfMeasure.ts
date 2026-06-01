import { IncomingMessage } from 'http';
import { axiosInstance } from "./axiosIntance";

import { IUnitOfMeasure } from '@/models/UnitOfMeasure';

export interface GetParams {
  page?: number;
  limit?: number;
}

// Response for getAll
interface UnitsResponse {
  success: boolean;
  count: number;
  units: IUnitOfMeasure[];
}

// Get all UnitsOfMeasure (paginated)
export const getAllUnitsOfMeasure = async ({
  page = 1,
  limit = 10
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const url = `/units-of-measure?${query}`;
    const response = await axiosInstance.get<UnitsResponse>(url);
    const units = response.data.units;

    return {
      units: units,
      totalCount: response.data.count ?? units.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

// Get UnitsOfMeasure (SSR-safe)
export const getUnitsOfMeasure = async () => {
  try {
    const response = await axiosInstance.get(`/units-of-measure`);
    return response.data.units as IUnitOfMeasure[];
  } catch (error) {
    throw error;
  }
};

// Get UnitOfMeasure by ID
export const getUnitOfMeasureById = async (
  id: string,
  
) => {
  try {
    const response = await axiosInstance.get(`/units-of-measure/${id}`);
    return response.data.unit as IUnitOfMeasure;
  } catch (error) {
    throw error;
  }
};

// Create UnitOfMeasure
export const createUnitOfMeasure = async (
  data: Partial<IUnitOfMeasure> | FormData,
  
) => {
  try {
    
    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

    const response = await axiosInstance.post(
      `/units-of-measure`,
      data,
      config
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update UnitOfMeasure
export const updateUnitOfMeasure = async (
  id: string,
  data: Partial<IUnitOfMeasure> | FormData,
  
) => {
  try {
    
    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

    const response = await axiosInstance.put(
      `/units-of-measure/${id}`,
      data,
      config
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete UnitOfMeasure
export const deleteUnitOfMeasure = async (
  id: string,
  
) => {
  try {
    
    const response = await axiosInstance.delete(`/units-of-measure/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
