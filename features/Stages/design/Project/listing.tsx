'use client';

import { StageProjectListing } from '../../allstages';
import { projectColumns } from './tables/columns';
import { getdesignProjects } from '@/service/Stages';
import { useEffect, useState } from 'react';
import { IProject } from '@/models/Projects';
import { adminprojectColumns } from './tables/listforadmin';

export default function DesignProjectListingPage() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const result = await getdesignProjects({ status: 'all' });
        setProjects(result.projects);
        setError(null);
      } catch (err) {
        setError('Failed to load design projects');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading design projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading design projects. Please try again later.
      </div>
    );
  }

  return (
    <StageProjectListing
      projects={projects}
      projectColumns={adminprojectColumns}
      stageName="Design"
      emptyStateMessages={{
        today: 'No design projects due today',
        tomorrow: 'No design projects due tomorrow',
        other: 'No other design projects found'
      }}
    />
  );
}