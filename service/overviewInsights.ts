import { axiosInstance } from "./axiosIntance";

export interface IOverviewInsights {
  generatedAt: string;
  delivery: {
    overdue: number;
    dueThisWeek: number;
    later: number;
    noDate: number;
    openProjects: number;
  };
  pipeline: { stage: string; count: number }[];
  mostOverdue: {
    projectId: string;
    piNumber: string;
    customerName: string;
    customerPhone: string | null;
    stage: string;
    dueDate: string;
    daysLate: number;
  }[];
  collections: {
    invoiceCount: number;
    totalValue: number;
    totalPaid: number;
    outstanding: number;
  };
  topDebtors: {
    customerId: string;
    customerName: string;
    customerPhone: string | null;
    invoiceCount: number;
    balance: number;
  }[];
}

export const getOverviewInsights = async (): Promise<IOverviewInsights> => {
  const response = await axiosInstance.get(`/reports/overview-insights`);
  return response.data.data;
};
