/* eslint-disable import/no-unresolved */
import { axiosInstance } from "./axiosIntance";

import { ISupplier } from '@/models/supplier';
import { GetParams } from './roleService';

interface SupplierResponse {
  success: boolean;
  count: number;
  suppliers: ISupplier[];
}

export const getAllSuppliers = async ({
  page = 1,
  limit = 10
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const url = `/suppliers?${query}`;
    const response = await axiosInstance.get<SupplierResponse>(url);
    const suppliers = response.data.suppliers;

    return {
      suppliers,
      totalCount: response.data.count ?? suppliers.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

export const getSupplier = async () => {
  try {

    const response = await axiosInstance.get(`/suppliers`);
    return response.data.suppliers;
  } catch (error) {
    throw error;
  }
};
export const getSupplierById = async (id: string | number) => {
  try {
    const response = await axiosInstance.get(`/suppliers/${id}`);
    return response.data.supplier;
  } catch (error) {
    throw error;
  }
};

export const createSupplier = async (
  supplierData: ISupplier,
  
) => {
  try {
    const response = await axiosInstance.post('/suppliers', supplierData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateSupplier = async (
  id: string,
  updatedData: Partial<ISupplier>,
  
) => {
  try {
    const response = await axiosInstance.put(`/suppliers/${id}`, updatedData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteSupplier = async (
  id: string | number,
  
) => {
  try {
    const response = await axiosInstance.delete(`/suppliers/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
