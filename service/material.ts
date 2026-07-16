/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from 'http';

import { IMaterial } from '@/models/material';
import { MaterialDetail } from '@/models/materialDetail';
import { axiosInstance } from './axiosIntance';

// ========================= TYPES ========================= //

interface MaterialResponse {
  success: boolean;
  material: IMaterial;
}

interface MaterialsResponse {
  success: boolean;
  materials: IMaterial[];
  count: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CreateUpdateMaterialResponse {
  success: boolean;
  material?: IMaterial;
  data?: IMaterial;
  message?: string;
}

interface DeleteMaterialResponse {
  success: boolean;
  message: string;
}

// ========================= MATERIALS ========================= //

// Get all materials (client-side with pagination)
export const getAllMaterials = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const response = await axiosInstance.get<MaterialsResponse>(`/materials`);

    const materials = response?.data?.materials ?? [];
    const pagination = response?.data?.pagination;

    return {
      materials,
      totalCount: pagination?.total ?? materials.length,
      success: response?.data?.success ?? false
    };
  } catch (error) {
    console.error('Error fetching materials:', error);

    return {
      materials: [] as IMaterial[],
      totalCount: 0,
      success: false
    };
  }
};

// Get all materials (server-side / authenticated)
export const getMaterials = async () => {
  try {
    const response = await axiosInstance.get<MaterialsResponse>(`/materials`);
    return response.data.materials; 
  } catch (error) {
    throw error;
  }
};
export const getMaterialId = async (
  id: string,
) => {
  try {
    const response = await axiosInstance.get<MaterialResponse>(
      `/materials/viewmaterial/${id}`
    );
    return response.data.material as unknown  as MaterialDetail;
  } catch (error) {
    throw error;
  }
};
// Get material by ID
export const getMaterialById = async (
  id: string,
  
) => {
  try {
    const response = await axiosInstance.get<MaterialResponse>(
      `/materials/${id}`
    );
    return response.data.material as unknown  as MaterialDetail;
  } catch (error) {
    throw error;
  }
};
// Get material stock by ID
export const getMaterialStockById = async (
  id: string,
  
) => {
  try {
    const response = await axiosInstance.get(
      `/materials/Stock/available/${id}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
// Create material
// Create material supporting both FormData and regular objects
export const createMaterial = async (
  data: FormData | (Partial<IMaterial> & { image?: File }),
  
) => {
  try {
    
    let requestData = data;
    let headers = {};
    
    // If data is not FormData but has image, convert to FormData
    if (!(data instanceof FormData) && (data.image || data.imageUrl)) {
      requestData = new FormData();
      
      // Append all fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'image' && value instanceof File) {
            (requestData as FormData).append(key, value);
          } else {
            (requestData as FormData).append(key, String(value));
          }
        }
      });
      
      headers = { 'Content-Type': 'multipart/form-data' };
    } else if (data instanceof FormData) {
      headers = { 'Content-Type': 'multipart/form-data' };
    }
    
    const response = await axiosInstance.post<CreateUpdateMaterialResponse>(
      `/materials`,
      requestData,
      { headers }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// Update material supporting both FormData and regular objects
export const updateMaterial = async (
  id: string,
  data: FormData | (Partial<IMaterial> & { image?: File }),
  
) => {
  try {
    
    let requestData = data;
    let headers = {};
    
    // If data is not FormData but has image, convert to FormData
    if (!(data instanceof FormData) && (data.image || data.imageUrl)) {
      requestData = new FormData();
      
      // Append all fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'image' && value instanceof File) {
            (requestData as FormData).append(key, value);
          } else {
            (requestData as FormData).append(key, String(value));
          }
        }
      });
      
      headers = { 'Content-Type': 'multipart/form-data' };
    } else if (data instanceof FormData) {
      headers = { 'Content-Type': 'multipart/form-data' };
    }
    
    const response = await axiosInstance.put<CreateUpdateMaterialResponse>(
      `/materials/${id}`,
      requestData,
      { headers }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// Delete material
export const deleteMaterial = async (
  id: string,
  
) => {
  try {
    const response = await axiosInstance.delete<DeleteMaterialResponse>(
      `/materials/${id}`
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

export const updateProformaMaterialStatus = async (
  id: string,
   status: string,
  givenToId?: string,
  givenquantity?: number,
  additionalQuantity?: number,
  
) => {
  try {

    const response = await axiosInstance.patch(
      `/proforma-materials/${id}/status`,
      {
        status,
        givenToId,
        givenquantity,
        additionalQuantity,
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};


export const acceptMaterialInitialStock = async (
  materialId: string,
  initialQuantity: number,
) => {
  try {
    const response = await axiosInstance.post(
      `/materials/accept-initial-stock`,
      {
        materialId,
        initialQuantity,
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to accept initial stock'
    );
  }
};