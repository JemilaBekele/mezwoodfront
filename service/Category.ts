import { axiosInstance } from "./axiosIntance";
import { ICategory, IColour } from '@/models/Category';

// Generic Pagination Params
export interface GetParams {
  page?: number;
  limit?: number;
}

// ========================= CATEGORIES ========================= //

// Get all categories
interface CategoriesResponse {
  success: boolean;
  count: number;
  categories: ICategory[];
}

export const getAllCategories = async ({
  page = 1,
  limit = 10
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const url = `categories?${query}`;
    const response = await axiosInstance.get<CategoriesResponse>(url);
    const categories = response.data.categories;
    return {
      categories,
      totalCount: response.data.count ?? categories.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};

export const getCategories = async () => {
  try {
    
    const response = await axiosInstance.get(`/categories`);
    return response.data.categories as ICategory[];
  } catch (error) {
    throw error;
  }
};
export const getCategoriesapi = async () => {
  try {
    const response = await axiosInstance.get(`/categories`);
    return response.data.categories as ICategory[];
  } catch (error) {
    throw error;
  }
};

export const getCategoryById = async (id: string, ) => {
  try {
    const response = await axiosInstance.get(`/categories/${id}`);
    return response.data.category as ICategory;
  } catch (error) {
    throw error;
  }
};

export const createCategory = async (
  data: Partial<ICategory>,
  
) => {
  try {
    
    const response = await axiosInstance.post(`/categories`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCategory = async (
  id: string,
  data: Partial<ICategory>,
  
) => {
  try {
    
    const response = await axiosInstance.put(`/categories/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteCategory = async (id: string, ) => {
  try {
    
    const response = await axiosInstance.delete(`/categories/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};






// Generic Pagination Params
export interface GetParams {
  page?: number;
  limit?: number;
  name?: string;
}

// ========================= COLOURS ========================= //

interface ColoursResponse {
  success: boolean;
  count: number;
  colours: IColour[];
  total?: number;
  page?: number;
  totalPages?: number;
  limit?: number;
}

// Get all colours (client-side)
export const getAllColours = async ({
  page = 1,
  limit = 10,
  name
}: GetParams = {}) => {
  try {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (name) query.append('name', name);

    const url = `colours?${query.toString()}`;
    const response = await axiosInstance.get<ColoursResponse>(url);

    const colours = response.data.colours;

    return {
      colours,
      totalCount: response.data.total ?? colours.length,
      success: response.data.success
    };
  } catch (error) {
    throw error;
  }
};


export const getColours = async () => {
  try {

    // Add default pagination to prevent backend errors
    const query = new URLSearchParams({
      page: '1',
      limit: '1000', // or any max number you expect
    });

    const response = await axiosInstance.get(`/colours?${query.toString()}`);
    return response.data.colours as IColour[];
  } catch (error) {
    console.error('Error fetching colours:', error);
    throw error;
  }
};
export const getColoursApi = async () => {
  try {
    const response = await axiosInstance.get(`/colours`);
    return response.data.colours as IColour[];
  } catch (error) {
    throw error;
  }
};

// Get colour by ID
export const getColourById = async (id: string, ) => {
  try {
    const response = await axiosInstance.get(`/colours/${id}`);
    return response.data.colour as IColour;
  } catch (error) {
    throw error;
  }
};

// Create colour
export const createColour = async (
  data: Partial<IColour>,
  
) => {
  try {
    
    const response = await axiosInstance.post(`/colours`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update colour
export const updateColour = async (
  id: string,
  data: Partial<IColour>,
  
) => {
  try {
    
    const response = await axiosInstance.patch(`/colours/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete colour
export const deleteColour = async (id: string, ) => {
  try {
    
    const response = await axiosInstance.delete(`/colours/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
