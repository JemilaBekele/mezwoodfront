/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from 'http';
import { axiosInstance } from './axiosIntance';


// ========================= TYPES ========================= //

export interface ISell {
  id: string;
  invoiceNo: string;
  grandTotal: number;
  paymentStatus: string;
  saleStatus: string;
  createdAt: string;
  customer?: any;
  items?: any[];
}

interface SellResponse {
  success: boolean;
  sell: ISell;
}

interface SellsResponse {
  success: boolean;
  count: number;
  sells: ISell[];
}

interface CreateUpdateSellResponse {
  success: boolean;
  sell: ISell;
  message: string;
}

interface DeleteSellResponse {
  success: boolean;
  message: string;
}

// ========================= SELLS ========================= //

// Create Sell
export const createSell = async (
  data: any,
  
) => {
  try {
    const response = await axiosInstance.post<CreateUpdateSellResponse>(
      `/sells`,
      data,
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// Get all sells (client side)
export const getAllSells = async (params?: {
  startDate?: string;
  endDate?: string;
  saleStatus?: string;
  customerId?: string;
  page?: number;
  limit?: number;
},  
) => {
  try {
        

    const response = await axiosInstance.get<any>(`/sells`, {
      params,
    });

    return {
      data: response.data.sells,
      totalCount: response.data.count ?? response.data.sells.length,
      success: response.data.success,
    };
  } catch (error) {
    console.error('Error fetching sells:', error);
    return {
      sells: [],
      totalCount: 0,
      success: false,
    };
  }
};
export const getAllSellsstore = async (params?: {
  startDate?: string;
  endDate?: string;
  saleStatus?: string;
  customerId?: string;
  page?: number;
  limit?: number;
},  
) => {
  try {
        

    const response = await axiosInstance.get<any>(`/sells/not-approved/store`, {
      params,
    });

    return {
      data: response.data.sells,
      totalCount: response.data.count ?? response.data.sells.length,
      success: response.data.success,
    };
  } catch (error) {
    console.error('Error fetching sells:', error);
    return {
      sells: [],
      totalCount: 0,
      success: false,
    };
  }
};

// Get all sells (server-side)
export const getSells = async () => {
  try {
    
    const response = await axiosInstance.get<SellsResponse>(`/sells`);
    return response.data.sells;
  } catch (error) {
    throw error;
  }
};
export const deliverSaleItems = async (
  saleId: string,
  deliveryItems: {
    sellItemId: string;
    quantityDelivered: number;
  }[],
  
) => {
  try {
    

    const response = await axiosInstance.post(
      `/sells/${saleId}/deliver`,
      { deliveryItems }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};
// ✅ USER BASED SELLS
export const getUserSells = async (params?: {
  startDate?: string;
  endDate?: string;
  saleStatus?: string;
  customerId?: string;
},) => {
  try {
        

    const response = await axiosInstance.get<any>(
      `/sells/user/based`,
      { params },
    );

     return {
      data: response.data.sells,
      totalCount: response.data.count ?? response.data.sells.length,
      success: response.data.success,
    };
  } catch (error) {
    console.error('Error fetching user sells:', error);
    return {
      sells: [],
      success: false,
    };
  }
};

// Get sell by ID
export const getSellById = async (
  id: string,
  
) => {
  try {
    
    const response = await axiosInstance.get<any>(
      `/sells/${id}`,
    );
    return response.data.sell;
  } catch (error) {
    throw error;
  }
};

// Get sell by invoice number
export const getSellByInvoiceNo = async (
  invoiceNo: string,
  
) => {
  try {
    
    const response = await axiosInstance.get<SellResponse>(
      `/sells/invoice/${invoiceNo}`,
    );
    return response.data.sell;
  } catch (error) {
    throw error;
  }
};

// Update sell
export const updateSell = async (
  id: string,
  data: any,
  
) => {
  try {
    
    const response = await axiosInstance.put<CreateUpdateSellResponse>(
      `/sells/${id}`,
      data,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete sell
export const deleteSell = async (
  id: string,
  
) => {
  try {
    
    const response = await axiosInstance.delete<DeleteSellResponse>(
      `/sells/${id}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ========================= PAYMENTS ========================= //

// Add payment
export const addSellPayment = async (
  sellId: string,
  data: { 
    amount: number;
    bankId: string;
    paidBy: string;
  },
  
) => {
  try {
    
    const response = await axiosInstance.post(
      `/sells/${sellId}/payments`,
      data,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get payment history
export const getSellPaymentHistory = async (
  sellId: string,
  
) => {
  try {
    
    const response = await axiosInstance.get(
      `/sells/${sellId}/payments`,
    );

    return response.data.data.sell
;
  } catch (error) {
    throw error;
  }
};

// ========================= STATUS ========================= //

// Update sale status
export const updateSaleStatus = async (
  id: string,
  newStatus: string,
  
) => {
  try {
    
    const response = await axiosInstance.patch(
      `/sells/${id}/status`,
      { newStatus },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Cancel sale
export const cancelSale = async (
  id: string,
  
) => {
  try {
    
    const response = await axiosInstance.patch(
      `/sells/${id}/cancel`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Unlock sell
export const unlockSell = async (
  id: string,
  
) => {
  try {
    
    const response = await axiosInstance.patch(
      `/sells/${id}/unlock`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ========================= STATISTICS ========================= //

export const getSellStatistics = async (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  try {
    const response = await axiosInstance.get(`/sells/statistics`, {
      params,
    });
    return response.data.statistics;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return null;
  }
};

export const uploadSellFiles = async (
  id: string,
  data: FormData,
  
) => {
  try {
    

    const response = await axiosInstance.put(
      `/sell/${id}/upload/file`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};