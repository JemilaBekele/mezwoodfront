'use client';

import { projectColumns } from './tables/columns';
import { mygetdesignProjects } from '@/service/Stages';
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/ui/table/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CalendarDays, CalendarClock, Filter, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { IProject } from '@/models/Projects';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  showDesignFinishedFilter?: boolean;
  onToggleFilter?: () => void;
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
  showDesignFinishedFilter = false,
  onToggleFilter
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

  // Calculate the correct count for "Total Design Finished"
  const totalDesignFinishedCount = useMemo(() => {
    // When filter is ON, projects already contains only DESIGN_FINISHED
    // When filter is OFF, count DESIGN_FINISHED from allProjects
    if (showDesignFinishedFilter) {
      return projects.length;
    } else {
      return allProjects.filter(p => p.designStatus === 'DESIGN_FINISHED').length;
    }
  }, [allProjects, projects, showDesignFinishedFilter]);

  const renderProjectTable = (projectsList: IProject[]) => {
    const startIndex = (page - 1) * limit;
    const paginatedData = projectsList.slice(startIndex, startIndex + limit);

    return (
      <DataTable
        data={paginatedData}
        totalItems={projectsList.length}
        columns={projectColumns(reload)}
      />
    );
  };

  return (
    <div className="space-y-6 p-4">
      {/* Filter Button and Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filter:</span>
          {showDesignFinishedFilter ? (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              DESIGN_FINISHED
              <span 
                className="ml-1 cursor-pointer hover:text-white/80"
                onClick={onToggleFilter}
              >
                <X className="h-3 w-3" />
              </span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              No filter
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {showDesignFinishedFilter 
              ? `Showing ${projects.length} project${projects.length !== 1 ? 's' : ''} with completed design`
              : `Showing all ${projects.length} project${projects.length !== 1 ? 's' : ''}`
            }
          </span>
        </div>
        <Button
          variant={showDesignFinishedFilter ? "default" : "outline"}
          size="sm"
          onClick={onToggleFilter}
          className={showDesignFinishedFilter ? "bg-green-500 hover:bg-green-600" : ""}
        >
          {showDesignFinishedFilter ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Show All
            </>
          ) : (
            <>
              <Filter className="h-4 w-4 mr-2" />
              Show DESIGN_FINISHED
            </>
          )}
        </Button>
      </div>

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
  const [projects, setProjects] = useState<IProject[]>([]);
  const [allProjects, setAllProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDesignFinishedFilter, setShowDesignFinishedFilter] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const result = await mygetdesignProjects({ 
        status: 'not-finished'
      });
      
      setAllProjects(result.projects);
      
      // Apply filter if active
      if (showDesignFinishedFilter) {
        const filteredProjects = result.projects.filter(
          (project: IProject) => project.designStatus === 'DESIGN_FINISHED'
        );
        setProjects(filteredProjects);
      } else {
        setProjects(result.projects);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load my design projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFilter = () => {
    const newFilterState = !showDesignFinishedFilter;
    setShowDesignFinishedFilter(newFilterState);
    
    if (newFilterState) {
      // Apply filter
      const filtered = allProjects.filter(
        (project: IProject) => project.designStatus === 'DESIGN_FINISHED'
      );
      setProjects(filtered);
    } else {
      // Show all
      setProjects(allProjects);
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
      projects={projects}
      allProjects={allProjects}
      projectColumns={projectColumns}
      stageName="My Design"
      reload={fetchProjects}
      showDesignFinishedFilter={showDesignFinishedFilter}
      onToggleFilter={handleToggleFilter}
      emptyStateMessages={{
        today: 'No my design projects due today',
        tomorrow: 'No my design projects due tomorrow',
        other: 'No other my design projects found'
      }}
    />
  );
}