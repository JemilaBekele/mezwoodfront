'use client';

import { StageProjectListing } from '../../listlibrary';
import { projectColumns } from './tables/columns';
import { getinstalationProjects } from '@/service/Stages';
import { useEffect, useState, useCallback } from 'react';
import { IProject } from '@/models/Projects';

export default function InstallationProjectListingPage() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getinstalationProjects({ status: 'not-finished' });
      setProjects(result.projects);
      setError(null);
    } catch (err) {
      setError('Failed to load installation projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    // Increment refresh key to force re-render of the table
    setRefreshKey(prev => prev + 1);
    // Fetch fresh data
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading installation projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading installation projects. Please try again later.
      </div>
    );
  }

  return (
    <StageProjectListing
      key={refreshKey} // Force re-render when refreshKey changes
      projects={projects}
      projectColumns={projectColumns}
      stageName="Installation"
      emptyStateMessages={{
        today: 'No installation projects due today',
        tomorrow: 'No installation projects due tomorrow',
        other: 'No other installation projects found'
      }}
      onRefresh={handleRefresh} // Pass refresh function to the listing component
    />
  );
}