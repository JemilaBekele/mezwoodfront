/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from "./axiosIntance";

import { IShopStock, IStockLedger, IStore, IStoreStock } from '@/models/store';
import { GetParams } from './roleService';

// Get all stores

interface storeResponse {
  success: boolean;
  count: number;
  stores: IStore[];
}

export const getAllstore = async ({ page = 1, limit = 10 }: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const url = `stores/get/all?${query}`;

    const response = await axiosInstance.get<storeResponse>(url);
    const stores = response.data.stores;

    return {
      stores: stores,
      totalCount: response.data.count ?? stores.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

export const getStores = async () => {
  try {
    const response = await axiosInstance.get(`/stores`);
    return response.data.stores as IStore[];
  } catch (error) {
    throw error;
  }
};
export const getStoresall = async () => {
  try {
    const response = await axiosInstance.get(`/stores/get/all`);
    console.log("store",response.data.stores)
    return response.data.stores as IStore[];
  } catch (error) {
    throw error;
  }
};

// Get a store by ID
export const getStoreById = async (id: string, ) => {
  try {
    const response = await axiosInstance.get(`/stores/${id}`);
    return response.data.store as IStore;
  } catch (error) {
    throw error;
  }
};

// Create a store
export const createStore = async (
  data: any | FormData,
  
) => {
  try {

    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

    const response = await axiosInstance.post(`/stores`, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a store
export const updateStore = async (
  id: string,
  data: Partial<IStore> | FormData,
  
) => {
  try {

    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

    const response = await axiosInstance.put(`/stores/${id}`, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a store
export const deleteStore = async (id: string, ) => {
  try {
    const response = await axiosInstance.delete(`/stores/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// types
type StockLedgerResponse = {
  stockLedgers: IStockLedger[];
  count?: number;
  success?: boolean;
};

export const getAllStockLedgers = async ({
  page = 1,
  limit = 10,
  startDate,
  endDate
}: PaginationParams = {}): Promise<{
  data: IStockLedger[];
  totalCount: number;
  success?: boolean;
}> => {
  try {

    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (startDate) {
      query.append('startDate', startDate);
    }
    if (endDate) {
      query.append('endDate', endDate);
    }

    const url = `/stores/ledgers/all?${query}`;

    const response = await axiosInstance.get<StockLedgerResponse>(url);

    return {
      data: response.data.stockLedgers,
      totalCount: response.data.count ?? response.data.stockLedgers.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

// types
type ShopStockResponse = {
  shopStocks: IShopStock[];
  count?: number;
  success?: boolean;
};

export const getAllShopStocks = async ({
  page = 1,
  limit = 10,
  startDate,
  endDate
}: PaginationParams = {}): Promise<{
  data: IShopStock[];
  totalCount: number;
  success?: boolean;
}> => {
  try {

    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (startDate) {
      query.append('startDate', startDate);
    }
    if (endDate) {
      query.append('endDate', endDate);
    }

    const url = `/stores/shop/stocks?${query}`;

    const response = await axiosInstance.get<ShopStockResponse>(url);

    return {
      data: response.data.shopStocks,
      totalCount: response.data.count ?? response.data.shopStocks.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

export interface PaginationParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}
// types
type StoreStockResponse = {
  storeStocks: IStoreStock[]; // Adjust this type if you model stores differently
  count?: number;
  success?: boolean;
};

export const getAllStoreStocks = async ({
  page = 1,
  limit = 10,
  startDate,
  endDate
}: PaginationParams = {}): Promise<{
  data: IStoreStock[];
  totalCount: number;
  success?: boolean;
}> => {
  try {

    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (startDate) {
      query.append('startDate', startDate);
    }
    if (endDate) {
      query.append('endDate', endDate);
    }

    const url = `/stores/store/stocks?${query}`;

    const response = await axiosInstance.get<StoreStockResponse>(url);

    return {
      data: response.data.storeStocks,
      totalCount: response.data.count ?? response.data.storeStocks.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};
