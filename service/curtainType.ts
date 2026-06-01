import { IncomingMessage } from 'http';
import { axiosInstance } from "./axiosIntance";

import { ICurtainType, IMovementType } from '@/models/curtainType';

// =========================
// Generic Pagination Params
// =========================
export interface GetParams {
  page?: number;
  limit?: number;
}

// =========================
// CURTAIN TYPES
// =========================

// Response interface for list
interface CurtainTypesResponse {
  success: boolean;
  count: number;
  curtainTypes: ICurtainType[];
}

// Get all curtain types (with pagination)
export const getAllCurtainTypes = async ({
  page = 1,
  limit = 10
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const url = `curtain-types?${query}`;
    const response = await axiosInstance.get<CurtainTypesResponse>(url);

    const curtainTypes = response.data.curtainTypes;

    return {
      curtainTypes,
      totalCount: response.data.count ?? curtainTypes.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

// Get all curtain types (SSR / auth-aware)
export const getCurtainTypes = async (req?: IncomingMessage) => {
  try {
    
    const response = await axiosInstance.get(`/curtain-types`);
    return response.data.curtainTypes as ICurtainType[];
  } catch (error) {
    throw error;
  }
};

// Get all curtain types (client-side only)
export const getCurtainTypesApi = async () => {
  try {
    const response = await axiosInstance.get(`/curtain-types`);
    return response.data.curtainTypes as ICurtainType[];
  } catch (error) {
    throw error;
  }
};

// Get curtain type by ID
export const getCurtainTypeById = async (
  id: string,
  req?: IncomingMessage
) => {
  try {
    const response = await axiosInstance.get(`/curtain-types/${id}`);
    return response.data.curtainType as ICurtainType;
  } catch (error) {
    throw error;
  }
};

// Create curtain type
export const createCurtainType = async (
  data: Partial<ICurtainType>,
  req?: IncomingMessage
) => {
  try {
    
    const response = await axiosInstance.post(`/curtain-types`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update curtain type
export const updateCurtainType = async (
  id: string,
  data: Partial<ICurtainType>,
  req?: IncomingMessage
) => {
  try {
    
    const response = await axiosInstance.put(`/curtain-types/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete curtain type
export const deleteCurtainType = async (
  id: string,
  req?: IncomingMessage
) => {
  try {
    
    const response = await axiosInstance.delete(`/curtain-types/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};





// =========================
// Generic Pagination Params
// =========================
export interface GetParams {
  page?: number;
  limit?: number;
}

// =========================
// MOVEMENTTYPES
// =========================

// Response interface for list
interface MovementTypesResponse {
  success: boolean;
  count: number;
  movementTypes: IMovementType[];
}

// Get all movement types (with pagination)
export const getAllMovementTypes = async ({
  page = 1,
  limit = 10
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const url = `movement-types?${query}`;
    const response = await axiosInstance.get<MovementTypesResponse>(url);

    const movementTypes = response.data.movementTypes;

    return {
      movementTypes,
      totalCount: response.data.count ?? movementTypes.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

// Get all movement types (SSR / auth-aware)
export const getMovementTypes = async (req?: IncomingMessage) => {
  try {
    
    const response = await axiosInstance.get(`/movement-types`);
    return response.data.movementTypes as IMovementType[];
  } catch (error) {
    throw error;
  }
};

// Get all movement types (client-side only)
export const getMovementTypesApi = async () => {
  try {
    const response = await axiosInstance.get(`/movement-types`);
    return response.data.movementTypes as IMovementType[];
  } catch (error) {
    throw error;
  }
};

// Get movement type by ID
export const getMovementTypeById = async (
  id: string,
  req?: IncomingMessage
) => {
  try {
    const response = await axiosInstance.get(`/movement-types/${id}`);
    return response.data.movementType as IMovementType;
  } catch (error) {
    throw error;
  }
};

// Create movement type
export const createMovementType = async (
  data: Partial<IMovementType>,
  req?: IncomingMessage
) => {
  try {
    
    const response = await axiosInstance.post(`/movement-types`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update movement type
export const updateMovementType = async (
  id: string,
  data: Partial<IMovementType>,
  req?: IncomingMessage
) => {
  try {
    
    const response = await axiosInstance.put(`/movement-types/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete movement type
export const deleteMovementType = async (
  id: string,
  req?: IncomingMessage
) => {
  try {
    
    const response = await axiosInstance.delete(`/movement-types/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
