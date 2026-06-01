/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from "./axiosIntance";

import { ICurtainOrder } from '@/models/curtainType';

// =========================
// Generic Pagination Params
// =========================
export interface GetParams {
  page?: number;
  limit?: number;
}

// =========================
// Response Interfaces
// =========================
interface CurtainOrdersResponse {
  success: boolean;
  count: number;
  curtainOrders: ICurtainOrder[];
}

// =========================
// CURTAIN ORDERS
// =========================

// Get all curtain orders (with pagination)
export const getAllCurtainOrders = async ({
  page = 1,
  limit = 10
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const url = `curtain-orders?${query}`;
    const response = await axiosInstance.get<CurtainOrdersResponse>(url);

    const curtainOrders = response.data.curtainOrders;

    return {
      curtainOrders,
      totalCount: response.data.count ?? curtainOrders.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

// Get all curtain orders (SSR / auth-aware)
export const getCurtainOrders = async () => {
  try {
    
    const response = await axiosInstance.get(`/curtain-orders`);
    return response.data.curtainOrders as ICurtainOrder[];
  } catch (error) {
    throw error;
  }
};

export const getEstimatedCurtainDeliveryTime = async (
  startDate?: string,
  endDate?: string,
  
) => {
  try {
    

    const response = await axiosInstance.get(
      `/curtain-orders/estimated/delivery/date`,
      {
        params: {
          startDate,
          endDate,
        },
      }
    );
        console.log(response.data)

    return response.data as any;
  } catch (error) {
    throw error;
  }
};

// Get all curtain orders (client-side only)
export const getCurtainOrdersApi = async () => {
  try {
    const response = await axiosInstance.get(`/curtain-orders`);
    return response.data.curtainOrders as ICurtainOrder[];
  } catch (error) {
    throw error;
  }
};

// Get curtain order by ID thikthin/shatter
export const getthikthinCurtainOrderById = async (
  id: string,
) => {
  try {
    const response = await axiosInstance.get(`/curtain/orders/thikthin/${id}`);
    return response.data.curtainOrder as any;
  } catch (error) {
    throw error;
  }
};
export const getshatterCurtainOrderById = async (
  id: string,
) => {
  try {
    const response = await axiosInstance.get(`/curtain/orders/shatter/${id}`);
    console.log(response.data)
    return response.data.curtainOrder as ICurtainOrder;
  } catch (error) {
    throw error;
  }
};
export const getCurtainOrderById = async (
  id: string,
) => {
  try {
    const response = await axiosInstance.get(`/curtain-orders/${id}`);
    return response.data.curtainOrder as ICurtainOrder;
  } catch (error) {
    throw error;
  }
};

export const getCurtainOrderId = async (
  id: string,
    

) => {
  try {
    const response = await axiosInstance.get(`/curtain-orders/${id}`);
    return response.data.curtainOrder as ICurtainOrder;
  } catch (error) {
    throw error;
  }
};

// Get curtain orders by customer
export const getCurtainOrdersByCustomer = async (
  customerId: string,
  
) => {
  try {
    const response = await axiosInstance.get(
      `/curtain-orders/customer/${customerId}`
    );
    return response.data.curtainOrders as ICurtainOrder[];
  } catch (error) {
    throw error;
  }
};
export const getPendingCurtainOrders = async () => {
  try {
    const response = await axiosInstance.get('/curtain-orders/pending');
    return response.data.curtainOrders as ICurtainOrder[];
  } catch (error) {
    throw error;
  }
};
// Get my curtain orders (created by logged-in user)
export const getMyCurtainOrders = async () => {
  try {
    
    const response = await axiosInstance.get(
      `/curtain-orders/my/orders`
    );
    return response.data.curtainOrders as ICurtainOrder[];
  } catch (error) {
    throw error;
  }
};

// Search curtain orders
export const searchCurtainOrders = async (
  params: Record<string, string | number | boolean | undefined>,
  
) => {
  try {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        query.append(key, String(value));
      }
    });

    const response = await axiosInstance.get(
      `/curtain-orders/search?${query.toString()}`
    );

    return response.data.curtainOrders as ICurtainOrder[];
  } catch (error) {
    throw error;
  }
};

// Create curtain order
export const createCurtainOrder = async (
  data: any,
  
) => {
  try {
    
    const response = await axiosInstance.post(
      `/curtain-orders`,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update curtain order
export const updateCurtainOrder = async (
  id: string,
  data: any,
  
) => {
  try {
    
    const response = await axiosInstance.put(
      `/curtain-orders/${id}`,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createCurtainMeasurements = async (
  orderId: string,
  measurements: any,
  shopId: string,            // ✅ ADDED
  
) => {
  try {
    

    const response = await axiosInstance.post(
      `/curtain/measurements/order/${orderId}`,
      {
        measurements,
        shopId,               // ✅ SEND shopId
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const bulkUpdateCurtainMeasurements = async (
  orderId: string,
  measurements: Array<{
    measurementId?: string; // Made optional for new measurements
    curtainMeasurementData: any;
  }>,
  shopId?: string,
  
) => {
  try {
    

    const response = await axiosInstance.patch(
      `/curtain/measurements/order/${orderId}/bulk-update`,
      {
        measurements,
        shopId,
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};
export const bulkUpdateShatterVerticalMeasurements = async (
  orderId: string,
  measurements: any,
  shopId: string
) => {
  try {
    const response = await axiosInstance.patch(
      `/curtain/measurements/shatter-vertical/order/${orderId}/bulk-update`,
      {
        measurements,
        shopId,
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};
export const updateCurtainMeasurementsByOrderId = async (
  orderId: string,
  measurements: any,
  shopId: string,            // ✅ ADDED
  
) => {
  try {
    

    const response = await axiosInstance.put(
      `/curtain-measurements/order/${orderId}`,
      {
        measurements,
        shopId,               // ✅ SEND shopId
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};
export const updateCurtainOrderDeliveryDeadline = async (
  orderId: string,
  deliveryDeadline: string,   // ISO date string
  
) => {
  try {
    

    const response = await axiosInstance.put(
      `/curtain-orders/${orderId}/delivery-deadline`,
      {
        deliveryDeadline,
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getWorkerPaymentReport = async (
  startDate: string,
  endDate: string,
  filters?: any,
  
) => {
  try {
    

    const response = await axiosInstance.get(
      `/reports/worker-payments`,
      {
        params: {
          startDate,
          endDate,
        },
        data: {
          filters, // optional filters sent in body
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const markWorkerAsPaid = async (
  measurementId: string,
  workerType: 'THIN' | 'THICK',
  
) => {
  try {
    

    const response = await axiosInstance.put(
      `/curtain-measurements/${measurementId}/mark-paid`,
      {
        workerType,
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createCurtainsecondsMeasurements = async (
  orderId: string,
  measurements: any,
  shopId: string,            // ✅ ADDED
  
) => {
  try {
    

    const response = await axiosInstance.post(
      `/curtain/measurements/seconds/order/${orderId}`,
      {
        measurements,
        shopId,               // ✅ SEND shopId
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
}; 
export interface UpdateCurtainOrderPaymentPayload {
  totalAmount?: number;
  totalPaid: number;
  balance?: number;
  paymentStatus?: 'PENDING' | 'PAID';
}
// Types definition
export interface CurtainRodCutting {
  measurementId: string;
  curtainRodVariantId: string;
  requestedWidth: number;
}

export interface UpdateCurtainOrderStatusPayload {
  curtainStatus: 'PENDING' | 'FINISHED' | 'RETURNED' | 'COMPLETED' | 'CANCELLED' | 'DELIVERED';
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED';
  curtainstatusnote?: string;
  deliveredById?: string;
  curtainRodCuttings?: CurtainRodCutting[];  // Array of curtain rod cuttings
}

export const updateCurtainOrderStatus = async (
  orderId: string,
  statusData: UpdateCurtainOrderStatusPayload,
): Promise<any> => {
  try {
    const response = await axiosInstance.patch(
      `/curtain/orders/${orderId}/status`,
      statusData,
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCurtainOrderPayment = async (
  orderId: string,
  paymentData: UpdateCurtainOrderPaymentPayload,
) => {
  try {
    

    const response = await axiosInstance.patch(
      `/curtain/orders/${orderId}/payment`,
      paymentData,
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};
export const updateCurtainsecondsMeasurementsByOrderId = async (
  orderId: string,
  measurements: any,
  shopId: string,            // ✅ ADDED
  
) => {
  try {
    

    const response = await axiosInstance.put(
      `/curtain-measurements/seconds/order/${orderId}`,
      {
        measurements,
        shopId,               // ✅ SEND shopId
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete curtain order 
export const deleteCurtainOrder = async (
  id: string,
  
) => {
  try {
    
    const response = await axiosInstance.delete(
      `/curtain-orders/${id}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const deletemeasurements = async (
  id: string,
  
) => {
  try {
    
    const response = await axiosInstance.delete(
      `/curtain-measurements/${id}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get curtain orders by creator (Admin)
export const getCurtainOrdersByCreator = async (
  userId: string,
  
) => {
  try {
    
    const response = await axiosInstance.get(
      `/curtain-orders/creator/${userId}`
    );
    return response.data.curtainOrders as ICurtainOrder[];
  } catch (error) {
    throw error;
  }
};

export const getdeliverbyByCreator = async ({
  page = 1,
  limit = 10
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const url = `curtain/orders/delivered/by/me/getall?${query}`;
    const response = await axiosInstance.get(url);
    const curtainOrders = response.data.curtainOrders;

    return {
      curtainOrders,
      totalCount: response.data.count ?? curtainOrders.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};