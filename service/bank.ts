/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from 'http';

import { IBank } from '@/models/bank';
import { axiosInstance } from './axiosIntance';


interface BankResponse {
  success: boolean;
  bank: IBank;
}

interface BanksResponse {
  success: boolean;
  banks: IBank[];
  count: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CreateUpdateBankResponse {
  success: boolean;
  data?: IBank;
  bank?: IBank;
  message?: string;
}

interface DeleteBankResponse {
  success: boolean;
  message: string;
}

interface ValidationResponse {
  success: boolean;
  exists: boolean;
  message: string;
}

// ========================= BANKS ========================= //

// Get all banks (client-side with pagination)
export const getAllBanks = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const response = await axiosInstance.get<BanksResponse>(`/banks`, {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        search: params?.search || '',
        sortBy: params?.sortBy || 'createdAt',
        sortOrder: params?.sortOrder || 'desc'
      }
    });

    // Handle cases where response.data is null or missing fields
    const banks = response?.data?.banks ?? [];
    const pagination = response?.data?.pagination;

    return {
      banks,
      totalCount: pagination?.total ?? banks.length,
      success: response?.data?.success ?? false
    };
  } catch (error) {
    console.error('Error fetching banks:', error);

    // Return empty array instead of throwing error
    return {
      banks: [] as IBank[],
      totalCount: 0,
      success: false
    };
  }
};

// Get all banks (server-side / with auth)
export const getBanks = async (req?: IncomingMessage) => {
  try {
    const response = await axiosInstance.get<BanksResponse>(`/banks`);
    return response.data.banks;
  } catch (error) {
    throw error;
  }
};

// Get bank by ID
export const getBankById = async (
  id: string,
) => {
  try {
    const response = await axiosInstance.get<BankResponse>(
      `/banks/${id}`
    );
    return response.data.bank;
  } catch (error) {
    throw error;
  }
};

// Search banks by name
export const searchBanksByName = async (
  name: string,
  limit: number = 10,
) => {
  try {
    const response = await axiosInstance.get<BanksResponse>(
      `/banks/search/name`,
      {
        params: { name, limit }
      }
    );
    return response.data.banks;
  } catch (error) {
    throw error;
  }
};

// Create bank
export const createBank = async (
  data: Pick<IBank, 'bankName' | 'accountNumber'>,
) => {
  try {
    const response = await axiosInstance.post<CreateUpdateBankResponse>(
      `/banks`,
      data
    );
    return response.data;
  } catch (error: any) {
    // Handle specific error cases
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// Update bank
export const updateBank = async (
  id: string,
  data: Partial<Pick<IBank, 'bankName' | 'accountNumber'>>,
) => {
  try {
    const response = await axiosInstance.put<CreateUpdateBankResponse>(
      `/banks/${id}`,
      data
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// Delete bank
export const deleteBank = async (
  id: string,
) => {
  try {
    const response = await axiosInstance.delete<DeleteBankResponse>(
      `/banks/${id}`
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// Get bank by account number
export const getBankByAccountNumber = async (
  accountNumber: string,
) => {
  try {
    const response = await axiosInstance.get<BankResponse>(
      `/banks/account/${accountNumber}`
    );
    return response.data.bank;
  } catch (error) {
    throw error;
  }
};



// Validate bank account number
export const validateBankAccount = async (
  accountNumber: string,
) => {
  try {
    const response = await axiosInstance.get<ValidationResponse>(
      `/banks/validate/account`,
      {
        params: { accountNumber }
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Quick validation for form (client-side only)
export const validateBankAccountQuick = async (
  accountNumber: string
): Promise<{ valid: boolean; message: string }> => {
  // Basic client-side validation
  if (!accountNumber || accountNumber.trim().length < 5) {
    return {
      valid: false,
      message: 'Account number must be at least 5 characters long'
    };
  }

  // Check for only numbers (if account number should be numeric)
  if (!/^\d+$/.test(accountNumber)) {
    return {
      valid: false,
      message: 'Account number should contain only numbers'
    };
  }

  return {
    valid: true,
    message: 'Account number format is valid'
  };
};