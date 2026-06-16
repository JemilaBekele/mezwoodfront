'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays } from 'lucide-react';

import { ISize } from '@/models/productConfiguration';
import { SizeCellAction } from './cell-action';

export const sizeColumns: ColumnDef<ISize>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Size Name' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<ISize['name']>()}</div>,
    enableColumnFilter: true
  },

  // ✅ NEW CATEGORY COLUMN
  {
    accessorKey: 'category.name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Category' />
    ),
    cell: ({ row }) => (
      <div>
        {row.original.category?.name || '-'}
      </div>
    ),
    enableColumnFilter: true
  },

  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<ISize['createdAt']>();
      return (
        <div className='text-muted-foreground flex items-center gap-1 text-sm'>
          <CalendarDays className='h-4 w-4' />
          {date ? new Date(date).toLocaleDateString() : '-'}
        </div>
      );
    },
    enableColumnFilter: false
  },

  {
    id: 'actions',
    cell: ({ row }) => <SizeCellAction data={row.original} />
  }
];