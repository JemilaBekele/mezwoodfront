'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays } from 'lucide-react';
import { IUnitOfMeasure } from '@/models/UnitOfMeasure';
import { UnitOfMeasureCellAction } from './cell-action';

export const unitOfMeasureColumns: ColumnDef<IUnitOfMeasure>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Unit Name' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<IUnitOfMeasure['name']>()}</div>,
    enableColumnFilter: true
  },
  {
    accessorKey: 'symbol',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Symbol' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<IUnitOfMeasure['symbol']>() || '-'}</div>
    ),
    enableColumnFilter: true
  },
  {
    accessorKey: 'base',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Base Unit' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<IUnitOfMeasure['base']>() ? 'Yes' : 'No'}</div>
    ),
    enableColumnFilter: true
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<IUnitOfMeasure['createdAt']>();
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
    cell: ({ row }) => <UnitOfMeasureCellAction data={row.original} />
  }
];
