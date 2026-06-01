'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays } from 'lucide-react';

import { MovementTypeCellAction } from './cell-action';
import { IMovementType } from '@/models/curtainType';

export const movementTypeColumns: ColumnDef<IMovementType>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Movement Type Name' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<IMovementType['name']>()}</div>,
    enableColumnFilter: true
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<IMovementType['createdAt']>();
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
      <MovementTypeCellAction data={row.original} />
    )
  }
];
