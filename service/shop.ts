/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from "./axiosIntance";

import { IShop } from '@/models/shop';
import { GetParams } from './roleService';
import { IProductBatch } from '@/models/Product';

interface locationResponse {
  success: boolean;
  count: number;
  shops: IShop[];
}

export const getAllshop = async ({ page = 1, limit = 10 }: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const url = `shops/get/all?${query}`;

    const response = await axiosInstance.get<locationResponse>(url);
    const shops = response.data.shops;

    return {
      shops: shops,
      totalCount: response.data.count ?? shops.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};
// Get all shops
export const getShops = async () => {
  try {
    const response = await axiosInstance.get(`/shops`);
    return response.data.shops as IShop[];
  } catch (error) {
    throw error;
  }
};
export const getShopsall = async () => {
  try {
    const response = await axiosInstance.get(`/shops/get/all`);
        console.log("store",response.data.shops)

    return response.data.shops as IShop[];
  } catch (error) {
    throw error;
  }
};
export const getShopallapi = async () => {
  try {
    const response = await axiosInstance.get(`/shops/get/all`);
console.log("store",response.data.shops)
    return response.data.shops as IShop[];
  } catch (error) {
    throw error;
  }
};
export const getShopsapi = async () => {
  try {
    const response = await axiosInstance.get(`/shops`);
    return response.data.shops as IShop[];
  } catch (error) {
    throw error;
  }
};
export const getShopsBasedOnUser = async () => {
  try {
    const response = await axiosInstance.get(`/shops/based/user`);
    return response.data.shops as IShop[];
  } catch (error) {
    throw error;
  }
};

// Get a shop by ID
export const getShopById = async (id: string, ) => {
  try {
    const response = await axiosInstance.get(`/shops/${id}`);
    return response.data.shop as IShop;
  } catch (error) {
    throw error;
  }
};

// Create a shop
export const createShop = async (
  data: any | FormData,
  
) => {
  try {

    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

    const response = await axiosInstance.post(`/shops`, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a shop
export const updateShop = async (
  id: string,
  data: Partial<IShop> | FormData,
  
) => {
  try {

    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

    const response = await axiosInstance.put(`/shops/${id}`, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a shop
export const deleteShop = async (id: string, ) => {
  try {
    const response = await axiosInstance.delete(`/shops/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export interface IBatchesResponse {
  batches: IProductBatch[];
  count: number;
}

export const getAvailableBatchesByProductAndShop = async (
  shopId: string,
  productId: string,
  
) => {
  try {
    const response = await axiosInstance.get(
      `/shops/${shopId}/products/${productId}/batches`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const UsergetAvailableBatchesByProductAndShop = async (
  shopId: string,
  productId: string,
  
): Promise<IBatchesResponse> => {
  try {
    const response = await axiosInstance.get(
      `/shops/${shopId}/products/${productId}/batches/user/based`
    );
    return response.data.batches as IBatchesResponse;
  } catch (error) {
    throw error;
  }
};
