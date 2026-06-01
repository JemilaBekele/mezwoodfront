/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from "./axiosIntance";

import { PaginationParams } from './store';

// 🔹 Define StockCorrection type (adjust fields to your model)
export interface IStockCorrection {
  id: string;
  reference: string;
  items: any[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 🔹 API Response type
interface StockCorrectionResponse {
  success: boolean;
  count: number;
  stockCorrections: IStockCorrection[];
}

// ✅ Get all stock corrections with pagination + filters
export const getAllStockCorrections = async ({
  page = 1,
  limit = 10,
  startDate,
  endDate
}: PaginationParams = {}): Promise<{
  data: IStockCorrection[];
  totalCount: number;
  success?: boolean;
}> => {
  try {

    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);

    const url = `/stock-corrections?${query}`;

    const response = await axiosInstance.get<StockCorrectionResponse>(url);

    return {
      data: response.data.stockCorrections,
      totalCount: response.data.count ?? response.data.stockCorrections.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

// ✅ Get stock corrections (simple version)
export const getStockCorrections = async () => {
  try {
    const response = await axiosInstance.get(`/stock-corrections`);
    return response.data.stockCorrections as IStockCorrection[];
  } catch (error) {
    throw error;
  }
};

// ✅ Get stock correction by ID
export const getStockCorrectionById = async (
  id: string,
  
) => {
  try {
    const response = await axiosInstance.get(`/stock-corrections/${id}`);
    return response.data.stockCorrection;
  } catch (error) {
    throw error;
  }
};
export const getStockCorrectionId = async (
  id: string,
  
) => {
  try {
    const response = await axiosInstance.get(`/stock-corrections/${id}`);
    return response.data.stockCorrection;
  } catch (error) {
    throw error;
  }
};

// ✅ Get stock correction by reference
export const getStockCorrectionByReference = async (
  reference: string,
  
) => {
  try {
    const response = await axiosInstance.get(
      `/stock-corrections/reference/${reference}`
    );
    return response.data.stockCorrection as IStockCorrection;
  } catch (error) {
    throw error;
  }
};

// ✅ Create stock correction
export const createStockCorrection = async (
  data: any,
  
) => {
  try {
    const response = await axiosInstance.post(`/stock-corrections`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Update stock correction
export const updateStockCorrection = async (
  id: string,
  data: any,
  
) => {
  try {
    const response = await axiosInstance.put(`/stock-corrections/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Approve stock correction
export const approveStockCorrection = async (
  id: string,
  
) => {
  try {
    const response = await axiosInstance.post(
      `/stock-corrections/${id}/approve`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Reject stock correction
export const rejectStockCorrection = async (
  id: string,
  
) => {
  try {
    const response = await axiosInstance.post(
      `/stock-corrections/${id}/reject`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Delete stock correction
export const deleteStockCorrection = async (
  id: string,
  
) => {
  try {
    const response = await axiosInstance.delete(`/stock-corrections/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
