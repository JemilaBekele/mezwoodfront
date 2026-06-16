/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from 'http';
import { EstimationStatus, IDeliveryEstimation } from '@/models/delivery-estimation';
import { axiosInstance } from './axiosIntance';

/* ========================= ENUMS & TYPES ========================= */



/* ========================= RESPONSES ========================= */

interface DeliveryEstimationResponse {
  success: boolean;
  estimation: IDeliveryEstimation;
}

interface DeliveryEstimationsResponse {
  success: boolean;
  estimations: IDeliveryEstimation[];
  count: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CreateUpdateResponse {
  data: any;
  success: boolean;
  estimation?: IDeliveryEstimation;
  message?: string;
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

interface StatsResponse {
  success: boolean;
  stats: {
    total: number;
    estimated: number;
    confirmed: number;
    onHold: number;
    expired: number;
  };
}

/* ========================= SERVICES ========================= */

// Get all delivery estimations (client-side)
export const getAllDeliveryEstimations = async (params?: {
  page?: number;
  limit?: number;
  status?: EstimationStatus;
  search?: string;
}) => {
  try {
    const response = await axiosInstance.get<DeliveryEstimationsResponse>(
      `/delivery-estimations`,
      {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          status: params?.status,
          search: params?.search || '',
        },
      },
    );

    const estimations = response?.data?.estimations ?? [];
    const pagination = response?.data?.pagination;

    return {
      estimations,
      totalCount: pagination?.total ?? estimations.length,
      success: response?.data?.success ?? false,
    };
  } catch (error) {
    console.error('Error fetching delivery estimations:', error);
    return {
      estimations: [] as IDeliveryEstimation[],
      totalCount: 0,
      success: false,
    };
  }
};

// Get all delivery estimations (server-side / auth)
export const getDeliveryEstimations = async () => {
  const response = await axiosInstance.get<DeliveryEstimationsResponse>(
    `/delivery-estimations`,
  );
  return response.data.estimations;
};



// Get delivery estimation by ID
export const getDeliveryEstimationId = async (
  id: string) => {
  const response = await axiosInstance.get<DeliveryEstimationResponse>(
    `/delivery-estimations/${id}`,
  );
  return response.data.estimation;
};

export const getDeliveryEstimationById = async (
  id: string,
) => {
  const response = await axiosInstance.get<DeliveryEstimationResponse>(
    `/delivery-estimations/${id}`,
  );
  return response.data.estimation;
};

// Search delivery estimations by customer name
export const searchDeliveryEstimationsByCustomer = async (
  customerName: string,
) => {
  const response = await axiosInstance.get<DeliveryEstimationsResponse>(
    `/delivery-estimations/search/customer`,
    {
      params: { customerName },
    },
  );
  return response.data.estimations;
};

// Create delivery estimation
export const createDeliveryEstimation = async (
  data: any,
) => {
  try {
    const response = await axiosInstance.post<CreateUpdateResponse>(
      `/delivery-estimations`,
      data,
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};
// Calculate delivery estimation
export const calculateDeliveryEstimation = async (
  data:any,
) => {

  const response = await axiosInstance.post<{
    success: boolean;
    message: string;
    data: any; // you can replace `any` with a proper type later
  }>(
    '/delivery-estimations/calculate',
    data,
  );

  return response.data;
};
// Update delivery estimation
export const updateDeliveryEstimation = async (
  id: string,
  data: any,
) => {
  try {
    const response = await axiosInstance.patch<CreateUpdateResponse>(
      `/delivery-estimations/${id}`,
      data,
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};
// Create project from delivery estimation
export const createProjectFromDeliveryEstimation = async (
  data: {
    deliveryEstimationCode: string;
    proformaInvoiceId: string;
  },
) => {
  try {

    const response = await axiosInstance.post<CreateUpdateResponse>(
      `/delivery-estimations/create-project`,
      data,
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};
export const getAllOnHoldDeliveryEstimations = async () => {
  const response = await axiosInstance.get<DeliveryEstimationsResponse>(
    `/delivery-estimations/All/OnHold`,
  );
  return response.data.estimations;
};
// Delete delivery estimation
export const deleteDeliveryEstimation = async (
  id: string,
) => {
  const response = await axiosInstance.delete<DeleteResponse>(
    `/delivery-estimations/${id}`,
  );
  return response.data;
};


// Update estimation status
export const updateDeliveryEstimationStatus = async (
  id: string,
  status: EstimationStatus,
) => {
  const response = await axiosInstance.patch<CreateUpdateResponse>(
    `/delivery-estimations/${id}/status`,
    { status },
  );
  return response.data;
};
export const confirmDeliveryEstimation = async (
  id: string,
) => {
  const response = await axiosInstance.patch<CreateUpdateResponse>(
    `/delivery-estimations/${id}/confirm`,
  );
  return response.data;
};
// Put estimation on hold
export const putDeliveryEstimationOnHold = async (
  id: string,
  holdUntil: string,
) => {
  const response = await axiosInstance.patch<CreateUpdateResponse>(
    `/delivery-estimations/${id}/hold`,
    { holdUntil },
  );
  return response.data;
};

// Confirm estimation


// Get estimations by status
export const getDeliveryEstimationsByStatus = async (
  status: EstimationStatus,
) => {
  const response = await axiosInstance.get<DeliveryEstimationsResponse>(
    `/delivery-estimations/status/${status}`,
  );
  return response.data.estimations;
};

// Get delivery estimation statistics
export const getDeliveryEstimationStats = async (
) => {
  const response = await axiosInstance.get<StatsResponse>(
    `/delivery-estimations/stats/summary`,
  );
  return response.data.stats;
};

// Admin: expire old estimations
export const expireOldDeliveryEstimations = async (
) => {
  const response = await axiosInstance.post<CreateUpdateResponse>(
    `/delivery-estimations/admin/expire-old`,
  );
  return response.data;
};
