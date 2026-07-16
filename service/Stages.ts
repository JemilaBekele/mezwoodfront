/* eslint-disable @typescript-eslint/no-explicit-any */
import {  IProject, ProjectStatus } from '@/models/Projects';
import { axiosInstance } from './axiosIntance';

// ========================= TYPES ========================= //
interface ProjectsResponse {
  success: boolean;
  projects: IProject[];
  count: number;
}
export const getProjectsBystatusDESIGN = async (params?: {

  status?: ProjectStatus;
 
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const response = await axiosInstance.get<ProjectsResponse>(`/projects`, {
      params: {
      
        status: 'INVOICE',
     
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
interface MetalWorkProjectsResponse {
  success: boolean;
  projects: IProject[];
  count: number;
  total: number;
}

// stage/cnc-work-projects

export const getMetalWorkProjects = async (params?: {
  status?: 'finished' | 'not-finished' | 'all';
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const response = await axiosInstance.get<MetalWorkProjectsResponse>(
      `/metal-work-projects`,
      {
        params: {
          status: params?.status || 'all',
          sortOrder: params?.sortOrder || 'desc'
        }
      }
    );

    const projects = response?.data?.projects ?? [];

    return {
      projects,
      totalCount: response?.data?.count ?? projects.length,
      total: response?.data?.total ?? 0,
      success: response?.data?.success ?? false
    };

  } catch (error) {
    console.error('Error fetching metal work projects:', error);

    return {
      projects: [] as IProject[],
      totalCount: 0,
      total: 0,
      success: false
    };
  }
};
export const getCncWorkProjects = async (params?: {
  status?: 'finished' | 'not-finished' | 'all';
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const response = await axiosInstance.get<MetalWorkProjectsResponse>(
      `/stage/cnc-work-projects`,
      {
        params: {
          status: params?.status || 'all',
          sortOrder: params?.sortOrder || 'desc'
        }
      }
    );

    const projects = response?.data?.projects ?? [];

    return {
      projects,
      totalCount: response?.data?.count ?? projects.length,
      total: response?.data?.total ?? 0,
      success: response?.data?.success ?? false
    };

  } catch (error) {
    console.error('Error fetching metal work projects:', error);

    return {
      projects: [] as IProject[],
      totalCount: 0,
      total: 0,
      success: false
    };
  }
};

// 

export const getCuttingWorkProjects = async (params?: {
  status?: 'finished' | 'not-finished' | 'all';
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const response = await axiosInstance.get<MetalWorkProjectsResponse>(
      `/stage/cutting-work-projects`,
      {
        params: {
          status: params?.status || 'all',
          sortOrder: params?.sortOrder || 'desc'
        }
      }
    );

    const projects = response?.data?.projects ?? [];

    return {
      projects,
      totalCount: response?.data?.count ?? projects.length,
      total: response?.data?.total ?? 0,
      success: response?.data?.success ?? false
    };

  } catch (error) {
    console.error('Error fetching metal work projects:', error);

    return {
      projects: [] as IProject[],
      totalCount: 0,
      total: 0,
      success: false
    };
  }
};
export const getEdgebandingProjects = async (params?: {
  status?: 'finished' | 'not-finished' | 'all';
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const response = await axiosInstance.get<MetalWorkProjectsResponse>(
      `/stage/EdgeBanding-projects`,
      {
        params: {
          status: params?.status || 'all',
          sortOrder: params?.sortOrder || 'desc'
        }
      }
    );

    const projects = response?.data?.projects ?? [];

    return {
      projects,
      totalCount: response?.data?.count ?? projects.length,
      total: response?.data?.total ?? 0,
      success: response?.data?.success ?? false
    };

  } catch (error) {
    console.error('Error fetching metal work projects:', error);

    return {
      projects: [] as IProject[],
      totalCount: 0,
      total: 0,
      success: false
    };
  }
};
export const getAssemblyProjects = async (params?: {
  status?: 'finished' | 'not-finished' | 'all';
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const response = await axiosInstance.get<MetalWorkProjectsResponse>(
      `/stage/Assembly-projects`,
      {
        params: {
          status: params?.status || 'all',
          sortOrder: params?.sortOrder || 'desc'
        }
      }
    );

    const projects = response?.data?.projects ?? [];

    return {
      projects,
      totalCount: response?.data?.count ?? projects.length,
      total: response?.data?.total ?? 0,
      success: response?.data?.success ?? false
    };

  } catch (error) {
    console.error('Error fetching metal work projects:', error);

    return {
      projects: [] as IProject[],
      totalCount: 0,
      total: 0,
      success: false
    };
  }
};
export const getpaintingProjects = async (params?: {
  status?: 'finished' | 'not-finished' | 'all';
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const response = await axiosInstance.get<MetalWorkProjectsResponse>(
      `/stage/painting-projects`,
      {
        params: {
          status: params?.status || 'all',
          sortOrder: params?.sortOrder || 'desc'
        }
      }
    );

    const projects = response?.data?.projects ?? [];

    return {
      projects,
      totalCount: response?.data?.count ?? projects.length,
      total: response?.data?.total ?? 0,
      success: response?.data?.success ?? false
    };

  } catch (error) {
    console.error('Error fetching metal work projects:', error);

    return {
      projects: [] as IProject[],
      totalCount: 0,
      total: 0,
      success: false
    };
  }
};



export const getfinishedProjects = async (params?: {
  status?: 'finished' | 'not-finished' | 'all';
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const response = await axiosInstance.get<MetalWorkProjectsResponse>(
      `/stage/finished-projects`,
      {
        params: {
          status: params?.status || 'all',
          sortOrder: params?.sortOrder || 'desc'
        }
      }
    );

    const projects = response?.data?.projects ?? [];

    return {
      projects,
      totalCount: response?.data?.count ?? projects.length,
      total: response?.data?.total ?? 0,
      success: response?.data?.success ?? false
    };

  } catch (error) {
    console.error('Error fetching metal work projects:', error);

    return {
      projects: [] as IProject[],
      totalCount: 0,
      total: 0,
      success: false
    };
  }
};

export const getdeliveryProjects = async (params?: {
  status?: 'finished' | 'not-finished' | 'all';
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const response = await axiosInstance.get<MetalWorkProjectsResponse>(
      `/stage/delivery-projects`,
      {
        params: {
          status: params?.status || 'all',
          sortOrder: params?.sortOrder || 'desc'
        }
      }
    );

    const projects = response?.data?.projects ?? [];

    return {
      projects,
      totalCount: response?.data?.count ?? projects.length,
      total: response?.data?.total ?? 0,
      success: response?.data?.success ?? false
    };

  } catch (error) {
    console.error('Error fetching metal work projects:', error);

    return {
      projects: [] as IProject[],
      totalCount: 0,
      total: 0,
      success: false
    };
  }
};

export const getinstalationProjects = async (params?: {
  status?: 'finished' | 'not-finished' | 'all';
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const response = await axiosInstance.get<MetalWorkProjectsResponse>(
      `/stage/instalation-projects`,
      {
        params: {
          status: params?.status || 'all',
          sortOrder: params?.sortOrder || 'desc'
        }
      }
    );

    const projects = response?.data?.projects ?? [];

    return {
      projects,
      totalCount: response?.data?.count ?? projects.length,
      total: response?.data?.total ?? 0,
      success: response?.data?.success ?? false
    };

  } catch (error) {
    console.error('Error fetching metal work projects:', error);

    return {
      projects: [] as IProject[],
      totalCount: 0,
      total: 0,
      success: false
    };
  }
};
export const getdesignProjects = async (params?: {
  status?: 'finished' | 'not-finished' | 'all';
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const response = await axiosInstance.get<MetalWorkProjectsResponse>(
      `stage/design-projects`,
      {
        params: {
          status: params?.status || 'all',
        }
      }
    );

    const projects = response?.data?.projects ?? [];

    return {
      projects,
      totalCount: response?.data?.count ?? projects.length,
      total: response?.data?.total ?? 0,
      success: response?.data?.success ?? false
    };

  } catch (error) {
    console.error('Error fetching metal work projects:', error);

    return {
      projects: [] as IProject[],
      totalCount: 0,
      total: 0,
      success: false
    };
  }
};
export const mygetdesignProjects = async (params?: {
  status?: 'finished' | 'not-finished' | 'all';
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const response = await axiosInstance.get<MetalWorkProjectsResponse>(
      `stage/design-projects/bydesigner`,
      {
        params: {
          status: params?.status || 'all',
        }
      }
    );

    const projects = response?.data?.projects ?? [];

    return {
      projects,
      totalCount: response?.data?.count ?? projects.length,
      total: response?.data?.total ?? 0,
      success: response?.data?.success ?? false
    };

  } catch (error) {
    console.error('Error fetching metal work projects:', error);

    return {
      projects: [] as IProject[],
      totalCount: 0,
      total: 0,
      success: false
    };
  }
};
export const UnassignedgetdesignProjects = async (params?: {
  status?: 'finished' | 'not-finished' | 'all';
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const response = await axiosInstance.get<MetalWorkProjectsResponse>(
      `stage/design-projects/Unassigned`,
      {
        params: {
          status: params?.status || 'all',
        }
      }
    );

    const projects = response?.data?.projects ?? [];

    return {
      projects,
      totalCount: response?.data?.count ?? projects.length,
      total: response?.data?.total ?? 0,
      success: response?.data?.success ?? false
    };

  } catch (error) {
    console.error('Error fetching metal work projects:', error);

    return {
      projects: [] as IProject[],
      totalCount: 0,
      total: 0,
      success: false
    };
  }
};

// 
export const getpurchasingProjects = async (params?: {
  status?: 'finished' | 'not-finished' | 'all';
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const response = await axiosInstance.get<MetalWorkProjectsResponse>(
      `/stage/purchasing-projects`,
      {
        params: {
          status: params?.status || 'all',
          sortOrder: params?.sortOrder || 'desc'
        }
      }
    );
    const projects = response?.data?.projects ?? [];

    return {
      projects,
      totalCount: response?.data?.count ?? projects.length,
      total: response?.data?.total ?? 0,
      success: response?.data?.success ?? false
    };

  } catch (error) {
    console.error('Error fetching metal work projects:', error);

    return {
      projects: [] as IProject[],
      totalCount: 0,
      total: 0,
      success: false
    };
  }
};
export interface PurchasesStockCheckResponse {
  success: boolean;
  message: string;
  totalPurchases: number;
  purchases: any[]; // replace with proper interface if you define it
  summary: {
    totalPurchases: number;
    totalItems: number;
    purchasesWithStockIssues: number;
    purchasesWithNoIssues: number;
    totalInsufficientStockValue: number;
    averageStockIssuePerPurchase: number;
  };
}
//  
export const getMaterialUsageReport = async (
  format: 'text' | 'json' | 'excel' = 'json',
  
) => {
  try {
    
    const response = await axiosInstance.get('/purchases/usage/report', {
      params: {
        format: format,
      },
    });

    // Handle different response formats
    if (format === 'text') {
      return {
        text: response?.data?.text ?? '',
        piReports: response?.data?.piReports ?? [],
        summary: response?.data?.summary ?? [],
        success: true,
      };
    } 
    else if (format === 'excel') {
      return {
        excelData: response?.data?.excelData ?? { piSheet: [], summarySheet: [] },
        piReports: response?.data?.piReports ?? [],
        summary: response?.data?.summary ?? [],
        success: true,
      };
    }
    else {
      // JSON format (default)
      return {
        reportType: response?.data?.reportType ?? 'Material Purchase Required Report',
        purpose: response?.data?.purpose ?? 'Materials not fully issued - For Purchase Department',
        generatedAt: response?.data?.generatedAt ?? new Date().toISOString(),
        piReports: response?.data?.piReports ?? [],
        summary: response?.data?.summary ?? [],
        success: true,
      };
    }
  } catch (error) {
    console.error('Error fetching material usage report:', error);

    return {
      text: '',
      piReports: [],
      summary: [],
      excelData: { piSheet: [], summarySheet: [] },
      success: false,
    };
  }
}

