/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from 'http';

import {
  IStore,
} from '@/models/store';
import { axiosInstance } from './axiosIntance';

// ================= TYPES =================

export interface PaginationParams {
  page?: number;
  limit?: number;

  startDate?: string;
  endDate?: string;
}

interface StoreResponse {
  success: boolean;
  count: number;
  stores: IStore[];
}

// ================= STORE =================

// Get paginated stores
export const getAllStores = async ({
  page = 1,
  limit = 10
}: PaginationParams = {}) => {
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  const response = await axiosInstance.get<StoreResponse>(`/stores/get/all?${query}`);

  return {
    stores: response.data.stores,
    totalCount: response.data.count ?? response.data.stores.length,
    success: response.data.success
  };
};

// Get all stores (no pagination)
export const getStoresAll = async () => {
  const response = await axiosInstance.get(`/stores/get/all`);
  return response.data.stores as IStore[];
};

// Get store by ID
export const getStoreById = async (id: string, ) => {
  const response = await axiosInstance.get(`/stores/${id}`);
  return response.data.store as IStore;
};

// Create store
export const createStore = async (
  data: Partial<IStore> | FormData,

) => {

  const config =
    data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};

  const response = await axiosInstance.post(`/stores`, data, config);
  return response.data;
};

// Update store
export const updateStore = async (
  id: string,
  data: Partial<IStore> | FormData,

) => {

  const config =
    data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};

  const response = await axiosInstance.put(`/stores/${id}`, data, config);
  return response.data;
};

// Delete store
export const deleteStore = async (id: string, ) => {
  const response = await axiosInstance.delete(`/stores/${id}`);
  return response.data;
};

// ================= MAIN STORE =================

// Set main store
export const setMainStore = async (id: string, ) => {
  const response = await axiosInstance.put(`/stores/${id}/set-main`);
  return response.data;
};

// Get main store
export const getMainStore = async () => {
  const response = await axiosInstance.get(`/stores/main`);
  return response.data.store as IStore;
};

// ================= STOCK LEDGER =================

type StockLedgerResponse = {
  stockLedgers: any[];
  count?: number;
  success?: boolean;
};

export const getAllStockLedgers = async ({
  page = 1,
  limit = 10,
  startDate,
  endDate
}: PaginationParams = {}) => {
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  if (startDate) query.append('startDate', startDate);
  if (endDate) query.append('endDate', endDate);

  const response = await axiosInstance.get<StockLedgerResponse>(
    `/stores/ledgers/all?${query}`
  );

  return {
    data: response.data.stockLedgers,
    totalCount:
      response.data.count ?? response.data.stockLedgers.length,
    success: response.data.success
  };
};

// ================= SHOP STOCK =================

type ShopStockResponse = {
  shopStocks: any[];
  count?: number;
  success?: boolean;
};

export const getAllShopStocks = async ({
  page = 1,
  limit = 10,
  startDate,
  endDate
}: PaginationParams = {}) => {
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  if (startDate) query.append('startDate', startDate);
  if (endDate) query.append('endDate', endDate);

  const response = await axiosInstance.get<ShopStockResponse>(
    `/stores/shop/stocks?${query}`
  );

  return {
    data: response.data.shopStocks,
    totalCount:
      response.data.count ?? response.data.shopStocks.length,
    success: response.data.success
  };
};

// ================= STORE STOCK =================

type StoreStockResponse = {
  storeStocks: any[];
  count?: number;
  success?: boolean;
};

export const getAllStoreStocks = async ({
  page = 1,
  limit = 10,
  startDate,
  endDate
}: PaginationParams = {}) => {
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  if (startDate) query.append('startDate', startDate);
  if (endDate) query.append('endDate', endDate);

  const response = await axiosInstance.get<StoreStockResponse>(
    `/stores/store/stocks?${query}`
  );

  return {
    data: response.data.storeStocks,
    totalCount:
      response.data.count ?? response.data.storeStocks.length,
    success: response.data.success
  };
};