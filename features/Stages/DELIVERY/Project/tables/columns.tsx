/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays, User, FileText, Layers, Clock, CheckCircle2, AlertCircle, Package, DollarSign, Calendar, CalendarClock } from 'lucide-react';
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
    id: 'deliveryDates',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Delivery Dates' />
    ),
    cell: ({ row }) => {
      const project = row.original;
      
      // For sells, show delivery date
      if (project.type === 'sell') {
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="h-3 w-3 text-blue-500" />
              <span className="text-muted-foreground">Delivery:</span>
              <span className="font-medium">{formatDate(project.deliveryDate)}</span>
            </div>
          </div>
        );
      }

      // For projects, show all delivery dates
      const requestedDelivery = project.requestedDelivery;
      const calculatedDelivery = project.calculatedDelivery;
      const finalDelivery = project.finalDelivery;
      
      // Get delivery stage end date
      const stage = getMetalWorksStage(project);
      const stageEndDate = stage?.endDate;

      return (
        <div className="space-y-1.5 min-w-45">
          {requestedDelivery && (
            <div className="flex items-center gap-2 text-xs">
              <CalendarDays className="h-3 w-3 text-purple-500" />
              <span className="text-muted-foreground">Requested:</span>
              <span className="font-medium">{formatDate(requestedDelivery)}</span>
            </div>
          )}
          {calculatedDelivery && (
            <div className="flex items-center gap-2 text-xs">
              <CalendarClock className="h-3 w-3 text-orange-500" />
              <span className="text-muted-foreground">Calculated:</span>
              <span className="font-medium">{formatDate(calculatedDelivery)}</span>
            </div>
          )}
          {(finalDelivery || stageEndDate) && (
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">Projected:</span>
              <span className="font-medium">{formatDate(finalDelivery || stageEndDate)}</span>
            </div>
          )}
          {!requestedDelivery && !calculatedDelivery && !finalDelivery && !stageEndDate && (
            <span className="text-muted-foreground text-sm">No dates set</span>
          )}
        </div>
      );
    }
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
    id: 'deliveryStatus',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Delivery Status' />
    ),
    cell: ({ row }) => {
      const project = row.original;
      
      if (project.type === 'sell') {
        const status = project.deliveryStatus || 'pending';
        let variant: 'default' | 'destructive' | 'outline' | 'secondary' = 'secondary';
        let icon = null;
        
        if (status === 'finished') {
          variant = 'default';
          icon = <CheckCircle2 className="h-3 w-3" />;
        } else if (status === 'partially-delivered') {
          variant = 'default';
          icon = <Clock className="h-3 w-3" />;
        } else if (status === 'pending') {
          variant = 'destructive';
          icon = <AlertCircle className="h-3 w-3" />;
        }
        
        return (
          <div className="flex items-center gap-2">
            {icon}
            <Badge variant={variant}>
              {status.replace('-', ' ').toUpperCase()}
            </Badge>
          </div>
        );
      }

      // Project delivery status
      const stage = getMetalWorksStage(project);
      if (!stage) {
        return <span className="text-muted-foreground text-sm">No delivery stage</span>;
      }

      const isCompleted = stage.finished || stage.status === 'COMPLETED';
      const progress = calculateProgress(project);
      
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : progress > 0 ? (
              <Clock className="h-4 w-4 text-yellow-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <Badge
              variant={isCompleted ? 'default' : progress > 0 ? 'default' : 'secondary'}
              className={isCompleted ? 'bg-green-500 text-white' : undefined}
            >
              {isCompleted ? 'COMPLETED' : progress > 0 ? 'IN PROGRESS' : 'NOT STARTED'}
            </Badge>
          </div>
          {!isCompleted && (
            <Progress value={progress} className="h-1.5 w-20" />
          )}
        </div>
      );
    }
  },
  {
    id: 'workProgress',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Work Progress' />
    ),
    cell: ({ row }) => {
      const project = row.original;
      
      // For sells, show delivery progress (no payment restriction)
      if (project.type === 'sell') {
        const progress = project.deliveryProgress || 0;
        const delivered = project.deliverySummary?.delivered || 0;
        const total = project.deliverySummary?.total || 0;
        
        return (
          <div className="min-w-37.5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {delivered} / {total} items
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {progress === 100 && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>All items delivered</span>
              </div>
            )}
          </div>
        );
      }

      // Project work progress - check payment
      const isPaid = isProjectFullyPaid(project);
      
      // If project payment is not fully paid, show payment pending message
      if (!isPaid) {
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span>Payment pending</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {project.invoice?.amountPaid || 0} / {project.invoice?.total || 0} paid
            </div>
          </div>
        );
      }

      const stage = getMetalWorksStage(project);
      if (!stage) {
        return <span className="text-muted-foreground text-sm">No delivery stage</span>;
      }

      const progress = calculateProgress(project);
      const planned = stage.workUnits || 0;
      const actual = stage.actualWorkUnits || 0;

      return (
        <div className="min-w-37.5 space-y-1">
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
    id: 'deliveryDetails',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Delivery Details' />
    ),
    cell: ({ row }) => {
      const project = row.original;
      
      // For sells
      if (project.type === 'sell') {
        const items = project.items || [];
        const totalItems = items.length;
        const deliveredItems = items.filter((i: any) => i.itemSaleStatus === 'DELIVERED').length;
        const pendingItems = items.filter((i: any) => i.itemSaleStatus === 'PENDING').length;
        const partialItems = items.filter((i: any) => i.itemSaleStatus === 'PARTIALLY_DELIVERED').length;
        
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <Package className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Items:</span>
              <span className="font-medium">{totalItems}</span>
            </div>
            <div className="flex gap-2 text-xs">
              {deliveredItems > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {deliveredItems} delivered
                </Badge>
              )}
              {partialItems > 0 && (
                <Badge variant="default" className="text-xs">
                  {partialItems} partial
                </Badge>
              )}
              {pendingItems > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {pendingItems} pending
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Due: {formatDate(project.deliveryDate)}
            </div>
          </div>
        );
      }

      // Project delivery details
      const stage = getMetalWorksStage(project);
      if (!stage) {
        return <span className="text-muted-foreground text-sm">No delivery stage</span>;
      }

      const startDate = stage.startDate ? formatDate(stage.startDate) : 'Not started';
      const endDate = stage.endDate ? formatDate(stage.endDate) : 'Not set';
      const planned = stage.workUnits || 0;
      const actual = stage.actualWorkUnits || 0;

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <CalendarDays className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Start:</span>
            <span>{startDate}</span>
          </div>
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
      <DataTableColumnHeader column={column} title='Recent Activity' />
    ),
    cell: ({ row }) => {
      const project = row.original;
      
      // For sells, show item delivery status
      if (project.type === 'sell') {
        const items = project.items || [];
        const recentItems = items.slice(0, 3);
        
        if (recentItems.length === 0) {
          return <span className="text-muted-foreground text-sm">No items</span>;
        }

        return (
          <div className="space-y-1">
            {recentItems.map((item: any) => (
              <div key={item.id} className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="h-5">
                  {item.item?.name || 'Item'}
                </Badge>
                <span className="text-muted-foreground">
                  {item.quantity} units
                </span>
                <Badge 
                  variant={
                    item.itemSaleStatus === 'DELIVERED' ? 'secondary' :
                    item.itemSaleStatus === 'PARTIALLY_DELIVERED' ? 'default' :
                    'destructive'
                  }
                  className="text-xs"
                >
                  {item.itemSaleStatus?.replace('_', ' ') || 'PENDING'}
                </Badge>
              </div>
            ))}
            {items.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{items.length - 3} more items
              </div>
            )}
          </div>
        );
      }

      // Project work logs
      const workLogs = getWorkLogSummary(project);
      
      if (workLogs.length === 0) {
        return <span className="text-muted-foreground text-sm">No activity yet</span>;
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
      const project = row.original;
      const meta = table.options.meta as { onRefresh?: () => void };
      
      // Only apply payment restriction for PROJECTS (type is 'project')
      if (project.type === 'project') {
        const isPaid = isProjectFullyPaid(project);
        // If project payment is not fully paid, show limited actions or disable updates
        if (!isPaid) {
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
      
      // For sells or paid projects, show actions
      return <ProjectCellAction data={project} onRefresh={meta?.onRefresh} />;
    }
  }
];