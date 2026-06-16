import { axiosInstance } from './axiosIntance';

// Factory Reset
export const factoryReset = async () => {
  try {
    const response = await axiosInstance.post('/factory-reset');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Year End Reset
export const yearEndReset = async () => {
  try {
    const response = await axiosInstance.post('/year-end-reset');
    return response.data;
  } catch (error) {
    throw error;
  }
};
