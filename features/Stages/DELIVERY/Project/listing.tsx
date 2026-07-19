'use client';

import { StageProjectListing } from '../deliver';
import { projectColumns } from './tables/columns';
import { getdeliverysProjects } from '@/service/Stages';
import { useEffect, useState, useCallback } from 'react';
import { IProject } from '@/models/Projects';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type DeliveryStatus = 'not-finished' | 'partially-delivered' | 'approved';

export default function DeliveryProjectListingPage() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeStatus, setActiveStatus] = useState<DeliveryStatus>('not-finished');

  const fetchProjects = useCallback(async (status: DeliveryStatus = 'not-finished') => {
    try {
      setLoading(true);
      const result = await getdeliverysProjects({ status });
      setProjects(result.projects);
      setError(null);
    } catch (err) {
      setError('Failed to load delivery projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    fetchProjects(activeStatus);
  }, [fetchProjects, activeStatus]);

  const handleStatusChange = useCallback((status: DeliveryStatus) => {
    setActiveStatus(status);
    fetchProjects(status);
  }, [fetchProjects]);

  useEffect(() => {
    fetchProjects('not-finished');
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading delivery projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading delivery projects. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs 
        defaultValue="not-finished" 
        onValueChange={(value) => handleStatusChange(value as DeliveryStatus)}
      >
        <TabsList>
          <TabsTrigger value="not-finished">
            Not Finished
          </TabsTrigger>
          <TabsTrigger value="partially-delivered">
            Partially Delivered
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeStatus} className="mt-4">
          <StageProjectListing
            key={refreshKey}
            projects={projects}
            projectColumns={projectColumns}
            stageName="Delivery"
            emptyStateMessages={{
              today: `No ${activeStatus.replace('-', ' ')} delivery projects due today`,
              tomorrow: `No ${activeStatus.replace('-', ' ')} delivery projects due tomorrow`,
              other: `No ${activeStatus.replace('-', ' ')} delivery projects found`
            }}
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}