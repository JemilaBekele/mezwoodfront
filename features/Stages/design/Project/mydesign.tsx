'use client';

import { projectColumns } from './tables/columns';
import { mygetdesignProjects } from '@/service/Stages';
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { StageCardGrid } from '@/features/Stages/stage-card-grid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CalendarDays, CalendarClock, CheckCircle2, AlertCircle } from 'lucide-react';
import { IProject } from '@/models/Projects';
import { DesignStatusFilter, useDesignStatusFilter } from './design-status-filter';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/error-boundaries */

interface StageProjectListingProps {
  projects: IProject[];
  allProjects?: IProject[]; // Added to have access to all projects for counting
  projectColumns: any;
  stageName: string;
  reload?: () => Promise<void>;
  emptyStateMessages?: {
    today?: string;
    tomorrow?: string;
    other?: string;
  };
  designStatus?: string;
  onDesignStatusChange?: (value: string) => void;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
}

function sortByDeliveryDate(projects: IProject[]): IProject[] {
  return [...projects].sort((a, b) => {
    const dateA = a.calculatedDelivery ? new Date(a.calculatedDelivery).getTime() : Infinity;
    const dateB = b.calculatedDelivery ? new Date(b.calculatedDelivery).getTime() : Infinity;
    return dateA - dateB;
  });
}

function categorizeProjects(projects: IProject[], searchQuery: string) {
  const filteredData = projects.filter((project) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      project.invoice?.piNumber?.toLowerCase().includes(searchLower) ||
      project.customer?.name?.toLowerCase().includes(searchLower)
    );
  });

  const todayProjects = sortByDeliveryDate(
    filteredData.filter((project) => project.calculatedDelivery && isToday(new Date(project.calculatedDelivery)))
  );

  const tomorrowProjects = sortByDeliveryDate(
    filteredData.filter((project) => project.calculatedDelivery && isTomorrow(new Date(project.calculatedDelivery)))
  );

  const otherProjects = sortByDeliveryDate(
    filteredData.filter((project) => {
      if (!project.calculatedDelivery) return true;
      const deliveryDate = new Date(project.calculatedDelivery);
      return !isToday(deliveryDate) && !isTomorrow(deliveryDate);
    })
  );

  return { todayProjects, tomorrowProjects, otherProjects };
}

function StageProjectListing({
  projects,
  allProjects = [],
  projectColumns,
  stageName,
  reload,
  emptyStateMessages = {
    today: 'No projects due today',
    tomorrow: 'No projects due tomorrow',
    other: 'No other projects found'
  },
  designStatus = 'all',
  onDesignStatusChange = () => {}
}: StageProjectListingProps) {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page') || 1);
  const search = searchParams.get('q') || '';
  const limit = Number(searchParams.get('limit') || 20);

  const { todayProjects, tomorrowProjects, otherProjects } = useMemo(
    () => categorizeProjects(projects, search),
    [projects, search]
  );

  const defaultTab = todayProjects.length > 0 ? 'today' : tomorrowProjects.length > 0 ? 'tomorrow' : 'other';

  const showDesignFinishedFilter = designStatus === 'DESIGN_FINISHED';

  // "Total Design Finished" always counts from all projects, whatever filter is selected
  const totalDesignFinishedCount = useMemo(
    () => allProjects.filter((p) => p.designStatus === 'DESIGN_FINISHED').length,
    [allProjects]
  );

  // Design status chip counts follow the search box
  const searchedAllProjects = useMemo(() => {
    const searchLower = search.toLowerCase();
    return allProjects.filter(
      (project) =>
        project.invoice?.piNumber?.toLowerCase().includes(searchLower) ||
        project.customer?.name?.toLowerCase().includes(searchLower)
    );
  }, [allProjects, search]);

  const renderProjectTable = (projectsList: IProject[]) => {
    const startIndex = (page - 1) * limit;
    const paginatedData = projectsList.slice(startIndex, startIndex + limit);

    return (
      <StageCardGrid
        compact
        showDesignStatus
        data={paginatedData}
        totalItems={projectsList.length}
        columns={projectColumns(reload)}
      />
    );
  };

  return (
    <div className="space-y-6 p-4">
      {/* Design Status Filter */}
      <DesignStatusFilter projects={searchedAllProjects} value={designStatus} onChange={onDesignStatusChange} />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <h3 className="font-medium">Total Design Finished</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{totalDesignFinishedCount}</p>
          <p className="text-xs text-muted-foreground">Projects ready for delivery</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <h3 className="font-medium">Today&apos;s Work</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{todayProjects.length}</p>
          <p className="text-xs text-muted-foreground">Due for delivery today</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-orange-500" />
            <h3 className="font-medium">Tomorrow&apos;s Work</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{tomorrowProjects.length}</p>
          <p className="text-xs text-muted-foreground">Due for delivery tomorrow</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-purple-500" />
            <h3 className="font-medium">Other Projects</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{otherProjects.length}</p>
          <p className="text-xs text-muted-foreground">Due later</p>
        </div>
      </div>

      {/* Message to encourage finishing design work */}
      {showDesignFinishedFilter && projects.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">
              ✅ {projects.length} project{projects.length !== 1 ? 's' : ''} have completed design!
            </p>
            <p className="text-xs text-green-700">
              These projects are ready for the final stage. Please review, stock the materials, and mark the projects as finished.
            </p>
          </div>
        </div>
      )}

      {showDesignFinishedFilter && projects.length === 0 && (
        <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              No design finished projects
            </p>
            <p className="text-xs text-yellow-700">
              Please complete the design work for pending projects to move them to delivery.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Today ({todayProjects.length})</TabsTrigger>
          <TabsTrigger value="tomorrow">Tomorrow ({tomorrowProjects.length})</TabsTrigger>
          <TabsTrigger value="other">Other ({otherProjects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {todayProjects.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
              <Calendar className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">{emptyStateMessages.today}</p>
            </div>
          ) : (
            renderProjectTable(todayProjects)
          )}
        </TabsContent>

        <TabsContent value="tomorrow" className="space-y-4">
          {tomorrowProjects.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
              <CalendarDays className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">{emptyStateMessages.tomorrow}</p>
            </div>
          ) : (
            renderProjectTable(tomorrowProjects)
          )}
        </TabsContent>

        <TabsContent value="other" className="space-y-4">
          {otherProjects.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
              <CalendarClock className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">{emptyStateMessages.other}</p>
            </div>
          ) : (
            renderProjectTable(otherProjects)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function MyDesignProjectListingPage() {
  const [allProjects, setAllProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { designStatus, select, apply } = useDesignStatusFilter();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const result = await mygetdesignProjects({ 
        status: 'not-finished'
      });
      
      setAllProjects(result.projects);
      setError(null);
    } catch (err) {
      setError('Failed to load my design projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading design projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center p-8 text-red-500">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <StageProjectListing
      projects={apply(allProjects)}
      allProjects={allProjects}
      projectColumns={projectColumns}
      stageName="My Design"
      reload={fetchProjects}
      designStatus={designStatus}
      onDesignStatusChange={select}
      emptyStateMessages={{
        today: 'No my design projects due today',
        tomorrow: 'No my design projects due tomorrow',
        other: 'No other my design projects found'
      }}
    />
  );
}
