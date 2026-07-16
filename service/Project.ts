/* eslint-disable @typescript-eslint/no-explicit-any */
import { IncomingMessage } from 'http';

import { DesignStatus, DifficultyLevel, IProject, ProjectStatus } from '@/models/Projects';
import { axiosInstance } from './axiosIntance';

// ========================= TYPES ========================= //

interface ProjectResponse {
  success: boolean;
  project: IProject;
}

interface ProjectsResponse {
  success: boolean;
  projects: IProject[];
  count: number;
}

interface CreateUpdateProjectResponse {
  success: boolean;
  project?: IProject;
  message?: string;
  data?: any;
}

interface DeleteProjectResponse {
  success: boolean;
  message: string;
}

interface ProjectStatisticsResponse {
  success: boolean;
  data: {
    total: number;
    completed: number;
    inProgress: number;
    cancelled: number;
  };
}

// ========================= PROJECTS ========================= //

// Get all projects (with filtering & pagination)
export const getProjects = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
  customerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const response = await axiosInstance.get<ProjectsResponse>(`/projects`, {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        search: params?.search || '',
        status: params?.status,
        customerId: params?.customerId,
        sortBy: params?.sortBy || 'createdAt',
        sortOrder: params?.sortOrder || 'desc'
      }
    });

    const projects = response?.data?.projects ?? [];
    return {
      projects,
      totalCount: response?.data?.count ?? projects.length,

      success: response?.data?.success ?? false
    };
  } catch (error) {
    console.error('Error fetching projects:', error);
    return {
      projects: [] as IProject[],
      totalCount: 0,
      success: false
    };
  }
};

// Get projects (server-side / SSR)
export const getProjectsSSR = async () => {
  try {
    const response = await axiosInstance.get<ProjectsResponse>(`/projects`);
    return response.data.projects;
  } catch (error) {
    throw error;
  }
};
// export const getProjectsBystatus = async () => {
//   try {
//     
//     const response = await axiosInstance.get<ProjectsResponse>(`/projects/By/status`);
//     return response.data.projects;
//   } catch (error) {
//     throw error;
//   }
// };
export const getProjectsBystatus = async (params?: {

  status?: ProjectStatus;
 
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const response = await axiosInstance.get<ProjectsResponse>(`/projects`, {
      params: {
      
        status: params?.status,
     
        sortOrder: params?.sortOrder || 'desc'
      }
    });

    const projects = response?.data?.projects ?? [];
    return {
      projects,
      totalCount: response?.data?.count ?? projects.length,

      success: response?.data?.success ?? false
    };
  } catch (error) {
    console.error('Error fetching projects:', error);
    return {
      projects: [] as IProject[],
      totalCount: 0,
      success: false
    };
  }
};

// Get project by ID
export const getProjectById = async (
  id: string,
) => {
  try {
    const response = await axiosInstance.get<ProjectResponse>(
      `/projects/${id}`
    );
    return response.data.project;
  } catch (error) {
    throw error;
  }
};
export const getProjectId = async (
  id: string,
    

) => {
  try {

    const response = await axiosInstance.get<ProjectResponse>(
      `/projects/${id}`
    );
    return response.data.project;
  } catch (error) {
    throw error;
  }
};
// Search projects by customer or invoice
export const searchProjects = async (
  query: string,
  limit = 10,
  
) => {
  try {
    const response = await axiosInstance.get<ProjectsResponse>(
      `/projects/search/query`,
      {
        params: { query, limit }
      }
    );
    return response.data.projects;
  } catch (error) {
    throw error;
  }
};

// Get projects by customer ID
export const getProjectsByCustomer = async (
  customerId: string,
  
) => {
  try {
    const response = await axiosInstance.get<ProjectsResponse>(
      `/projects/customer/${customerId}`
    );
    return response.data.projects;
  } catch (error) {
    throw error;
  }
};



/* ================================
   Types
================================ */



/* ================================
   Create Project
================================ */

export const createProject = async (
  data: {
    invoiceId: string;
    difficulty?: DifficultyLevel;
    requestedDelivery?: string; // ISO date
  },
  
) => {
  try {
    

    const response = await axiosInstance.post<CreateUpdateProjectResponse>(
      '/projects',
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

/* ================================
   Update Project
================================ */

export const updateProject = async (
  id: string,
  data: Partial<{
    status: ProjectStatus;
    difficulty: DifficultyLevel;
    requestedDelivery: string; // ISO date
  }>,
  
) => {
  try {
    

    const response = await axiosInstance.put<CreateUpdateProjectResponse>(
      `/projects/${id}`,
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

/* ================================
Types
================================ */

export interface AutoScheduleProjectResponse {
  success: boolean;
  message: string;
  data: {
    project: any; // Replace with IProject if you have one
    schedulingReport: any;
  };
}

export interface ManualScheduleProjectResponse {
  success: boolean;
  message: string;
  data: {
    project: any; // Replace with IProject if you have one
    message: string;
  };
}
export const updateProjectDesignStatus = async (
  id: string,
  designStatus: DesignStatus,
  
) => {
  try {
    

    const response = await axiosInstance.patch(
      `/projects/${id}/design/status`,
      { designStatus }
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

export const autoScheduleProjectStages = async (
  projectId: string,
  
) => {
  try {
    

    const response = await axiosInstance.post<AutoScheduleProjectResponse>(
      `/projects/${projectId}/auto-schedule`
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw error;
  }
};
export const manualScheduleProjectStage = async (
  projectId: string,
  manualDelivery: string, // ISO date: YYYY-MM-DD
  
) => {
  try {
    

    const response = await axiosInstance.post<ManualScheduleProjectResponse>(
      `/projects/${projectId}/manual-schedule`,
      { manualDelivery }
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw error;
  }
};


// Update project status only
export const updateProjectStatus = async (
  id: string,
  status: ProjectStatus,
  
) => {
  try {
    
    const response = await axiosInstance.patch<CreateUpdateProjectResponse>(
      `/projects/${id}/status`,
      { status }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// Calculate project delivery
export const calculateProjectDelivery = async (
  projectId: string,
  
) => {
  try {
    
    const response = await axiosInstance.post<CreateUpdateProjectResponse>(
      `/projects/${projectId}/calculate-delivery`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get project statistics
export const getProjectStatistics = async (
  
) => {
  try {
    
    const response = await axiosInstance.get<ProjectStatisticsResponse>(
      `/projects/statistics/overview`
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Delete project
export const deleteProject = async (
  id: string,
  
) => {
  try {
    
    const response = await axiosInstance.delete<DeleteProjectResponse>(
      `/projects/${id}`
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};


/**
 * ============================================
 * UPDATE PROJECT STAGE
 * ============================================
 */
export const updateProjectStage = async (
  data: {
    projectId: string;
    stageName: string;
    newQuantity: number;
    allowOverCapacity?: boolean;
    customDates?: {
      startDate?: string;
      endDate?: string;
    } | null;
    timeTakenMinutes?: number;
    createManualWorkLog?: boolean;
    manualOverride?: boolean;
    isNewStage?: boolean;
  },
  
): Promise<any> => {
  try {
    

    const response = await axiosInstance.put(
      `/project-stages/update`,
      data
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw error;
  }
};
export const deleteProjectStage = async (
  data: {
    projectId: string;
    stageName: string;
    deleteDownstream?: boolean;
  }
): Promise<any> => {
  try {
    const response = await axiosInstance.delete(
      `/projects/stage/delete/specific`,
      {
        data,
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw error;
  }
};
/**
 * ============================================
 * SET SCHEDULE MODE (AUTO | MANUAL | LOCKED)
 * ============================================
 */
export const setProjectScheduleMode = async (
  projectId: string,
  mode: 'AUTO' | 'MANUAL' | 'LOCKED',
  
): Promise<any> => {
  try {
    
    const response = await axiosInstance.patch(
      `/projects/${projectId}/schedule-mode`,
      { mode }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) throw new Error(error.response.data.error);
    throw error;
  }
};

/**
 * ============================================
 * CANCEL A SINGLE STAGE
 * ============================================
 */
export const cancelProjectStage = async (
  projectId: string,
  stageName: string,
  
): Promise<any> => {
  try {
    
    const response = await axiosInstance.patch(
      `/projects/${projectId}/cancel-stage`,
      { stageName }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) throw new Error(error.response.data.error);
    throw error;
  }
};

/**
 * ============================================
 * GET SCHEDULE / DELIVERY AUDIT HISTORY
 * ============================================
 */
export const getProjectScheduleHistory = async (
  projectId: string,
  
): Promise<any> => {
  try {
    const response = await axiosInstance.get(
      `/projects/${projectId}/schedule-history`
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) throw new Error(error.response.data.error);
    throw error;
  }
};

/**
 * ============================================
 * GET CAPACITY ANALYSIS
 * ============================================
 */
export const getCapacityAnalysis = async (
  data: {
    stage: string;
    startDate: string | Date;
    endDate: string | Date;
    requiredQuantity: number;
  },
  
): Promise<any> => {
  try {
    

    const response = await axiosInstance.post(
      `/project-stages/capacity-analysis`,
      data
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw error;
  }
};

/**
 * ============================================
 * GET DAILY CAPACITY STATUS
 * ============================================
 */
export const getDailyCapacityStatus = async (
  stage: string,
  date: string | Date,
  
): Promise<any> => {
  try {
    

    const response = await axiosInstance.get(
      `/project-stages/capacity-status`,
      {
        params: {
          stage,
          date,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw error;
  }
};

/**
 * ============================================
 * ADD OVER CAPACITY
 * ============================================
 */
export const addOverCapacity = async (
  data: {
    stage: string;
    date: string | Date;
    requiredUnits: number;
    requiredHours: number;
  },
  
): Promise<any> => {
  try {
    

    const response = await axiosInstance.post(
      `/project-stages/over-capacity`,
      data
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw error;
  }
};

/**
 * ============================================
 * RESCHEDULE FROM CALENDAR (drag-and-drop)
 * ============================================
 */
export const rescheduleProjectFromCalendar = async (
  projectId: string,
  stageName: string,
  newStartDate: string | Date,
  fromDate?: string | Date,
  units?: number,
  pastCellMove?: boolean,
): Promise<any> => {
  try {

    const body: Record<string, string | number | boolean> = {
      stageName,
      newStartDate:
        typeof newStartDate === 'string'
          ? newStartDate
          : newStartDate.toISOString(),
    };

    if (fromDate) {
      body.fromDate =
        typeof fromDate === 'string' ? fromDate : fromDate.toISOString();
    }

    // Partial move: relocate only `units` of the source-day cell. Omitted (or
    // equal to the full cell) → whole-phase move on the backend.
    if (units != null) {
      body.units = units;
    }

    // Backward drag: move only the source-day cell (+ parallel peer cells) to
    // the earlier day, with no downstream cascade.
    if (pastCellMove) {
      body.pastCellMove = true;
    }

    const response = await axiosInstance.post(
      `/projects/${projectId}/reschedule-from-calendar`,
      body
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw error;
  }
};