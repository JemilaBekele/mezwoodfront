/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/* eslint-disable react-hooks/error-boundaries */

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { getAssemblyProjects } from '@/service/Stages';
import { projectColumns } from './Project/tables/columns';

type ProjectListingPageProps = object;

export default function FinishedAssemblyProjectListingPage(
  {}: ProjectListingPageProps
) {
  const [projects, setProjects] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await getAssemblyProjects({
          status: 'finished'
        });

        setProjects(response.projects ?? []);
        setTotalCount(response.totalCount ?? 0);
      } catch (error) {
        console.error('Error loading projects:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        Loading finished assembly projects...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading projects. Please try again later.
      </div>
    );
  }

  return (
    <DataTable
      data={projects}
      totalItems={totalCount}
      columns={projectColumns}
    />
  );
}