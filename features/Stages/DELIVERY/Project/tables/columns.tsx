/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays, User, FileText, Layers, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { IProject, ProjectStatus, DifficultyLevel, IProjectStage, IProjectStageWorkLog } from '@/models/Projects';
import { ProjectCellAction } from './cell-action';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Helper function to get the Work stage from a project
function getMetalWorksStage(project: IProject): IProjectStage | undefined {
  return project.stages?.find(
    (stage: IProjectStage) => stage.stage === ProjectStatus.DELIVERY
  );
}

// Helper to format date
function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Helper to get work log summary (max 3)
function getWorkLogSummary(project: IProject): IProjectStageWorkLog[] {
  const stage = getMetalWorksStage(project);
  if (!stage?.projectStageWorkLogs) return [];
  
  // Sort by createdAt descending and take first 3
  return [...stage.projectStageWorkLogs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
}

// Helper to calculate progress percentage
function calculateProgress(project: IProject): number {
  const stage = getMetalWorksStage(project);
  if (!stage) return 0;
  
  const planned = stage.workUnits || 0;
  const actual = stage.actualWorkUnits || 0;
  
  if (planned === 0) return 0;
  return Math.min(Math.round((actual / planned) * 100), 100);
}

export const projectColumns: ColumnDef<IProject>[] = [
  {
    accessorKey: 'invoice.piNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='PI Number' />
    ),
    cell: ({ cell, row }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const router = useRouter();
      const piNumber = cell.getValue<string>();
  
      return (
        <div
          className='flex items-center gap-2 cursor-pointer hover:text-primary hover:underline'
          onClick={() =>
            router.push(
              `/dashboard/Stage/delivery/view?id=${row.original?.id}`
            )
          }
        >
          <FileText className='h-4 w-4 text-muted-foreground' />
          <span className='font-medium'>{piNumber || '-'}</span>
        </div>
      );
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'customer.name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Customer' />
    ),
    cell: ({ cell }) => (
      <div className='flex items-center gap-2'>
        <User className='h-4 w-4 text-muted-foreground' />
        {cell.getValue<string>() || '-'}
      </div>
    ),
    enableColumnFilter: true
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Project Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<ProjectStatus>();
      return (
        <div className='capitalize'>
          {status?.replace(/_/g, ' ') || '-'}
        </div>
      );
    },
    enableColumnFilter: true
  },
  {
    id: 'metalWorksProgress',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Work Progress' />
    ),
    cell: ({ row }) => {
      const project = row.original;
      const stage = getMetalWorksStage(project);
      const progress = calculateProgress(project);
      
      if (!stage) {
        return <span className="text-muted-foreground text-sm">No Work stage</span>;
      }

      const planned = stage.workUnits || 0;
      const actual = stage.actualWorkUnits || 0;

      return (
        <div className="min-w-[150px] space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {actual} / {planned} units
            </span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          {progress === 100 && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              <span>Completed</span>
            </div>
          )}
        </div>
      );
    }
  },
  {
    id: 'metalWorksDetails',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Stage Details' />
    ),
    cell: ({ row }) => {
      const project = row.original;
      const stage = getMetalWorksStage(project);
      
      if (!stage) {
        return <span className="text-muted-foreground text-sm">No Work stage</span>;
      }

      const startDate = stage.startDate ? formatDate(stage.startDate) : 'Not started';
      const endDate = stage.endDate ? formatDate(stage.endDate) : 'Not set';
      const planned = stage.workUnits || 0;
      const actual = stage.actualWorkUnits || 0;

      return (
        <div className="space-y-1">
          {/* <div className="flex items-center gap-2 text-xs">
            <CalendarDays className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Start:</span>
            <span>{startDate}</span>
          </div> */}
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">End:</span>
            <span>{endDate}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Layers className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Units:</span>
            <span className="font-medium">{actual} / {planned}</span>
          </div>
          {stage.status && (
            <Badge variant={stage.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-xs">
              {stage.status.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>
      );
    }
  },
  {
    id: 'recentWorkLogs',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Recent Work Logs' />
    ),
    cell: ({ row }) => {
      const project = row.original;
      const workLogs = getWorkLogSummary(project);
      
      if (workLogs.length === 0) {
        return <span className="text-muted-foreground text-sm">No work logs yet</span>;
      }

      return (
        <div className="space-y-2">
          <TooltipProvider>
            {workLogs.map((log, index) => (
              <Tooltip key={log.id}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-xs p-1 rounded hover:bg-muted/50 cursor-pointer">
                    <Badge variant="outline" className="h-5">
                      +{log.doneUnits} units
                    </Badge>
                    {log.hours && (
                      <span className="text-muted-foreground">
                        {log.hours}h
                      </span>
                    )}
                    {log.doneBy?.name && (
                      <span className="text-muted-foreground">
                        by {log.doneBy.name}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs space-y-1">
                    <p className="font-medium">Work Log Entry</p>
                    <p className="text-xs text-muted-foreground">
                      Date: {new Date(log.createdAt).toLocaleString()}
                    </p>
                    {log.note && (
                      <p className="text-xs">{log.note}</p>
                    )}
                    <p className="text-xs">
                      Units: {log.doneUnits}
                      {log.hours && ` | Hours: ${log.hours}h`}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
          {workLogs.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Showing last {workLogs.length} log{workLogs.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      );
    }
  },
 {
   id: 'actions',
   cell: ({ row, table }) => {
     // Get the refresh function from table meta
     const meta = table.options.meta as { onRefresh?: () => void };
     return <ProjectCellAction data={row.original} onRefresh={meta?.onRefresh} />;
   }
 }
];