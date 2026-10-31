/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  IProformaInvoice,
  PIStatus
} from '@/models/ProformaInvoice';
import { axiosInstance } from './axiosIntance';

/* =========================
   Paginated list (Proforma Invoice / My PI pages)
========================= */
export interface ProformaInvoiceListParams {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
  paymentStatus?: string; // SellPaymentStatus or 'all'
  status?: string; // PIStatus or 'all'
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProformaInvoiceListCounts {
  payment: {
    all: number;
    pending: number;
    partial: number;
    paid: number;
    cancelled: number;
    none: number;
  };
  document: {
    all: number;
    pending: number;
    approvedSt: number;
    sentToClient: number;
    revision: number;
    approvedClient: number;
    approvedProject: number;
    cancelled: number;
  };
}

export interface ProformaInvoiceListResponse {
  success: boolean;
  data: IProformaInvoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: ProformaInvoiceListCounts;
}

interface ProformaInvoiceResponse {
  success: boolean;
  invoice: IProformaInvoice;
}

// The API filters, counts and paginates. `mine` limits it to the current
// user's invoices. Errors are thrown so the page can offer a Retry.
export const listProformaInvoices = async (
  params: ProformaInvoiceListParams,
  mine = false
) => {
  const response = await axiosInstance.get<ProformaInvoiceListResponse>(
    mine ? `/proforma-invoices/mypiinvoices` : `/proforma-invoices`,
    { params: { ...params, page: params.page ?? 1 } }
  );
  return response.data;
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
export const addProformaInvoiceAttachments = async (
  invoiceId: string,
  files: File[]
) => {
  try {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('attachments', file);
    });

    const response = await axiosInstance.post(
      `/proforma-invoices/${invoiceId}/attachments`,
      formData
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
export const updateProformaInvoiceseco = async (
  id: string,
  data: any,
  
) => {
  try {
    
    const response = await axiosInstance.put(
      `/proforma-invoices/secondupdate/${id}`,
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
