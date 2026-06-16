/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from 'http';

import { GetParams } from './roleService';
import { IPurchase } from '@/models/purchase';
import { IStockCorrection } from '@/models/StockCorrection';
import { axiosInstance } from './axiosIntance';

// Types

interface PurchasesResponse {
  success: boolean;
  count: number;
  purchases: IPurchase[];
}

// Get all purchases with pagination and filtering
export const getAllPurchases = async (
  params: GetParams & {
    startDate?: string;
    endDate?: string;
  } = {}
) => {
  try {
    const { page = 1, limit = 10, ...filters } = params;
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    // Add filter params if they exist
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value.toString());
      }
    });

    const url = `purchases?${query}`;
    const response = await axiosInstance.get<PurchasesResponse>(url);
    const purchases = response.data.purchases;

    return {
      purchases,
      totalCount: response.data.count ?? purchases.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

// Get all purchases (simple version)
export const getPurchases = async () => {
  try {
    
    const response = await axiosInstance.get(`/purchases`);
    return response.data.purchases as IPurchase[];
  } catch (error) {
    throw error;
  }
};

// Get a purchase by ID
export const getPurchaseById = async (id: string, ) => {
  try {
    const response = await axiosInstance.get(`/purchases/${id}`);
    return response.data.purchase as IPurchase;
  } catch (error) {
    throw error;
  }
};
export const getPurchaseId = async (id: string, ) => {
  try {
    
    const response = await axiosInstance.get(`/purchases/${id}`);
    return response.data.purchase as IPurchase;
  } catch (error) {
    throw error;
  }
};
export const getStockCorrectionsByPurchaseId = async (
  id: string,
  
): Promise<IStockCorrection[]> => {
  try {
    
    const response = await axiosInstance.get(
      `/stock-corrections/purchase/${id}`
    );
    return response.data.stockCorrection as IStockCorrection[];
  } catch (error) {
    throw error;
  }
};
// Get a purchase by invoice number
export const getPurchaseByInvoiceNo = async (
  invoiceNo: string,
  
) => {
  try {
    const response = await axiosInstance.get(`/purchases/invoice/${invoiceNo}`);
    return response.data.purchase as IPurchase;
  } catch (error) {
    throw error;
  }
};

// Create a purchase
export const createPurchase = async (data: any, ) => {
  try {
    
    const response = await axiosInstance.post(`/purchases`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a purchase
export const updatePurchase = async (
  id: string,
  data: any,
  
) => {
  try {
    
    const response = await axiosInstance.put(`/purchases/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const acceptPurchase = async (
  id: string,
  paymentStatus: string,
  
) => {
  try {
    

    // ✅ Send paymentStatus inside request body
    const response = await axiosInstance.put(`/purchases/accept/${id}`, {
      paymentStatus
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a purchase
export const deletePurchase = async (id: string, ) => {
  try {
    
    const response = await axiosInstance.delete(`/purchases/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
