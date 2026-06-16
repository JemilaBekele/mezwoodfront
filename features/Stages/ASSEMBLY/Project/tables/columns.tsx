/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays, User, FileText, Layers } from 'lucide-react';
import { IProject, ProjectStatus, DifficultyLevel } from '@/models/Projects';
import { ProjectCellAction } from './cell-action';
import { useRouter } from 'next/navigation';

export const projectColumns: ColumnDef<IProject>[] = [
{
  accessorKey: 'invoice.piNumber',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title='PI Number' />
  ),
  cell: ({ cell, row, table }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const router = useRouter();
    const piNumber = cell.getValue<string>();
    
    // Get the current row index
    const rowIndex = row.index;
    
    // Only allow click for first 3 projects (index 0, 1, 2)
    const isFirstThree = rowIndex < 3;

    return (
      <div
        className={`flex items-center gap-2 ${isFirstThree ? 'cursor-pointer hover:text-primary hover:underline' : ''}`}
        onClick={() => {
          if (isFirstThree) {
            router.push(
              `/dashboard/Stage/assembly/view?id=${row.original?.id}`
            );
          }
        }}
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
  id: 'actions',
  cell: ({ row, table }) => {
    // Get the current row index
    const rowIndex = row.index;
    
    // Only show actions for first 3 projects (index 0, 1, 2)
    const isFirstThree = rowIndex < 3;
    
    return isFirstThree ? <ProjectCellAction data={row.original} /> : null;
  }
}

];