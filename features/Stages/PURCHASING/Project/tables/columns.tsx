/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays, User, FileText } from 'lucide-react';
import { IProject, ProjectStatus } from '@/models/Projects';
import { ProjectCellAction } from './cell-action';
import { useRouter } from 'next/navigation';

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
                `/dashboard/Stage/Purchase/view?id=${row.original?.id}`
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
      return (
        <span className='text-muted-foreground'>
          -
        </span>
      );
    }

    return (
      <div className='flex flex-col gap-1.5 text-sm'>
        {/* Original Requested Delivery */}
        {requestedDelivery && (
          <div className='flex items-center gap-1.5 text-muted-foreground'>
            <CalendarDays className='h-3.5 w-3.5' />
            <span>{formatDate(requestedDelivery)}</span>
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
    accessorKey: 'calculatedDelivery',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Calculated Delivery' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<Date | null>();
      return (
        <div className='flex items-center gap-1 text-sm text-muted-foreground'>
          <CalendarDays className='h-4 w-4' />
          {date ? new Date(date).toLocaleDateString() : '-'}
        </div>
      );
    },
    enableColumnFilter: false 
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<Date>();
      return (
        <div className='flex items-center gap-1 text-sm text-muted-foreground'>
          <CalendarDays className='h-4 w-4' />
          {date ? new Date(date).toLocaleDateString() : '-'}
        </div>
      );
    },
    enableColumnFilter: false
  },

{
  id: 'actions',
  cell: ({ row }) => <ProjectCellAction data={row.original} />
}

];
