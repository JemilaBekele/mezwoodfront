'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays } from 'lucide-react';

import { CurtainTypeCellAction } from './cell-action';
import { ICurtainType } from '@/models/curtainType';

export const curtainTypeColumns: ColumnDef<ICurtainType>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Curtain Type Name' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<ICurtainType['name']>()}</div>,
    enableColumnFilter: true
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<ICurtainType['createdAt']>();
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
      <CurtainTypeCellAction data={row.original} />
    )
  }
];
