/* eslint-disable import/no-unresolved */
import { IncomingMessage } from 'http';
import { axiosInstance } from './axiosIntance';

export interface IProjectStageWorkLog {
  id?: string;
  projectStageId: string;
  doneUnits: number;
  hours?: number;        // actual working hours logged for this entry (optional)
  doneById?: string;
  note?: string;
}

export const createProjectStageWorkLog = async (
  data: IProjectStageWorkLog,
  
) => {
  try {

    const response = await axiosInstance.post(
      '/project-stage-work-logs',
      data
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteProjectStageWorkLog = async (
  id: string,
  
) => {
  try {
    

    const response = await axiosInstance.delete(
      `/project-stage-work-logs/${id}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};