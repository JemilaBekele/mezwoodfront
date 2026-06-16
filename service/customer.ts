/* eslint-disable @typescript-eslint/no-explicit-any */
import { GetParams } from './roleService';
import { ICustomer } from '@/models/customer';
import { axiosInstance } from './axiosIntance';

interface CustomerResponse {
  success: boolean;
  count: number;
  customers: ICustomer[];
}

export const getAllCustomers = async ({
  page = 1,
  limit = 10
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const url = `/customers?${query}`;
    const response = await axiosInstance.get<CustomerResponse>(url);
    const customers = response.data.customers;

    return {
      customers,
      totalCount: response.data.count ?? customers.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

export const getCustomer = async () => {
  try {
    const response = await axiosInstance.get('/customers');
    return response.data.customers;
  } catch (error) {
    throw error;
  }
};

export const getCustomerById = async (id: string | number) => {
  try {
    const response = await axiosInstance.get(`/customers/${id}`);
    return response.data.customer;
  } catch (error) {
    throw error;
  }
};

export const createCustomer = async (
  customerData: any,
) => {
  try {
    console.log("customer data",customerData)
    const response = await axiosInstance.post('/customers', customerData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCustomer = async (
  id: string,
  updatedData: Partial<ICustomer>,
) => {
  try {
    const response = await axiosInstance.put(`/customers/${id}`, updatedData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteCustomer = async (
  id: string | number,
) => {
  try {
    const response = await axiosInstance.delete(`/customers/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
