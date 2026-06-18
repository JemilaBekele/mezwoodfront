/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from 'http';
import { axiosInstance } from './axiosIntance';
import { IShowroom } from '@/models/showroom';
import { GetParams } from './roleService';

// ================= TYPES =================

interface ShowroomResponse {
  success: boolean;
  count: number;
  showrooms: IShowroom[];
}

// ================= SHOWROOM =================

// Get paginated showrooms
export const getAllShowrooms = async ({
  page = 1,
  limit = 10
}: GetParams = {}) => {
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  const response = await axiosInstance.get<ShowroomResponse>(
    `/showrooms/get/all`
  );

  return {
    showrooms: response.data.showrooms,
    totalCount:
      response.data.count ?? response.data.showrooms.length,
    success: response.data.success
  };
};

// Get all showrooms (no pagination)
export const getShowroomsAll = async () => {
  
  const response = await axiosInstance.get(
    `/showrooms/get/all`
  );
  return response.data.showrooms as IShowroom[];
};

// Get showrooms based on user
export const getShowroomsByUser = async () => {
  
  const response = await axiosInstance.get(
    `/showrooms/based/user`
  );
  return response.data.showrooms as IShowroom[];
};
export const getStoresByUser = async () => {
  
  const response = await axiosInstance.get(
    `stores/find/based/user`
  );
  return response.data.stores as IShowroom[];
};

// Get showroom by ID
export const getShowroomById = async (
  id: string,
  
) => {
  const response = await axiosInstance.get(
    `/showrooms/${id}`
  );
  return response.data.showroom as IShowroom;
};

// Create showroom
export const createShowroom = async (
  data: any | FormData,
  
) => {
  

  const config =
    data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};

  const response = await axiosInstance.post(
    `/showrooms`,
    data,
    config
  );

  return response.data;
};

// Update showroom
export const updateShowroom = async (
  id: string,
  data: Partial<IShowroom> | FormData,
  
) => {
  

  const config =
    data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};

  const response = await axiosInstance.put(
    `/showrooms/${id}`,
    data,
    config
  );

  return response.data;
};

// Delete showroom
export const deleteShowroom = async (
  id: string,
  
) => {
  
  const response = await axiosInstance.delete(
    `/showrooms/${id}`
  );
  return response.data;
};

// ================= MAIN SHOWROOM =================

// Set main showroom
export const setMainShowroom = async (
  id: string,
  
) => {
  
  const response = await axiosInstance.put(
    `/showrooms/${id}/set-main`
  );
  return response.data;
};

// Get main showroom
export const getMainShowroom = async () => {
  
  const response = await axiosInstance.get(
    `/showrooms/main`
  );
  return response.data.showroom as IShowroom;
};