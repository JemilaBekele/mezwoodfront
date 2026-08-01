'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/error-boundaries */
import { useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/ui/table/refereshdatatable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CalendarDays, CalendarClock, RefreshCw, Lock, AlertCircle } from 'lucide-react';
import { IProject, IProjectStage } from '@/models/Projects';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StageProjectListingProps {
  projects: IProject[];
  projectColumns: any;
  stageName: string;
  emptyStateMessages?: {
    today?: string;
    tomorrow?: string;
    other?: string;
  };
  onRefresh?: () => void;
  isLoading?: boolean;
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
  },
  onRefresh,
  isLoading = false,
}: StageProjectListingProps) {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page') || 1);
  const search = searchParams.get('q') || '';
  const limit = Number(searchParams.get('limit') || 10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { todayProjects, tomorrowProjects, otherProjects } = useMemo(
    () => categorizeProjects(projects, search, stageName),
    [projects, search, stageName]
  );

  // Determine if we should lock the "Other" tab
  // Lock other projects if there are ANY today OR tomorrow projects
  const hasTodayProjects = todayProjects.length > 0;
  const hasTomorrowProjects = tomorrowProjects.length > 0;
  const hasOtherProjects = otherProjects.length > 0;
  
  // Lock "Other" projects if there are projects in Today OR Tomorrow
  const shouldLockOther = (hasTodayProjects || hasTomorrowProjects) && hasOtherProjects;
  
  // Always show the "Other" tab if there are other projects
  const showOtherTab = hasOtherProjects;

  // Default tab logic:
  // 1. If there are today projects, show today
  // 2. Else if there are tomorrow projects, show tomorrow
  // 3. Else if there are other projects, show other
  // 4. Otherwise, show today (which will show empty state)
  const defaultTab = hasTodayProjects ? 'today' : 
                     hasTomorrowProjects ? 'tomorrow' : 
                     hasOtherProjects ? 'other' : 'today';

  // Check if there are any projects at all
  const hasAnyProjects = projects.length > 0;

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Modify columns to disable interactions for other projects
  const getDisabledColumns = (isDisabled: boolean) => {
    if (!isDisabled) return projectColumns;
    
    // Get columns - handle both function and array cases
    const columns = typeof projectColumns === 'function' ? projectColumns() : projectColumns;
    
    if (!columns || !Array.isArray(columns)) {
      return projectColumns;
    }
    
    // Return columns with disabled interactions
    return columns.map((col: any) => {
      // Skip if no cell renderer
      if (!col) return col;
      
      // Create a new column object with disabled properties
      const newCol = { ...col };
      
      // If there's an actions column or clickable column
      if (col.id === 'actions' || col.actions) {
        newCol.cell = ({ row }: any) => {
          // Return a disabled version of the actions
          return (
            <div className="relative group">
              <div className="opacity-60 pointer-events-none select-none">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">🔒 Locked</span>
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute inset-0 cursor-not-allowed" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Complete today&apos;s and tomorrow&apos;s work first</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        };
        newCol.className = 'cursor-not-allowed';
        return newCol;
      }
      
      // For regular columns, wrap the cell renderer
      if (col.cell) {
        const originalCell = col.cell;
        newCol.cell = ({ row }: any) => {
          try {
            const content = originalCell({ row });
            return (
              <div className="relative group">
                <div className="opacity-60 pointer-events-none select-none">
                  {content}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute inset-0 cursor-not-allowed" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This project is locked. Please work on today&apos;s or tomorrow&apos;s projects first.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            );
          } catch (error) {
            // Fallback if the cell renderer fails
            return (
              <div className="opacity-60 pointer-events-none select-none">
                <span className="text-muted-foreground">Locked</span>
              </div>
            );
          }
        };
        newCol.className = 'cursor-not-allowed';
        return newCol;
      }
      
      // For columns without cell renderer, use accessor
      if (col.accessorKey || col.id) {
        const accessorKey = col.accessorKey || col.id;
        newCol.cell = ({ row }: any) => {
          try {
            const value = row?.getValue ? row.getValue(accessorKey) : null;
            return (
              <div className="relative group">
                <div className="opacity-60 pointer-events-none select-none">
                  {value !== undefined && value !== null ? String(value) : '-'}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute inset-0 cursor-not-allowed" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This project is locked. Please work on today&apos;s or tomorrow&apos;s projects first.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            );
          } catch (error) {
            return (
              <div className="opacity-60 pointer-events-none select-none">
                <span className="text-muted-foreground">-</span>
              </div>
            );
          }
        };
        newCol.className = 'cursor-not-allowed';
        return newCol;
      }
      
      // Fallback for any other column type
      return {
        ...col,
        className: 'opacity-60 pointer-events-none select-none',
      };
    });
  };

  const renderProjectTable = (projectsList: IProject[], isDisabled: boolean = false) => {
    const startIndex = (page - 1) * limit;
    const paginatedData = projectsList.slice(startIndex, startIndex + limit);
    
    const columns = getDisabledColumns(isDisabled);

    // If disabled, render with overlay
    if (isDisabled) {
      return (
        <div className="relative">
          <DataTable
            data={paginatedData}
            totalItems={projectsList.length}
            columns={columns}
            meta={{ onRefresh, isDisabled }}
          />
          <div className="absolute inset-0 bg-black/5 pointer-events-none z-10 rounded-lg flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Projects locked until today&apos;s and tomorrow&apos;s work is completed
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <DataTable
        data={paginatedData}
        totalItems={projectsList.length}
        columns={columns}
        meta={{ onRefresh, isDisabled }}
      />
    );
  };

  // Format the stage name for display
  const displayStageName = stageName.charAt(0).toUpperCase() + stageName.slice(1).toLowerCase().replace(/_/g, ' ');

  // If there are no projects at all, show a message
  if (!hasAnyProjects) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{displayStageName}</h1>
            <p className="text-sm text-muted-foreground">
              Track and manage {displayStageName.toLowerCase()} projects
            </p>
          </div>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Projects Found</AlertTitle>
          <AlertDescription>
            There are no {displayStageName.toLowerCase()} projects available to work on.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If there are projects but no stage projects, show a message
  if (!hasTodayProjects && !hasTomorrowProjects && !hasOtherProjects) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{displayStageName}</h1>
            <p className="text-sm text-muted-foreground">
              Track and manage {displayStageName.toLowerCase()} projects
            </p>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
              {isRefreshing || isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No {displayStageName} Projects</AlertTitle>
          <AlertDescription>
            There are no {displayStageName.toLowerCase()} projects available to work on.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 p-4">
        {/* Header with Refresh Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{displayStageName}</h1>
            <p className="text-sm text-muted-foreground">
              Track and manage {displayStageName.toLowerCase()} projects
            </p>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
              {isRefreshing || isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>

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
              renderProjectTable(todayProjects, false)
            )}
          </TabsContent>

          <TabsContent value="tomorrow" className="space-y-4">
            {tomorrowProjects.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
                <CalendarDays className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">{emptyStateMessages.tomorrow}</p>
              </div>
            ) : (
              renderProjectTable(tomorrowProjects, false)
            )}
          </TabsContent>

          <TabsContent value="other" className="space-y-4">
            {otherProjects.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed">
                <CalendarClock className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">{emptyStateMessages.other}</p>
              </div>
            ) : (
              renderProjectTable(otherProjects, shouldLockOther)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}