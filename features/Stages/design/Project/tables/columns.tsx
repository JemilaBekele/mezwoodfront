/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays, User, FileText, Layers, CheckCircle, PenTool } from 'lucide-react';
import { IProject, ProjectStatus, DifficultyLevel, DesignStatus } from '@/models/Projects';
import { ProjectCellAction } from './cell-action';
import { useRouter } from 'next/navigation';

export const projectColumns= (
  reload?: () => Promise<void>
): ColumnDef<IProject>[] => [
  
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
               `/dashboard/Stage/Design/view?id=${row.original?.id}`
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

  /* ===============================
      NEW DESIGN STATUS COLUMN
  =============================== */

  {
    accessorKey: 'designStatus',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Design Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<DesignStatus>();

      return (
        <div className='flex items-center gap-2 capitalize'>
          <PenTool className='h-4 w-4 text-muted-foreground' />
          {status?.replace(/_/g, ' ') || '-'}
        </div>
      );
    },
    enableColumnFilter: true
  },

  /* ===============================
      DESIGN FINISHED DATE
  =============================== */

  {
    accessorKey: 'designFinished',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Design Finished' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<Date | null>();

      return (
        <div className='flex items-center gap-1 text-sm text-muted-foreground'>
          <CheckCircle className='h-4 w-4' />
          {date ? new Date(date).toLocaleDateString() : '-'}
        </div>
      );
    },
    enableColumnFilter: false
  },
  {
    accessorKey: 'difficulty',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Difficulty' />
    ),
    cell: ({ cell }) => {
      const difficulty = cell.getValue<DifficultyLevel>();
      return (
        <div className='flex items-center gap-2 capitalize'>
          <Layers className='h-4 w-4 text-muted-foreground' />
          {difficulty?.toLowerCase() || 'easy'}
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
  accessorKey: 'totalDays',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Total Days" />
  ),
  cell: ({ cell }) => {
    const value = cell.getValue<number | null>();

    return (
      <div className="flex items-center gap-1 text-sm font-medium">
        {value ?? 0}
      </div>
    );
  },
  enableColumnFilter: false,
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
  cell: ({ row }) => (
    <ProjectCellAction data={row.original} reload={reload!} />
  )
}

];
