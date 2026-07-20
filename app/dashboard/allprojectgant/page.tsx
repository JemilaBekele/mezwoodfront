'use client';

import PageContainer from '@/components/layout/page-container';
import FormCardSkeleton from '@/components/form-card-skeleton';
import { AllProjectsGanttChart } from '@/features/Project/allprojectgantchart';
import { IProject } from '@/models/Projects';
import { getProjectsSSR } from '@/service/Project';
import { useEffect, useState } from 'react';

export default function ProjectsGanttPage() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      try {
        const data = await getProjectsSSR();

        if (!cancelled) {
          setProjects(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageContainer scrollable>
      <div className="flex-1 space-y-4">
        {loading ? (
          <FormCardSkeleton />
        ) : (
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AllProjectsGanttChart projects={projects} />
          </main>
        )}
      </div>
    </PageContainer>
  );
}