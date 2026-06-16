/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  IProformaInvoice,
  PIStatus
} from '@/models/ProformaInvoice';
import { axiosInstance } from './axiosIntance';

/* =========================
   Generic Params
========================= */
export interface GetProformaInvoiceParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PIStatus;
  customerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/* =========================
   Responses
========================= */
interface ProformaInvoicesResponse {
  success: boolean;
  invoices: IProformaInvoice[];
    count: number;
}

interface ProformaInvoiceResponse {
  success: boolean;
  invoice: IProformaInvoice;
}

/* =========================
   GET ALL (Client-side)
========================= */
export const getAllProformaInvoices = async ({
  page = 1,
  limit = 10,
  search = '',
  status,
  customerId,
  sortBy = 'createdAt',
  sortOrder = 'desc'
}: GetProformaInvoiceParams = {}, ) => {
  try {

    const response = await axiosInstance.get<ProformaInvoicesResponse>(
      `/proforma-invoices`,
      {
        params: {
          page,
          limit,
          search,
          status,
          customerId,
          sortBy,
          sortOrder
        }
      }
    );
    const invoices = response.data.invoices ?? [];

    return {
      proformaInvoices: invoices,
      count:invoices.length,
      success: response.data.success
    };
  } catch (error) {
    console.error('Error fetching proforma invoices:', error);
    return {
      proformaInvoices: [],
      totalCount: 0,
      success: false
    };
  }
};

/* =========================
   GET ALL (SSR)
========================= */
export const getProformaInvoices = async (
  
) => {
  try {
    const response = await axiosInstance.get(`/proforma-invoices`);
    return response.data.invoices as IProformaInvoice[];
  } catch (error) {
    throw error;
  }
};

/* =========================
   GET BY ID
========================= */
export const getProformaInvoiceById = async (
  id: string,
  
) => {
  try {
    const response = await axiosInstance.get<ProformaInvoiceResponse>(
      `/proforma-invoices/${id}`
    );
    return response.data.invoice;
  } catch (error) {
    throw error;
  }
};

export const getProformaInvoiceId = async (
  id: string,
) => {
  try {
    const response = await axiosInstance.get<ProformaInvoiceResponse>(
      `/proforma-invoices/${id}`
    );
    return response.data.invoice;
  } catch (error) {
    throw error;
  }
};

/* =========================
   GET BY PI NUMBER
========================= */
export const getProformaInvoiceByPINumber = async (
  piNumber: string,
  
) => {
  try {
    const response = await axiosInstance.get<ProformaInvoiceResponse>(
      `/proforma-invoices/number/${piNumber}`
    );
    return response.data.invoice;
  } catch (error) {
    throw error;
  }
};

/* =========================
   CREATE
========================= */
export const createProformaInvoice = async (
  data: any,
  
) => {
  try {
    const response = await axiosInstance.post(
      `/proforma-invoices`,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/* =========================
   UPDATE
========================= */
export const updateProformaInvoice = async (
  id: string,
  data: any,
  
) => {
  try {
    
    const response = await axiosInstance.put(
      `/proforma-invoices/${id}`,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/* =========================
   DELETE
========================= */
export const deleteProformaInvoice = async (
  id: string,
  
) => {
  try {
    
    const response = await axiosInstance.delete(
      `/proforma-invoices/${id}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/* =========================
   UPDATE STATUS
========================= */
export const updateProformaInvoiceStatus = async (
  id: string,
  status: PIStatus,
  
) => {
  try {
    
    const response = await axiosInstance.patch(
      `/proforma-invoices/${id}/status`,
      { status }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const updateProformaInvoiceAdditionalQuantity = async (
  id: string,
  materialUpdates: any,
  
) => {
  try {
    

    const response = await axiosInstance.patch(
      `/proforma-invoices/${id}/additional-quantity`,
      { materialUpdates }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};
/* =========================
ADD PAYMENT
========================= */
export const addPaymentToProformaInvoice = async (
  id: string,
  data: {
    amountPaid: number;
    amountDate?: Date | string;
    bankId?: string; // ✅ NEW
    paidBy?:string;
  },
  
) => {
  try {
    

    const response = await axiosInstance.post(
      `/proforma-invoices/${id}/payments`,
      data
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

/* =========================
   DASHBOARD SUMMARY
========================= */
export const getProformaInvoiceSummary = async (
  
) => {
  try {
    const response = await axiosInstance.get(
      `/proforma-invoices/summary/dashboard`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/* =========================
   REPORT GENERATION
========================= */
export const generateProformaInvoiceReport = async (
  params?: {
    fromDate?: string;
    toDate?: string;
    status?: PIStatus;
  },
  
) => {
  try {
    const response = await axiosInstance.get(
      `/proforma-invoices/reports/generate`,
      { params }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/* =========================
   VALIDATE PI NUMBER
========================= */
export const validatePINumber = async (
  piNumber: string,
  
) => {
  try {
    const response = await axiosInstance.get(
      `/proforma-invoices/validate/pi-number`,
      { params: { piNumber } }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
