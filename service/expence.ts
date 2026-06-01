/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from "./axiosIntance";

import { GetParams } from './roleService';
import { IExpense } from '@/models/Expense';

/* =========================
   TYPES
========================= */

interface ExpensesResponse {
  success: boolean;
  count: number;
  expenses: IExpense[];
}

interface ExpenseStatisticsResponse {
  success: boolean;
  statistics: any;
}

interface ExpenseSummaryByMonthResponse {
  success: boolean;
  summary: any[];
}

/* =========================
   GET ALL EXPENSES
========================= */

export const getAllExpenses = async ({
  page = 1,
  limit = 10,
  search = '',
}: GetParams & { search?: string } = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) {
      query.append('search', search);
    }

    const url = `expenses?${query}`;

    const response = await axiosInstance.get<ExpensesResponse>(url);

    const expenses = response.data.expenses;

    return {
      expenses,
      totalCount: response.data.count ?? expenses.length,
      success: response.data.success,
    };
  } catch (error) {
    throw error;
  }
};

/* =========================
   GET EXPENSES
========================= */

export const getExpenses = async () => {
  try {
    const response = await axiosInstance.get('/expenses');

    return response.data.expenses as IExpense[];
  } catch (error) {
    throw error;
  }
};

// InvoiceReport service
export const getInvoiceReport = async (
  params: { startDate: string; endDate: string },
  
) => {
  try {

    const response = await axiosInstance.get('/reports/invoice', {
      params,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

/* =========================
   GET EXPENSE BY ID
========================= */

export const getExpenseById = async (
  id: string,
  
) => {
  try {
    const response = await axiosInstance.get(`/expenses/${id}`);

    return response.data.expense as IExpense;
  } catch (error) {
    throw error;
  }
};

/* =========================
   CREATE EXPENSE
========================= */

export const createExpense = async (
  data: Partial<IExpense>,
  
) => {
  try {

    const response = await axiosInstance.post('/expenses', data);

    return response.data;
  } catch (error) {
    throw error;
  }
};

/* =========================
   CREATE BULK EXPENSES
========================= */

export const createBulkExpenses = async (
  data: Partial<IExpense>[],
  
) => {
  try {

    const response = await axiosInstance.post(
      '/expenses/bulk',
      data
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

/* =========================
   UPDATE EXPENSE
========================= */

export const updateExpense = async (
  id: string,
  data: Partial<IExpense>,
  
) => {
  try {

    const response = await axiosInstance.patch(
      `/expenses/${id}`,
      data
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

/* =========================
   DELETE EXPENSE
========================= */

export const deleteExpense = async (
  id: string,
  
) => {
  try {

    const response = await axiosInstance.delete(
      `/expenses/${id}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

/* =========================
   DELETE BULK EXPENSES
========================= */

export const deleteBulkExpenses = async (
  ids: string[],
  
) => {
  try {

    const response = await axiosInstance.delete(
      `/expenses/bulk/delete`,
      {
        data: { ids },
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

/* =========================
   GET EXPENSES BY DATE RANGE
========================= */

export const getExpensesByDateRange = async (
  startDate: string,
  endDate: string,
  
) => {
  try {

    const response = await axiosInstance.get(
      `/expenses/by-date-range`,
      {
        params: {
          startDate,
          endDate,
        },
      }
    );

    return response.data.expenses as IExpense[];
  } catch (error) {
    throw error;
  }
};

/* =========================
   GET EXPENSE SUMMARY BY MONTH
========================= */

export const getExpenseSummaryByMonth = async (
  year?: number,
  
) => {
  try {

    const response =
      await axiosInstance.get<ExpenseSummaryByMonthResponse>(
        `/expenses/summary-by-month`,
        {
          params: {
            year,
          },
        }
      );

    return response.data.summary;
  } catch (error) {
    throw error;
  }
};

/* =========================
   GET EXPENSE STATISTICS
========================= */

export const getExpenseStatistics = async (
  
) => {
  try {

    const response =
      await axiosInstance.get<ExpenseStatisticsResponse>(
        `/expenses/statistics`
      );

    return response.data.statistics;
  } catch (error) {
    throw error;
  }
};