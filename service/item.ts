/* eslint-disable @typescript-eslint/no-explicit-any */
import { IItem } from '@/models/item';
import { IProformaInvoice } from '@/models/ProformaInvoice';
import { ISell } from './Sell';
import { axiosInstance } from './axiosIntance';

// ========================= TYPES ========================= //

interface ItemResponse {
  success: boolean;
  item: IItem;
}

interface ItemsResponse {
  success: boolean;
  items: IItem[];
  count: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CreateUpdateItemResponse {
  success: boolean;
  item?: IItem;
  data?: IItem;
  message?: string;
}

interface DeleteItemResponse {
  success: boolean;
  message: string;
}

// ========================= ITEMS ========================= //

// Get all items (client-side with pagination)
export const getAllItems = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    console.log('fetaching  ')
    const response = await axiosInstance.get(`/items/get/all`);

    const items = response?.data?.items ?? [];
    const pagination = response?.data?.pagination;

    return {
      items,
      totalCount: pagination?.total ?? items.length,
      success: response?.data?.success ?? false,
    };
  } catch (error) {
    console.error('Error fetching items:', error);

    return {
      items: [] as IItem[],
      totalCount: 0,
      success: false,
    };
  }
};

// Get all items (server-side / authenticated)
export const getItems = async () => {
  try {
    const response = await axiosInstance.get<any>(`/items/get/all`);
    return response.data.items;
  } catch (error) {
    throw error;
  }
};
export const getItemslist = async () => {
  try {
    const response = await axiosInstance.get<ItemsResponse>(`/items/get/all/list/pos/all`);
    return response.data.items;
  } catch (error) {
    throw error;
  }
};
// Get all items (server-side / authenticated)
export const getAllItemsimple = async () => {
  try {
    const response = await axiosInstance.get<ItemsResponse>(`/items/get/all/simple`);
    return response.data.items;
  } catch (error) {
    throw error;
  }
};



// ==================== PROFORMA + SALES ====================

// Get item by ID
export const getItemId = async (
  id: string,
) => {
  try {
    const response = await axiosInstance.get<ItemResponse>(
      `/items/${id}`,
    );
    return response.data.item;
  } catch (error) {
    throw error;
  }
};

export const getItemById = async (
  id: string,
) => {
  try {
    const response = await axiosInstance.get<ItemResponse>(
      `/items/${id}`,
    );
    return response.data.item;
  } catch (error) {
    throw error;
  }
};
export const getItemDetailById = async (
  id: string,
) => {
  try {

    const response = await axiosInstance.get<any>(
      `/items/${id}/detail`,
    );

    return response.data.item;
  } catch (error) {
    throw error;
  }
};
// Create item with image support
export const createItem = async (
  data: FormData | (Partial<IItem> & { image?: File; materials?: any[] }),
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
          } else if (key === 'materials' && Array.isArray(value)) {
            // Handle materials array - convert to JSON string
            (requestData as FormData).append(key, JSON.stringify(value));
          } else {
            (requestData as FormData).append(key, String(value));
          }
        }
      });
      
      headers = { 'Content-Type': 'multipart/form-data' };
    } else if (data instanceof FormData) {
      headers = { 'Content-Type': 'multipart/form-data' };
    }
    
    const response = await axiosInstance.post<CreateUpdateItemResponse>(
      `/items`,
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

// Update item with image support
export const updateItem = async (
  id: string,
  data: FormData | (Partial<IItem> & { image?: File; materials?: any[] }),
  
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
          } else if (key === 'materials' && Array.isArray(value)) {
            // Handle materials array - convert to JSON string
            (requestData as FormData).append(key, JSON.stringify(value));
          } else {
            (requestData as FormData).append(key, String(value));
          }
        }
      });
      
      headers = { 'Content-Type': 'multipart/form-data' };
    } else if (data instanceof FormData) {
      headers = { 'Content-Type': 'multipart/form-data' };
    }
    
    const response = await axiosInstance.put<CreateUpdateItemResponse>(
      `/items/${id}`,
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

// Delete item
export const deleteItem = async (
  id: string,
  
) => {
  try {
    const response = await axiosInstance.delete<DeleteItemResponse>(
      `/items/${id}`,
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};







export interface IProformaSalesFilterParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  paymentStatus?: string;
  createdById?: string;
  customerId?: string;
  storeId?: string;
  searchTerm?: string;
  type?: 'proforma' | 'sale' | 'all';
  page?: number;
  limit?: number;
}

export interface IPaginationInfo {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ISummaryInfo {
  proformaCount: number;
  salesCount: number;
  totalCount: number;
  dateRange?: {
    from: string;
    to: string;
  };
  filteredByUser?: string;
  filteredByStatus?: string;
  filteredByPaymentStatus?: string;
}

export interface IProformaSalesResponse {
  success: boolean;
  data: (IProformaInvoice | ISell)[];
  pagination: IPaginationInfo;
  summary: ISummaryInfo;
}

export const getAllProformaInvoicesAndSales = async (
  params?: IProformaSalesFilterParams,
  
): Promise<IProformaSalesResponse> => {
  try {

    const response = await axiosInstance.get(
      `/items/Proforma/Invoices/Sales`,
      {
        params: {
          startDate: params?.startDate,
          endDate: params?.endDate,
          status: params?.status,
          paymentStatus: params?.paymentStatus,
          createdById: params?.createdById,
          customerId: params?.customerId,
          storeId: params?.storeId,
          searchTerm: params?.searchTerm,
          type: params?.type,
          page: params?.page,
          limit: params?.limit,
        },
      },
    );
console.log('Response from API:', response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const acceptItemInitialStock = async (payload: {
  items: Array<{
    itemId: string;
    initialQuantity: number;
    storeId?: string;
    showroomId?: string;
  }>;
}) => {
  try {
    const response = await axiosInstance.post(
      `/items/accept-initial-stock`,
      payload
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to accept item initial stock'
    );
  }
};