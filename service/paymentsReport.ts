import { axiosInstance } from "./axiosIntance";

export interface IPaymentRow {
  id: string;
  type: "PROFORMA" | "SALE";
  date: string;
  documentId: string | null;
  invoiceNo: string;
  customer: { id: string; name: string; phone1?: string | null } | null;
  bank: { id: string; bankName: string; accountNumber: string } | null;
  amount: number;
  paidBy: string | null;
  receivedBy: string | null;
  invoiceTotal: number;
  invoiceBalance: number;
}

export interface IPaymentsReport {
  period: { startDate: string | null; endDate: string | null };
  summary: {
    totalReceived: number;
    proformaTotal: number;
    saleTotal: number;
    paymentCount: number;
    proformaCount: number;
    saleCount: number;
    customerCount: number;
  };
  byBank: {
    bankId: string | null;
    bankName: string;
    accountNumber: string | null;
    proformaAmount: number;
    saleAmount: number;
    total: number;
    count: number;
  }[];
  payments: IPaymentRow[];
}

export interface IPaymentsReportFilters {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  bankId?: string;
  type?: "all" | "proforma" | "sale";
}

export const getPaymentsReport = async (
  filters: IPaymentsReportFilters = {}
): Promise<IPaymentsReport> => {
  const params: Record<string, string> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") params[key] = value;
  });
  const response = await axiosInstance.get(`/reports/payments`, { params });
  return response.data.data;
};

// ==================== EDIT / DELETE PAYMENTS ====================
// The backend re-computes the invoice's amountPaid, balance and paymentStatus.

export interface IPaymentUpdate {
  amount?: number;
  bankId?: string;
  paidBy?: string;
  date?: string; // yyyy-mm-dd
}

export const updateProformaPayment = async (paymentId: string, updates: IPaymentUpdate) => {
  const response = await axiosInstance.patch(`/reports/payments/proforma/${paymentId}`, updates);
  return response.data.data;
};

export const deleteProformaPayment = async (paymentId: string) => {
  const response = await axiosInstance.delete(`/reports/payments/proforma/${paymentId}`);
  return response.data.data;
};

export const updateSellPayment = async (paymentId: string, updates: IPaymentUpdate) => {
  const response = await axiosInstance.patch(`/reports/payments/sale/${paymentId}`, updates);
  return response.data.data;
};

export const deleteSellPayment = async (paymentId: string) => {
  const response = await axiosInstance.delete(`/reports/payments/sale/${paymentId}`);
  return response.data.data;
};
