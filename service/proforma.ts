/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from "./axiosIntance";
import { GetParams } from "./roleService";
import { IProforma } from "@/models/proforma";

// Types
interface ProformasResponse {
  success: boolean;
  count: number;
  proformas: IProforma[];
}

// Get all proformas with pagination & filters
export const getAllProformas = async (
  params: GetParams & {
    startDate?: string;
    endDate?: string;
    status?: string;
  } = {},
) => {
  try {
    const { page = 1, limit = 10, ...filters } = params;

    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, value.toString());
      }
    });

    const url = `/proformas?${query}`;
    const response = await axiosInstance.get<ProformasResponse>(url);

    const proformas = response.data.proformas;

    return {
      proformas,
      totalCount: response.data.count ?? proformas.length,
      success: response.data.success,
    };
  } catch (error) {
    throw error;
  }
};

// Simple get all
export const getProformas = async () => {
  try {
    const response = await axiosInstance.get(`/proformas`);
    return response.data.proformas as IProforma[];
  } catch (error) {
    throw error;
  }
};

// Get by ID
export const getProformaById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/proformas/${id}`);
    return response.data.proforma as IProforma;
  } catch (error) {
    throw error;
  }
};

// Get by proforma number
export const getProformaByNumber = async (proformaNo: string) => {
  try {
    const response = await axiosInstance.get(
      `/proformas/number/${proformaNo}`
    );
    return response.data.proforma as IProforma;
  } catch (error) {
    throw error;
  }
};

// Create
export const createProforma = async (data: any) => {
  try {
    const response = await axiosInstance.post(`/proformas`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update
export const updateProforma = async (id: string, data: any) => {
  try {
    const response = await axiosInstance.put(`/proformas/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Approve
export const approveProforma = async (id: string) => {
  try {
    const response = await axiosInstance.put(
      `/proformas/approve/${id}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Reject
export const rejectProforma = async (id: string) => {
  try {
    const response = await axiosInstance.put(
      `/proformas/reject/${id}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Convert to Sale
export const convertProformaToSale = async (id: string) => {
  try {
    const response = await axiosInstance.post(
      `/proformas/${id}/convert-to-sale`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Upload files
export const uploadProformaFiles = async (
  id: string,
  data: FormData,
) => {
  try {
    const response = await axiosInstance.put(
      `/proformas/${id}/upload/file`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete
export const deleteProforma = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/proformas/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update expired (cron/admin)
export const updateExpiredProformas = async () => {
  try {
    const response = await axiosInstance.post(
      `/proformas/update-expired`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Stats
export const getProformaStats = async () => {
  try {
    const response = await axiosInstance.get(
      `/proformas/stats/overview`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};