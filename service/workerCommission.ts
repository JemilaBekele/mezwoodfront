/* eslint-disable @typescript-eslint/no-explicit-any */

import { axiosInstance } from "./axiosIntance";

export interface MarkPaidPayload {
  workerId: string;
  workerType: string;
  measurementId: string; 
  amount : number; // IDs of the measurements/orders to mark as paid
}

// ===================== CALCULATE COMMISSION ===================== //

export const calculateWorkerCommission = async (
  data: any,
  
) => {
  try {
    const response = await axiosInstance.post(
      `/worker-commissions/calculate`,
      data
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

// ===================== UNPAID REPORT ===================== //

export const getUnpaidWorkerCommissionsReport = async (
  params?: any,
  
) => {
  try {

    const query = new URLSearchParams();

    if (params?.workerType) query.append("workerType", params.workerType);
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);
    if (params?.workerPercent) query.append("workerPercent", params.workerPercent);

    const response = await axiosInstance.get(
      `/worker-commissions/unpaid-report?${query.toString()}`
    );
console.log("report",response.data)
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ===================== UNPAID SUMMARY ===================== //

export const getUnpaidCommissionsSummary = async (
  
) => {
  try {

    const response = await axiosInstance.get(
      `/worker-commissions/unpaid-summary`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

// ===================== UNPAID WORKERS ===================== //

export const getAllWorkersWithUnpaidCommissions = async (
  
) => {
  try {

    const response = await axiosInstance.get(
      `/worker-commissions/unpaid-workers`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

// ===================== MARK WORKER AS PAID ===================== //

export const markWorkerCommissionAsPaid = async (
  data: MarkPaidPayload,
  
) => {
  try {

    const response = await axiosInstance.post(
      `/worker-commissions/mark-paid`,
      data
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

// ===================== WORKER DETAIL REPORT ===================== //

export const getWorkerDetailedReport = async (
  params: any,
  
) => {
  try {

    const query = new URLSearchParams();

    if (params?.workerId) query.append("workerId", params.workerId);
    if (params?.workerType) query.append("workerType", params.workerType);
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);

    const response = await axiosInstance.get(
      `/worker-commissions/worker-detail?${query.toString()}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};




// Top Selling Products
export const getTopSellingProducts = async (
  params: { startDate: string; endDate: string },
  
) => {
  try {

    const response = await axiosInstance.get('/reports/top-products', {
      params,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Top Tailors By Meters
export const getTopTailors = async (
  params: { startDate: string; endDate: string },
  
) => {
  try {

    const response = await axiosInstance.get('/reports/top-tailors', {
      params,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Worker Performance
export const getWorkerPerformance = async (
  params: { startDate: string; endDate: string },
  
) => {
  try {

    const response = await axiosInstance.get('/reports/worker-performance', {
      params,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Top Performers Dashboard
export const getTopPerformersDashboard = async (
  params: { startDate: string; endDate: string },
  
) => {
  try {

    const response = await axiosInstance.get('/reports/top-performers-dashboard', {
      params,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};