/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from "./axiosIntance";


export interface WorkerPaymentFilters {
  paymentStatus?: string;
  workerId?: string;
  shopId?: string;
  movementTypeId?: string;
  includePaid?: boolean;
  includeUnpaid?: boolean;
  workerType?: 'THIN' | 'THICK' | 'ALL';
}

export interface WorkerPaymentSummary {
  workerId: string;
  workerName: string;
  workerPhone?: string;
  workerRole?: string;
  totalJobs: number;
  totalMeters: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  jobs: WorkerJob[];
}

export interface WorkerJob {
  measurementId: string;
  orderId: string;
  orderDate: string;
  roomName: string;
  meter: number;
  amount: number;
  paid: boolean;
  paidDate?: string;
  productName?: string;
  productCode?: string;
}

export interface MeasurementWorkerData {
  measurementId: string;
  orderId: string;
  orderDate: string;
  roomName: string;
  totalWorkerMeter: number;
  workerPrice: number;
  shopName: string;
  movementType: string;
  workerType: 'THIN' | 'THICK';
  workerId: string;
  workerName: string;
  workerPhone?: string;
  workerRole?: string;
  isPaid: boolean;
  paidDate?: string;
  productName?: string;
  productCode?: string;
}

export interface WorkerPaymentReport {
  summary: {
    totalOrders: number;
    totalMeasurements: number;
    totalThinWorkerAmount: number;
    totalThickWorkerAmount: number;
    totalWorkerAmount: number;
    paidThinWorkers: number;
    unpaidThinWorkers: number;
    paidThickWorkers: number;
    unpaidThickWorkers: number;
    totalPaidAmount: number;
    totalUnpaidAmount: number;
    totalWorkerJobs: number;
    totalWorkerMeters: number;
    totalUniqueWorkers: number;
  };
  workers: {
    thin: WorkerPaymentSummary[];
    thick: WorkerPaymentSummary[];
  };
  measurements: MeasurementWorkerData[];
  dateRange: {
    start: string;
    end: string;
  };
  generatedAt: string;
  generatedBy: string;
}

export interface MarkPaidResponse {
  id: string;
  thinWorker?: { id: string; name: string };
  thickWorker?: { id: string; name: string };
  thinWorkerPaid?: boolean;
  thinWorkerPaidDate?: string;
  thickWorkerPaid?: boolean;
  thickWorkerPaidDate?: string;
  order: {
    id: string;
  };
}

export const WorkerPaymentApi = {
  getWorkerPaymentReport: async (
    startDate: string,
    endDate: string,
    filters?: WorkerPaymentFilters,
    
  ): Promise<WorkerPaymentReport> => {
    try {

      // Send filters as query parameters
      const response = await axiosInstance.get('/reports/worker-payments', {
        params: {
          startDate,
          endDate,
          ...filters,
        },
      });
      
      console.log('Worker Payment Report Response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching worker payment report:', error);
      throw error;
    }
  },

  markWorkerAsPaid: async (
    measurementId: string,
    workerType: 'THIN' | 'THICK',
    
  ): Promise<MarkPaidResponse> => {
    try {

      const response = await axiosInstance.put(
        `/curtain-measurements/${measurementId}/mark-paid`,
        {
          workerType,
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error marking worker as paid:', error);
      throw error;
    }
  },
};