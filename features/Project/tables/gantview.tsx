/* eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/Project/gantt/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getProjectId } from '@/service/Project';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GanttChartPage } from './gantt-chart-modal';

type TProjectViewPageProps = {
  projectId: string;
};

export default function ProjectViewPage({ projectId }: TProjectViewPageProps) {
   const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projectData = await getProjectId(projectId);
        setProject(projectData);
      } catch (error: any) {
        toast.error('Failed to load project data');
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading project data...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Project not found</p>
      </div>
    );
  }

  return (
    <GanttChartPage
      projectId={project.id}
      projectName={`${project.customer?.name || 'Project'} - ${project.id.substring(0, 8)}...`}
      stages={project.stages || []}
      projectData={project} // Pass the project data
    />
  );
}