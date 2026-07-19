'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/ui/table/refereshdatatable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CalendarDays, CalendarClock, RefreshCw } from 'lucide-react';
import { IProject } from '@/models/Projects';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

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

// Get delivery date from project or sell
function getDeliveryDate(project: any): Date | null {
  // Check if it's a sell type (has deliveryDate directly)
  if (project.type === 'sell' && project.deliveryDate) {
    return new Date(project.deliveryDate);
  }
  
  // Check if it's a project type with requestedDelivery
  if (project.type === 'project' && project.requestedDelivery) {
    return new Date(project.requestedDelivery);
  }
  
  // Fallback: check if project has calculatedDelivery
  if (project.calculatedDelivery) {
    return new Date(project.calculatedDelivery);
  }
  
  return null;
}

function sortByDeliveryDate(projects: any[]): any[] {
  return [...projects].sort((a, b) => {
    const dateA = getDeliveryDate(a);
    const dateB = getDeliveryDate(b);
    
    // If both have dates, compare them
    if (dateA && dateB) {
      return dateA.getTime() - dateB.getTime();
    }
    
    // Put items without dates at the end
    if (dateA) return -1;
    if (dateB) return 1;
    
    return 0;
  });
}

function categorizeProjects(projects: any[], searchQuery: string) {
  // Filter by search query
  const filteredData = projects.filter((project) => {
    const searchLower = searchQuery.toLowerCase();
    const customerName = project.customer?.name?.toLowerCase() || '';
    const invoiceNo = project.invoice?.piNumber?.toLowerCase() || '';
    const invoiceNo2 = project.invoiceNo?.toLowerCase() || '';
    
    return (
      invoiceNo.includes(searchLower) ||
      invoiceNo2.includes(searchLower) ||
      customerName.includes(searchLower)
    );
  });

  // Sort projects by delivery date
  const sortedProjects = sortByDeliveryDate(filteredData);

  // Categorize by date
  const todayProjects = sortedProjects.filter((project) => {
    const date = getDeliveryDate(project);
    if (!date) return false;
    return isToday(date);
  });

  const tomorrowProjects = sortedProjects.filter((project) => {
    const date = getDeliveryDate(project);
    if (!date) return false;
    return isTomorrow(date);
  });

  const otherProjects = sortedProjects.filter((project) => {
    const date = getDeliveryDate(project);
    if (!date) return true; // No date -> other
    return !isToday(date) && !isTomorrow(date);
  });

  return { todayProjects, tomorrowProjects, otherProjects };
}

export function StageProjectListing({
  projects,
  projectColumns,
  stageName,
  emptyStateMessages = {
    today: 'No deliveries due today',
    tomorrow: 'No deliveries due tomorrow',
    other: 'No other deliveries found'
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
    () => categorizeProjects(projects, search),
    [projects, search]
  );

  const defaultTab = todayProjects.length > 0 ? 'today' : tomorrowProjects.length > 0 ? 'tomorrow' : 'other';

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

  const renderProjectTable = (projectsList: any[]) => {
    const startIndex = (page - 1) * limit;
    const paginatedData = projectsList.slice(startIndex, startIndex + limit);

    return (
      <DataTable
        data={paginatedData}
        totalItems={projectsList.length}
        columns={projectColumns}
        meta={{ onRefresh }}
      />
    );
  };

  // Format the stage name for display
  const displayStageName = stageName.charAt(0).toUpperCase() + stageName.slice(1).toLowerCase().replace(/_/g, ' ');

  return (
    <div className="space-y-6 p-4">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{displayStageName}</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage {displayStageName.toLowerCase()} deliveries
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
            <h3 className="font-medium">Today&apos;s Deliveries</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{todayProjects.length}</p>
          <p className="text-xs text-muted-foreground">
            {displayStageName} due today
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-orange-500" />
            <h3 className="font-medium">Tomorrow&apos;s Deliveries</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">{tomorrowProjects.length}</p>
          <p className="text-xs text-muted-foreground">
            {displayStageName} due tomorrow
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-purple-500" />
            <h3 className="font-medium">Other Deliveries</h3>
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