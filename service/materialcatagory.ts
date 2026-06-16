
import { axiosInstance } from './axiosIntance';

// ========================= TYPES ========================= //

export interface IMaterialCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface MaterialCategoriesResponse {
  success: boolean;
  materialCategories: IMaterialCategory[];
}

interface MaterialCategoryResponse {
  success: boolean;
  materialCategory: IMaterialCategory;
}


// ========================= MATERIAL CATEGORIES ========================= //

// ✅ Get all material categories (client-side)
export const getAllMaterialCategories = async () => {
  try {
    const response = await axiosInstance.get(
      `/material-categories`
    );

    const materialCategories = response?.data?.materialCategories ?? [];
    return {
      materialCategories,
      totalCount: materialCategories.length,
      success: response?.data?.success ?? false,
    };
  } catch (error) {
    console.error('Error fetching material categories:', error);

    return {
      categories: [] as IMaterialCategory[],
      totalCount: 0,
      success: false,
    };
  }
};


// ✅ Get all categories (server-side / with auth)
export const getMaterialCategories = async () => {
  try {
    const response = await axiosInstance.get<MaterialCategoriesResponse>(
      `/material-categories`
    );

    return response.data.materialCategories;
  } catch (error) {
    throw error;
  }
};


// ✅ Get category by ID
export const getMaterialCategoryById = async (
  id: string,
  
) => {
  try {

    const response = await axiosInstance.get<MaterialCategoryResponse>(
      `/material-categories/${id}`
    );

    return response.data.materialCategory;
  } catch (error) {
    throw error;
  }
};


// ✅ Search category by name
export const getMaterialCategoryByName = async (
  name: string,
  
) => {
  try {

    const response = await axiosInstance.get<MaterialCategoryResponse>(
      `/material-categories/search/name/${name}`
    );

    return response.data.materialCategory;
  } catch (error) {
    throw error;
  }
};


// ✅ Create category
export const createMaterialCategory = async (
  data: Pick<IMaterialCategory, 'name'>,
  
) => {
  try {

    const response = await axiosInstance.post(
      `/material-categories`,
      data
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};


// ✅ Update category
export const updateMaterialCategory = async (
  id: string,
  data: Partial<Pick<IMaterialCategory, 'name'>>,
  
) => {
  try {

    const response = await axiosInstance.put(
      `/material-categories/${id}`,
      data
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};


// ✅ Delete category
export const deleteMaterialCategory = async (
  id: string,
  
) => {
  try {

    const response = await axiosInstance.delete(
      `/material-categories/${id}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};
