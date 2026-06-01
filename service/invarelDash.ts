import { axiosInstance } from "./axiosIntance";

// ==================== COUNT CARDS ====================
export const getCountCards = async () => {
  try {
    const response = await axiosInstance.get(`/dashboard/count-cards`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// ==================== PAYMENT BAR CHART ====================
export const getPaymentBarChart = async () => {
  try {
    const response = await axiosInstance.get(`/dashboard/payment-chart`);
    console.log('Payment chart response:', response.data);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// ==================== LOW STOCK ALERT ====================
export const getLowStockAlerts = async () => {
  try {
    const response = await axiosInstance.get(`/dashboard/low-stock`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// ==================== TOP PURCHASE PRODUCTS ====================
export const getTopPurchaseProducts = async (
  limit = 5,
  
) => {
  try {
    const response = await axiosInstance.get(
      `/dashboard/top-purchase?limit=${limit}`
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// ==================== TOP SOLD PRODUCTS ====================
export const getTopSoldProducts = async (
  limit = 5,
  
) => {
  try {
    const response = await axiosInstance.get(
      `/dashboard/top-sold?limit=${limit}`
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// ==================== AGING INVENTORY ====================
export const getAgingInventory = async (
  limit = 10,
  
) => {
  try {
    const response = await axiosInstance.get(
      `/dashboard/aging-inventory?limit=${limit}`
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// ==================== COMPLETE DASHBOARD ====================
export const getCompleteDashboardData = async () => {
  try {
    const response = await axiosInstance.get(`/dashboard`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// ==================== DASHBOARD FILTER ====================
export const getDashboardDataWithFilters = async (
  filters: {
    startDate?: string;
    endDate?: string;
    branchId?: string;
    shopId?: string;
    storeId?: string;
  },
  
) => {
  try {

    const query = new URLSearchParams(
      filters as Record<string, string>
    ).toString();

    const response = await axiosInstance.get(
      `/dashboard/filter?${query}`
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// ==================== MONTHLY SALES TREND ====================
export const getMonthlySalesTrend = async (
  months = 6,
  
) => {
  try {
    const response = await axiosInstance.get(
      `/dashboard/monthly-trend?months=${months}`
    );
    console.log('Monthly sales trend response:', response.data);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};