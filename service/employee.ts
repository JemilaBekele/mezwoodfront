/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-unresolved */

import { IEmployee } from '@/models/employee';
import { axiosInstance } from "./axiosIntance";

export interface GetParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

interface EmployeeResponse {
  success: boolean;
  count: number;
  users: IEmployee[];
}

export const getAllEmployees = async ({
  page = 1,
  limit = 10,
  startDate,
  endDate
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    // Add date filters to query if they exist
    if (startDate) {
      query.append('startDate', startDate);
    }
    if (endDate) {
      query.append('endDate', endDate);
    }

    const url = `users?${query}`;

    const response = await axiosInstance.get<EmployeeResponse>(url);
    const employees = response.data.users;

    return {
      employees: employees,
      totalCount: response.data.count ?? employees.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

export const getAllEmploy = async () => {
  try {
    const response = await axiosInstance.get(`/users`);
    return response.data.users;
  } catch (error) {
    throw error;
  }
};
export const getUserProfile = async () => {
  try {
    const response = await axiosInstance.get(`/user/profile/view`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
  
) => {
  try {
    const response = await axiosInstance.put(
      `/user/${userId}/change-password`,
      {
        currentPassword,
        newPassword
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const resetUserPassword = async (
  userId: string,
  newPassword: string,
  
) => {
  try {
    const response = await axiosInstance.put(`/user/reset-password/${userId}`, {
      newPassword
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAlldep = async () => {
  try {
    const response = await axiosInstance.get(`/user/assignd/employee`);
    return response.data.users;
  } catch (error) {
    throw error;
  }
};
export const fetchUserInvoices = async () => {
  try {
    const response = await axiosInstance.get('/invoices/fetch/userinvoice');
    return response.data.invoices;
  } catch (error) {
    throw error;
  }
};
export const getAllTen = async () => {
  try {
    const response = await axiosInstance.get(`/user/roletentant`);
    return response.data.users;
  } catch (error) {
    throw error;
  }
};
export const getAllTentant = async ({
  page = 1,
  limit = 10,
  startDate,
  endDate
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    // Add date filters to query if they exist
    if (startDate) {
      query.append('startDate', startDate);
    }
    if (endDate) {
      query.append('endDate', endDate);
    }

    const url = `/user/roletentant?${query}`;

    const response = await axiosInstance.get<EmployeeResponse>(url);
    const employees = response.data.users;

    return {
      employees: employees,
      totalCount: response.data.count ?? employees.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

export const getAllnotconfirm = async (page = 1, limit = 10) => {
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  try {
    const response = await axiosInstance.get(`/user/confirmfalse?${query}`);

    // Extract bicycles from response
    const { users = [] } = response.data || {};

    return {
      data: users as IEmployee[],
      totalCount: users.length
    };
  } catch (error) {
    throw error;
  }
};

export const getEmployeeById = async (id: string | number) => {
  try {
    // Send `id` as a query parameter
    const response = await axiosInstance.get(`/users/${id}`);
    return response.data.user;
  } catch (error) {
    throw error;
  }
};

export const getEmployeeId = async (
  id: string | number,
  
) => {
  try {
    const response = await axiosInstance.get(`/user/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createEmployee = async (
  employeeData: any,
  
) => {
  try {
    const response = await axiosInstance.post('/register', employeeData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateEmployee = async (
  id: string,
  formData: any,
  
) => {
  try {
    const response = await axiosInstance.put(`/users/${id}`, formData);
    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (
  id: string | number,
  
) => {
  if (!id) {
    throw new Error('Service ID is required');
  }
  try {
    const response = await axiosInstance.delete(`/users/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};
