/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from "./axiosIntance";
import { IBranch } from '@/models/Branch';
import { GetParams } from './roleService';

// Get all branches
interface BranchesResponse {
  success: boolean;
  count: number;
  branches: IBranch[];
}

export const getAllbranches = async ({
  page = 1,
  limit = 10
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const url = `branches?${query}`;

    const response = await axiosInstance.get<BranchesResponse>(url);
    const branches = response.data.branches;

    return {
      branches: branches,
      totalCount: response.data.count ?? branches.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};
export const getBranches = async () => {
  try {
   
    const response = await axiosInstance.get(`/branches`);
    return response.data.branches as IBranch[];
  } catch (error) {
    throw error;
  }
};

// Get a branch by ID
export const getBranchById = async (id: string, ) => {
  try {
    const response = await axiosInstance.get(`/branches/${id}`);
    return response.data.branch as IBranch;
  } catch (error) {
    throw error;
  }
};

// Create a branch
export const createBranch = async (
  data: any | FormData,
  
) => {
  try {
   

    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

    const response = await axiosInstance.post(`/branches`, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a branch
export const updateBranch = async (
  id: string,
  data: Partial<IBranch> | FormData,
  
) => {
  try {
   

    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

    const response = await axiosInstance.put(`/branches/${id}`, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a branch
export const deleteBranch = async (id: string, ) => {
  try {
   
    const response = await axiosInstance.delete(`/branches/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
