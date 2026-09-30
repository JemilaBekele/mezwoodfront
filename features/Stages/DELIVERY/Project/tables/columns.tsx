/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays, User, FileText, Layers, Clock, CheckCircle2, AlertCircle, Package, DollarSign, Calendar, CalendarClock,  } from 'lucide-react';
import { IProject, ProjectStatus, IProjectStage, IProjectStageWorkLog } from '@/models/Projects';
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
import { SellPaymentStatus } from '@/models/Sell';

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

// Helper to check if project payment is fully paid (for projects only)
function isProjectFullyPaid(project: any): boolean {
  // Only check payment for projects (type is 'project')
  if (project.type === 'project') {
    // Check payment status from invoice
    const paymentStatus = project.invoice?.paymentStatus || project.paymentStatus;
    
    // Strictly check if payment status is PAID
    return paymentStatus === 'PAID' || paymentStatus === SellPaymentStatus.PAID;
  }
  // For sells, always return true (no payment restriction)
  return true;
}

// Helper to check if project should show payment restriction
function shouldShowPaymentRestriction(project: any): boolean {
  // Only for projects
  if (project.type !== 'project') return false;
  
  // If allowToDeliverWithBalance is true, don't show payment restriction
  if (project.allowToDeliverWithBalance) return false;
  
  // Check if payment is not fully paid
  return !isProjectFullyPaid(project);
}

// Helper to get display invoice number
function getInvoiceDisplay(project: any): string {
  if (project.type === 'sell') {
    return project.invoiceNo || 'SEL-00000';
  }
  return project.invoice?.piNumber || '-';
}

// Helper to get view URL
function getViewUrl(project: any): string {
  if (project.type === 'sell') {
    return `/dashboard/StoreOrder/view?id=${project.id}`;
  }
  return `/dashboard/Stage/delivery/view?id=${project.id}`;
}

function InvoiceSellCell({ project }: { project: any }) {
  const router = useRouter();
  const displayNumber = getInvoiceDisplay(project);
  const viewUrl = getViewUrl(project);

  return (
    <div
      className='flex items-center gap-2 cursor-pointer hover:text-primary hover:underline'
      onClick={() => router.push(viewUrl)}
    >
      {project.type === 'sell' ? (
        <Package className='h-4 w-4 text-muted-foreground' />
      ) : (
        <FileText className='h-4 w-4 text-muted-foreground' />
      )}
      <span className='font-medium'>{displayNumber}</span>
      {project.type === 'sell' && (
        <Badge variant="outline" className="text-xs ml-1">
          Sell
        </Badge>
      )}
    </div>
  );
}

export const projectColumns: ColumnDef<any>[] = [
  {
    accessorKey: 'invoice.piNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Invoice/Sell Number' />
    ),
    cell: ({ row }) => <InvoiceSellCell project={row.original} />, 
    enableColumnFilter: true
  },
  {
    accessorKey: 'customer.name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Customer' />
    ),
    cell: ({ row }) => {
      const project = row.original;
      return (
        <div className='flex items-center gap-2'>
          <User className='h-4 w-4 text-muted-foreground' />
          {project.customer?.name || '-'}
        </div>
      );
    },
    enableColumnFilter: true
  },
{
  id: 'requestedDelivery',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title='Requested' />
  ),
  cell: ({ row }) => {
    const project = row.original;

    const requestedDelivery = project.requestedDelivery
      ? new Date(project.requestedDelivery)
      : null;

    const newRequestedDelivery = project.newRequestedDelivery
      ? new Date(project.newRequestedDelivery)
      : null;

    const formatDate = (date: Date) =>
      date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

    if (!requestedDelivery && !newRequestedDelivery) {
      return <span className='text-muted-foreground'>-</span>;
    }

    return (
      <div className='flex flex-col gap-1.5 text-sm'>
        {/* Original Requested Delivery — struck through when a new date exists */}
        {requestedDelivery && (
          <div
            className={
              newRequestedDelivery
                ? 'flex items-center gap-1.5 text-muted-foreground/70'
                : 'flex items-center gap-1.5 text-muted-foreground'
            }
          >
            <CalendarDays className='h-3.5 w-3.5' />
            <span
              className={
                newRequestedDelivery
                  ? 'line-through decoration-2 decoration-muted-foreground/70'
                  : undefined
              }
              title={newRequestedDelivery ? 'Original requested date' : undefined}
            >
              {formatDate(requestedDelivery)}
            </span>
          </div>
        )}

        {/* New Requested Delivery */}
        {newRequestedDelivery && (
          <div className='flex items-center gap-1.5 font-medium'>
            <CalendarDays className='h-3.5 w-3.5' />
            <span>{formatDate(newRequestedDelivery)}</span>
          </div>
        )}
      </div>
    );
  },
  enableColumnFilter: false,
},
  
  {
    id: 'paymentStatus',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Payment Status' />
    ),
    cell: ({ row }) => {
      const project = row.original;
      
      // For projects, show payment status from invoice
      if (project.type === 'project') {
        const paymentStatus = project.invoice?.paymentStatus || project.paymentStatus || 'PENDING';
        const isPaid = paymentStatus === 'PAID' || paymentStatus === SellPaymentStatus.PAID;
        
        let variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'success' = 'secondary';
        let label = paymentStatus;
        
        if (isPaid) {
          variant = 'success';
          label = 'PAID';
        } else if (paymentStatus === 'PARTIAL' || paymentStatus === SellPaymentStatus.PARTIAL) {
          variant = 'default';
          label = 'PARTIAL';
        } else if (paymentStatus === 'PENDING' || paymentStatus === SellPaymentStatus.PENDING) {
          variant = 'destructive';
          label = 'PENDING';
        }

        return (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <Badge variant={variant as any}>
              {label}
            </Badge>
            {!isPaid && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3 text-yellow-500" />
                <span>Payment required</span>
              </div>
            )}
          </div>
        );
      }

      // For sells, show payment status
      const paymentStatus = project.paymentStatus || 'PENDING';
      const isPaid = paymentStatus === 'PAID' || paymentStatus === SellPaymentStatus.PAID;
      
      let variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'success' = 'secondary';
      let label = paymentStatus;
      
      if (isPaid) {
        variant = 'success';
        label = 'PAID';
      } else if (paymentStatus === 'PARTIAL' || paymentStatus === SellPaymentStatus.PARTIAL) {
        variant = 'default';
        label = 'PARTIAL';
      } else if (paymentStatus === 'PENDING' || paymentStatus === SellPaymentStatus.PENDING) {
        variant = 'destructive';
        label = 'PENDING';
      }

      return (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <Badge variant={variant as any}>
            {label}
          </Badge>
        </div>
      );
    }
  },



  {
    id: 'actions',
    cell: ({ row, table }) => {
      const project = row.original;
      const meta = table.options.meta as { onRefresh?: () => void };
      
      // Only apply payment restriction for PROJECTS (type is 'project')
      if (project.type === 'project') {
        const showRestriction = shouldShowPaymentRestriction(project);
        
        // If payment restriction applies, show limited actions or disable updates
        if (showRestriction) {
          return (
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                      <span>Payment required</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Full payment required before updates</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        }
      }
      
      // For sells or projects with no payment restriction, show actions
      return <ProjectCellAction data={project} onRefresh={meta?.onRefresh} />;
    }
  }
];