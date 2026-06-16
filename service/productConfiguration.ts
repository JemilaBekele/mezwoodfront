import { IncomingMessage } from 'http';

import {
  IProductCategory,
  IProductType,
  ISize
} from '@/models/productConfiguration';
import { axiosInstance } from './axiosIntance';

// ========================= RESPONSE TYPES ========================= //

interface ListResponse<T> {
  success: boolean;
  count: number;
  data: T[];
  categories?: T[]; // For category list responses
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

// ========================= PRODUCT CATEGORY ========================= //

export const getAllCategories = async () => {
  try {
    const response = await axiosInstance.get<ListResponse<IProductCategory>>(
      `/productcategory`
    );

    const categories = response?.data?.categories ?? [];

    return {
      categories,
      totalCount: response?.data?.count ?? categories.length,
      success: response?.data?.success ?? false
    };
  } catch (error) {
    console.error('Error fetching product categories:', error);

    return {
      categories: [] as IProductCategory[],
      totalCount: 0,
      success: false
    };
  }
};
export const getCategoriesview = async () => {
  const response = await axiosInstance.get(`/productcategory`);
  return response.data.categories as IProductCategory[];
};

export const getCategories = async () => {
  const response = await axiosInstance.get(`/productcategory`);
  return response.data.categories as IProductCategory[];
};

export const getCategoryById = async (id: string, ) => {
  const response = await axiosInstance.get<SingleResponse<IProductCategory>>(
    `/productcategory/${id}`
  );
  return response.data.data;
};

export const createCategory = async (
  data: Partial<IProductCategory>,
  
) => {
  const response = await axiosInstance.post(`/productcategory`, data);
  return response.data;
};

export const updateCategory = async (
  id: string,
  data: Partial<IProductCategory>,
  
) => {
  const response = await axiosInstance.put(
    `/productcategory/${id}`,
    data
  );
  return response.data;
};

export const deleteCategory = async (id: string, ) => {
  const response = await axiosInstance.delete(`/productcategory/${id}`);
  return response.data;
};

// ========================= PRODUCT TYPE ========================= //
export const getAllTypes = async () => {
  try {
    const response = await axiosInstance.get(`/producttypes`);

    const types = response?.data?.productTypes ?? [];

    return {
      types,
      totalCount: response?.data?.count ?? types.length,
      success: response?.data?.success ?? false
    };
  } catch (error) {
    console.error('Error fetching product Type:', error);

    return {
      types: [] as IProductType[],
      totalCount: 0,
      success: false
    };
  }
};


export const getTypesview = async () => {
  const response = await axiosInstance.get(`/producttypes`);
  return response.data.productTypes as IProductType[];
};

export const getTypes = async () => {
  const response = await axiosInstance.get(`/producttypes`);
  return response.data.productTypes as IProductType[];
};

export const getTypeById = async (id: string, ) => {
  const response = await axiosInstance.get<SingleResponse<IProductType>>(
    `/producttypes/${id}`
  );
  return response.data.data;
};

export const createType = async (
  data: Partial<IProductType>,
  
) => {
  const response = await axiosInstance.post(`/producttypes`, data);
  return response.data;
};

export const updateType = async (
  id: string,
  data: Partial<IProductType>,
  
) => {
  const response = await axiosInstance.put(
    `/producttypes/${id}`,
    data
  );
  return response.data;
};

export const deleteType = async (id: string, ) => {
  const response = await axiosInstance.delete(`/producttypes/${id}`);
  return response.data;
};

// ========================= SIZE ========================= //
export const getAllSizes = async () => {
  try {
    const response = await axiosInstance.get(`/productsizes`);

    const sizes = response?.data?.sizes ?? [];

    return {
      sizes,
      totalCount: response?.data?.count ?? sizes.length,
      success: response?.data?.success ?? false
    };
  } catch (error) {
    console.error('Error fetching product sizes:', error);

    return {
      sizes: [] as ISize[],
      totalCount: 0,
      success: false
    };
  }
};

export const getSizesview = async () => {
  const response = await axiosInstance.get(`/productsizes`);
  return response.data.sizes as ISize[];
};

export const getSizes = async () => {
  const response = await axiosInstance.get(`/productsizes`);
  return response.data.sizes as ISize[];
};

export const getSizeById = async (id: string, ) => {
  const response = await axiosInstance.get<SingleResponse<ISize>>(
    `/productsizes/${id}`
  );
  return response.data.data;
};

export const createSize = async (
  data: Partial<ISize>,
  
) => {
  const response = await axiosInstance.post(`/productsizes`, data);
  return response.data;
};

export const updateSize = async (
  id: string,
  data: Partial<ISize>,
  
) => {
  const response = await axiosInstance.put(
    `/productsizes/${id}`,
    data
  );
  return response.data;
};

export const deleteSize = async (id: string, ) => {
  const response = await axiosInstance.delete(`/productsizes/${id}`);
  return response.data;
};