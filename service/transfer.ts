/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from 'http';
import { ITransfer } from '@/models/transfer';
import { axiosInstance } from './axiosIntance';

/* ================= TYPES ================= */


export interface GetTransferParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

interface TransfersResponse {
  success: boolean;
  count: number;
  transfers: ITransfer[];
}

/* ================= GET ALL ================= */

export const getAllTransfers = async ({
  page = 1,
  limit = 10,
  status,
  search
}: GetTransferParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
      ...(search && { search })
    });

    const response = await axiosInstance.get<TransfersResponse>(
      `/transfers/getall`
    );
    const transfers = response.data.transfers;

    return {
      data: transfers,
      totalCount: response.data.count ?? transfers.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

/* ================= SSR SAFE ================= */

export const getTransfers = async () => {
  try {
    const response = await axiosInstance.get(`/transfers`);
    return response.data.transfers as ITransfer[];
  } catch (error) {
    throw error;
  }
};

/* ================= GET BY ID ================= */

export const getTransferById = async (
  id: string,
) => {
  try {
    const response = await axiosInstance.get(`/transfers/${id}`);
    return response.data.transfer as ITransfer;
  } catch (error) {
    throw error;
  }
};
export const getTransferId = async (
  id: string,
  
) => {
  try {
    const response = await axiosInstance.get(`/transfers/${id}`);
    return response.data.transfer as ITransfer;
  } catch (error) {
    throw error;
  }
};
/* ================= GET BY SHORT CODE ================= */

export const getTransferByShortCode = async (
  shortCode: string,
  
) => {
  try {
    const response = await axiosInstance.get(
      `/transfers/shortcode/${shortCode}`
    );
    return response.data.transfer as ITransfer;
  } catch (error) {
    throw error;
  }
};

/* ================= GET ITEMS ================= */

export const getTransferItems = async (
  id: string,
  
) => {
  try {
    const response = await axiosInstance.get(
      `/transfers/${id}/items`
    );
    return response.data.items;
  } catch (error) {
    throw error;
  }
};

/* ================= STATS ================= */

export const getTransferStats = async () => {
  try {
    const response = await axiosInstance.get(`/transfers/stats`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/* ================= CREATE ================= */

export const createTransfer = async (
  data: any,
  
) => {
  try {

    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

    const response = await axiosInstance.post(
      `/transfers`,
      data,
      config
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

/* ================= UPDATE ================= */

export const updateTransfer = async (
  id: string,
  data: any,
  
) => {
  try {

    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

    const response = await axiosInstance.put(
      `/transfers/${id}`,
      data,
      config
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

/* ================= COMPLETE ================= */

export const completeTransfer = async (
  id: string,
  
) => {
  try {
    const response = await axiosInstance.post(
      `/transfers/${id}/complete`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/* ================= CANCEL ================= */

export const cancelTransfer = async (
  id: string,
  
) => {
  try {
    const response = await axiosInstance.post(
      `/transfers/${id}/cancel`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/* ================= DELETE ================= */

export const deleteTransfer = async (
  id: string,
  
) => {
  try {
    const response = await axiosInstance.delete(
      `/transfers/${id}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const getProducts = async ({
  type, // 'items' | 'materials'
  source, // 'store' | 'showroom'
  id,
}: {
  type: 'items' | 'materials';
  source: 'store' | 'showroom';
  id: string;
}, ) => {

  const response = await axiosInstance.get(
    `/${source}/${id}/${type}`
  );
console.log('Products response:', response.data); // Debug log
  return response.data;
};