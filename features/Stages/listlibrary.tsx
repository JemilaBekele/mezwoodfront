'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/error-boundaries */
import { useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/ui/table/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CalendarDays, CalendarClock } from 'lucide-react';
import { IProject, IProjectStage } from '@/models/Projects';
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

// Helper to get date without time for accurate comparison
function getDateWithoutTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isToday(date: Date): boolean {
  const today = getDateWithoutTime(new Date());
  const compareDate = getDateWithoutTime(date);
  return compareDate.getTime() === today.getTime();
}

function isTomorrow(date: Date): boolean {
  const today = getDateWithoutTime(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const compareDate = getDateWithoutTime(date);
  return compareDate.getTime() === tomorrow.getTime();
}

// Normalize stage name for comparison
function normalizeStageName(stageName: string): string {
  // Convert to uppercase and replace spaces with underscores
  return stageName.toUpperCase().replace(/\s+/g, '_');
}

function getStageDates(project: IProject, stageName: string): { startDate: Date | null; endDate: Date | null } {
  const normalizedStageName = normalizeStageName(stageName);
  
  // Find the specific stage
  const stage = project.stages?.find(
    (s: IProjectStage) => s.stage === normalizedStageName
  );

  if (!stage) {
    return { startDate: null, endDate: null };
  }

  return {
    startDate: stage.startDate ? new Date(stage.startDate) : null,
    endDate: stage.endDate ? new Date(stage.endDate) : null,
  };
}

function sortByStageDate(projects: IProject[], stageName: string): IProject[] {
  const normalizedStageName = normalizeStageName(stageName);
  
  return [...projects].sort((a, b) => {
    const stageA = a.stages?.find((s: IProjectStage) => s.stage === normalizedStageName);
    const stageB = b.stages?.find((s: IProjectStage) => s.stage === normalizedStageName);
    
    const dateA = stageA?.startDate ? new Date(stageA.startDate).getTime() : Infinity;
    const dateB = stageB?.startDate ? new Date(stageB.startDate).getTime() : Infinity;
    
    return dateA - dateB;
  });
}

function categorizeProjects(projects: IProject[], searchQuery: string, stageName: string) {
  const normalizedStageName = normalizeStageName(stageName);
  
  // Filter by search query
  const filteredData = projects.filter((project) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      project.invoice?.piNumber?.toLowerCase().includes(searchLower) ||
      project.customer?.name?.toLowerCase().includes(searchLower)
    );
  });

  // Get projects that have the specific stage
  const projectsWithStage = filteredData.filter(
    (project) => project.stages?.some((s: IProjectStage) => s.stage === normalizedStageName)
  );

  // Log for debugging
  projectsWithStage.forEach(project => {
    const stage = project.stages?.find((s: IProjectStage) => s.stage === normalizedStageName);
    console.log(`Project ${project.invoice?.piNumber}:`, {
      stageName: stage?.stage,
      startDate: stage?.startDate,
      endDate: stage?.endDate,
      isToday: stage?.startDate ? isToday(new Date(stage.startDate)) : false,
      isTomorrow: stage?.startDate ? isTomorrow(new Date(stage.startDate)) : false,
    });
  });

  // Today: projects where the stage starts today or is active today
  const todayProjects = sortByStageDate(
    projectsWithStage.filter((project) => {
      const { startDate, endDate } = getStageDates(project, stageName);
      
      if (!startDate) return false;
      
      const today = getDateWithoutTime(new Date());
      const startDateOnly = getDateWithoutTime(startDate);
      const endDateOnly = endDate ? getDateWithoutTime(endDate) : null;
      
      // Check if today is within the stage date range (inclusive)
      if (endDateOnly) {
        return startDateOnly <= today && today <= endDateOnly;
      }
      
      // If only start date exists, check if it's today
      return isToday(startDate);
    }),
    stageName
  );

  // Tomorrow: projects where the stage starts tomorrow
  const tomorrowProjects = sortByStageDate(
    projectsWithStage.filter((project) => {
      const { startDate } = getStageDates(project, stageName);
      if (startDate) {
        return isTomorrow(startDate);
      }
      return false;
    }),
    stageName
  );

  // Other: projects where the stage starts later (not today or tomorrow)
  const otherProjects = sortByStageDate(
    projectsWithStage.filter((project) => {
      const { startDate, endDate } = getStageDates(project, stageName);
      
      if (!startDate) {
        // Stage exists but has no start date yet
        return true;
      }

      const today = getDateWithoutTime(new Date());
      const startDateOnly = getDateWithoutTime(startDate);
      const endDateOnly = endDate ? getDateWithoutTime(endDate) : null;
      
      // If stage end date is in the past, it's completed - categorize as "Other"
      if (endDateOnly && endDateOnly < today) {
        return true;
      }

      // If start date is not today or tomorrow, it's "Other"
      return !isToday(startDate) && !isTomorrow(startDate);
    }),
    stageName
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
    () => categorizeProjects(projects, search, stageName),
    [projects, search, stageName]
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

  // Format the stage name for display
  const displayStageName = stageName.charAt(0).toUpperCase() + stageName.slice(1).toLowerCase().replace(/_/g, ' ');

  return (
    <div className="space-y-6 p-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <h3 className="font-medium">Today&apos;s Work</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{todayProjects.length}</p>
          <p className="text-xs text-muted-foreground">
            {displayStageName} starting today
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-orange-500" />
            <h3 className="font-medium">Tomorrow&apos;s Work</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{tomorrowProjects.length}</p>
          <p className="text-xs text-muted-foreground">
            {displayStageName} starting tomorrow
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-purple-500" />
            <h3 className="font-medium">Other Projects</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{otherProjects.length}</p>
          <p className="text-xs text-muted-foreground">
            {displayStageName} scheduled later
          </p>
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