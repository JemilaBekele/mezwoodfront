/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from 'http';

import { ICategory, IColour } from '@/models/Category';
import { axiosInstance } from './axiosIntance';

// Generic Pagination Params
export interface GetParams {
  page?: number;
  limit?: number;
}

// ========================= CATEGORIES ========================= //
interface CategoriesResponse {
  success: boolean;
  count: number;
  categories: ICategory[];
}

export const getAllCategories = async ({
  page = 1,
  limit = 10
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const url = `categories?${query}`;
    const response = await axiosInstance.get<CategoriesResponse>(url);
    const categories = response.data.categories;
    return {
      categories,
      totalCount: response.data.count ?? categories.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const response = await axiosInstance.get(`/categories`);
    return response.data.categories as ICategory[];
  } catch (error) {
    throw error;
  }
};
export const getAllDailyStageCapacities = async () => {
  try {
    const response = await axiosInstance.get(`/daily/all/capacity`);
    console.log("capacity", response.data);
    
    // Extract the array from the nested structure
    // The array is at response.data.category.dailyStageCapacities
    const data = response.data?.category?.dailyStageCapacities || [];
    
    // If data is not an array, try alternative paths
    const result = Array.isArray(data) ? data : [];
    console.log('Extracted capacities array length:', result.length);
    
    return result;
  } catch (error) {
    console.error('Error fetching daily stage capacities:', error);
    return []; // Return empty array on error
  }
};

export const getCategoriesapi = async () => {
  try {
    const response = await axiosInstance.get(`/categories`);
    return response.data.categories as ICategory[];
  } catch (error) {
    throw error;
  }
};

export const getCategoryById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/categories/${id}`);
    return response.data.category as ICategory;
  } catch (error) {
    throw error;
  }
};

export const createCategory = async (
  data: Partial<ICategory>,
) => {
  try {
    const response = await axiosInstance.post(`/categories`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCategory = async (
  id: string,
  data: Partial<ICategory>,
) => {
  try {
    const response = await axiosInstance.put(`/categories/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteCategory = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/categories/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const resetDailyStageCapacities = async (
  
) => {
  try {

    const response = await axiosInstance.delete(
      '/daily-stage-capacities/reset',
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Non-destructive: rebuild the capacity ledger from current projects
// (re-reserves capacity for every in-flight project instead of  wiping it).
export const rebuildCapacityweek = async (
  mode: "FULL" | "WEEK_ONLY" = "FULL",
) => {
  try {

    const response = await axiosInstance.post(
      "/daily-stage-capacities/rebuild/week",
      { mode },
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};
export const rebuildCapacity = async (
  req?: IncomingMessage,
) => {
  try {

    const response = await axiosInstance.post(
      '/daily-stage-capacities/rebuild',
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};
/** Fetch aggregated telemetry stats for a date range. */
export const getCapacityTelemetry = async (
  from: string,
  to: string,
  stage?: string,
) => {
  try {
    const params: Record<string, string> = { from, to };
    if (stage && stage !== 'ALL') params.stage = stage;
    const response = await axiosInstance.get('/capacity/telemetry', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching capacity telemetry:', error);
    throw error;
  }
};

/** Fetch per-stage load rail for a date range. */
export const getStageLoadRail = async (
  from: string,
  to: string,
) => {
  try {
    const response = await axiosInstance.get('/capacity/stage-load', { params: { from, to } });
    return response.data;
  } catch (error) {
    console.error('Error fetching stage load rail:', error);
    throw error;
  }
};



// Generic Pagination Params
export interface GetParams {
  page?: number;
  limit?: number;
  name?: string;
}

// ========================= COLOURS ========================= //

interface ColoursResponse {
  success: boolean;
  count: number;
  colours: IColour[];
  total?: number;
  page?: number;
  totalPages?: number;
  limit?: number;
}

// Get all colours (client-side)
export const getAllColours = async ({
  page = 1,
  limit = 10,
  name
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (name) query.append('name', name);

    const url = `colours?${query.toString()}`;
    const response = await axiosInstance.get<ColoursResponse>(url);

    const colours = response.data.colours;

    return {
      colours,
      totalCount: response.data.total ?? colours.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};


export const getColours = async () => {
  try {

    // Add default pagination to prevent backend errors
    const query = new URLSearchParams({
      page: '1',
      limit: '1000', // or any max number you expect
    });

    const response = await axiosInstance.get(`/colours?${query.toString()}`);
    return response.data.colours as IColour[];
  } catch (error) {
    console.error('Error fetching colours:', error);
    throw error;
  }
};
export const getColoursApi = async () => {
  try {
    const response = await axiosInstance.get(`/colours`);
    return response.data.colours as IColour[];
  } catch (error) {
    throw error;
  }
};

// Get colour by ID
export const getColourById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/colours/${id}`);
    return response.data.colour as IColour;
  } catch (error) {
    throw error;
  }
};

// Create colour
export const createColour = async (
  data: Partial<IColour>,
) => {
  try {
    const response = await axiosInstance.post(`/colours`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update colour
export const updateColour = async (
  id: string,
  data: Partial<IColour>,
  req?: IncomingMessage
) => {
  try {
    const response = await axiosInstance.patch(`/colours/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete colour
export const deleteColour = async (id: string, req?: IncomingMessage) => {
  try {
    const response = await axiosInstance.delete(`/colours/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
