'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays } from 'lucide-react';
import { IMaterialCategory } from '@/service/materialcatagory';
import { MaterialCategoryCellAction } from './cell-action';

export const materialCategoryColumns: ColumnDef<IMaterialCategory>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Material Category Name' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<IMaterialCategory['name']>()}</div>,
    enableColumnFilter: true
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<IMaterialCategory['createdAt']>();
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
    cell: ({ row }) => <MaterialCategoryCellAction data={row.original} />
  }
];
