import { IncomingMessage } from "http";
import { axiosInstance } from "./axiosIntance";

import { ICurtainWorkerLog } from "@/models/CurtainWorkerLog";

export interface GetParams {
  page?: number;
  limit?: number;
}



//
// Create CurtainWorkerLog
//
export const createCurtainWorkerLog = async (
  data: Partial<ICurtainWorkerLog>,
  req?: IncomingMessage
) => {
  try {
    
    const response = await axiosInstance.post(
      `/curtain-worker-logs`,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const bulkApproveCurtainWorkerLogs = async (
  logIds: string[],
  req?: IncomingMessage
) => {
  try {
    

    const response = await axiosInstance.post(
      `/curtain-worker-logs/bulk-approve`,
      { logIds }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};
export const rejectCurtainWorkerLog = async (
  logId: string,
  rejectionReason?: string,
  req?: IncomingMessage
) => {
  try {
    

    const response = await axiosInstance.post(
      `/curtain-worker-logs/${logId}/reject`,
      { rejectionReason }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

//
// Update CurtainWorkerLog
//
export const updateCurtainWorkerLog = async (
  id: string,
  data: Partial<ICurtainWorkerLog>,
  req?: IncomingMessage
) => {
  try {
    

    const response = await axiosInstance.put(
      `/curtain-worker-logs/${id}`,
      data
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

//
// Get Worker Logs by Worker (Employee)
//
export const getCurtainWorkerLogsByEmployee = async (
  workerId: string,
  req?: IncomingMessage
) => {
  try {

    const response = await axiosInstance.get(
      `/curtain-worker-logs/employee/${workerId}`
    );

    return {
      logs: response.data.curtainWorkerLogs as ICurtainWorkerLog[],
      totalCount: response.data.count,
      success: response.data.success,
    };
  } catch (error) {
    throw error;
  }
};

//
// Get Worker Logs by Curtain Measurement
//
export const getCurtainWorkerLogsByMeasurement = async (
  curtainMeasurementId: string,
  req?: IncomingMessage
) => {
  try {

    const response = await axiosInstance.get(
      `/curtain-worker-logs/measurement/${curtainMeasurementId}`
    );

    return {
      logs: response.data.curtainWorkerLogs as ICurtainWorkerLog[],
      totalCount: response.data.count,
      success: response.data.success,
    };
  } catch (error) {
    throw error;
  }
};

//
// Get Single Worker Log
//
export const getCurtainWorkerLogById = async (
  id: string,
  req?: IncomingMessage
) => {
  try {

    const response = await axiosInstance.get(
      `/curtain-worker-logs/${id}`
    );

    return response.data.curtainWorkerLog as ICurtainWorkerLog;
  } catch (error) {
    throw error;
  }
};

//
// Delete Worker Log
//
export const deleteCurtainWorkerLog = async (
  id: string,
  req?: IncomingMessage
) => {
  try {
    

    const response = await axiosInstance.delete(
      `/curtain-worker-logs/${id}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};