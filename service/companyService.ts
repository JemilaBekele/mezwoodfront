import { IncomingMessage } from 'http';

import { ICompany } from '@/models/employee';
import { axiosInstance } from './axiosIntance';

// Get all companies
export const getCompanies = async () => {
  try {
    const response = await axiosInstance.get(`/companies`);
    return response.data.companies as ICompany[];
  } catch (error) {
    throw error;
  }
};

// Get a company by ID
export const getCompanyById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/companies/${id}`);
    return response.data as ICompany;
  } catch (error) {
    throw error;
  }
};

// Create a company
// Create a company
export const createCompany = async (
  data: ICompany | FormData,
) => {
  try {

    // Check if data is FormData
    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

    const response = await axiosInstance.post(`/companies`, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a company
export const updateCompany = async (
  id: string,
  data: Partial<ICompany> | FormData,
) => {
  try {

    // Check if data is FormData
    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

    const response = await axiosInstance.put(`/companies/${id}`, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a company
export const deleteCompany = async (id: string, ) => {
  try {
    const response = await axiosInstance.delete(`/companies/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
