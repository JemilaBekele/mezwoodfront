'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/error-boundaries */
import { useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/ui/table/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CalendarDays, CalendarClock } from 'lucide-react';
import { IProject } from '@/models/Projects';
import { useMemo } from 'react';

interface StageProjectListingProps {
  projects: IProject[];
  projectColumns: any;
  stageName: string;
  emptyStateMessages?: {
    today?: string;
    tomorrow?: string;
    other?: string;
  };
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

export function StageProjectListing({
  projects,
  projectColumns,
  stageName,
  emptyStateMessages = {
    today: 'No projects due today',
    tomorrow: 'No projects due tomorrow',
    other: 'No other projects found'
  }
}: StageProjectListingProps) {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page') || 1);
  const search = searchParams.get('q') || '';
  const limit = Number(searchParams.get('limit') || 10);

  const { todayProjects, tomorrowProjects, otherProjects } = useMemo(
    () => categorizeProjects(projects, search),
    [projects, search]
  );

  const defaultTab = todayProjects.length > 0 ? 'today' : tomorrowProjects.length > 0 ? 'tomorrow' : 'other';

  const renderProjectTable = (projectsList: IProject[]) => {
    const startIndex = (page - 1) * limit;
    const paginatedData = projectsList.slice(startIndex, startIndex + limit);

    return (
      <DataTable
        data={paginatedData}
        totalItems={projectsList.length}
        columns={projectColumns}
      />
    );
  };

  return (
    <div className="space-y-6 p-4">
      <div className="grid gap-4 sm:grid-cols-3">
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