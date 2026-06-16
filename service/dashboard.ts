import { axiosInstance } from "./axiosIntance";

// ==================== COMPLETE STATIC REPORT ====================
// ==================== COMPLETE STATIC REPORT ====================
export const getCompleteStaticReport = async (
  params?: {
    startDate?: string;
    endDate?: string;
  },
) => {
  try {
    const query = new URLSearchParams();

    if (params?.startDate) {
      query.append("startDate", params.startDate);
    }

    if (params?.endDate) {
      query.append("endDate", params.endDate);
    }


    const response = await axiosInstance.get(
      `/reports/complete-static?${query.toString()}`
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};
export const getDeliveryDateComparisonReport = async () => {
  try {
    const response = await axiosInstance.get(
      `/reports/delivery-date-comparison`,
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};
export const getDetailedFinishedProductsReport = async (
  params?: {
    startDate?: string;
    endDate?: string;
    materialTypes?: string[];
  },
) => {
  try {
    const query = new URLSearchParams();

    if (params?.startDate) {
      query.append('startDate', params.startDate);
    }

    if (params?.endDate) {
      query.append('endDate', params.endDate);
    }

    if (params?.materialTypes?.length) {
      query.append(
        'materialTypes',
        params.materialTypes.join(',')
      );
    }


    const response = await axiosInstance.get(
      `/reports/detailed-finished-products?${query.toString()}`
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};
// ==================== COMBINED REPORT ====================
export const getCombinedReport = async (
  options?: {
    lowStockThreshold?: number | null; // null means use per-material thresholds
    topItemsLimit?: number;
    startDate?: string;
    endDate?: string;
  },  ) => {
  try {
    const query = new URLSearchParams();

    // Handle lowStockThreshold - only add if defined (null means use per-material thresholds)
    if (options?.lowStockThreshold !== undefined && options?.lowStockThreshold !== null) {
      query.append(
        "lowStockThreshold",
        options.lowStockThreshold.toString()
      );
    }

    if (options?.topItemsLimit) {
      query.append(
        "topItemsLimit",
        options.topItemsLimit.toString()
      );
    }

    if (options?.startDate) {
      query.append("startDate", options.startDate);
    }

    if (options?.endDate) {
      query.append("endDate", options.endDate);
    }
    

    const response = await axiosInstance.get(
      `/reports/combined?${query.toString()}`
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// ==================== COUNT CARDS ====================
export const getDashboardCounts  = async (  
) => {
  try {
    const response = await axiosInstance.get(
      `/reports/count-cards`
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};
export const getMonthlyBreakdown = async (
  year?: number,
) => {
  try {

    const response = await axiosInstance.get(
      `/reports/monthly-breakdown${year ? `?year=${year}` : ''}`
    );

    return response.data.data;
  } catch (error) {
    throw error;
  }
};