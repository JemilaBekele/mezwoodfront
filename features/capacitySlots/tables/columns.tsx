'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { ICapacityLot } from '@/models/CapacityLot';
import { CapacitySlotCellAction } from './cell-action'; // Adjust path as needed
import { format } from 'date-fns';

export const capacitySlotColumns: ColumnDef<ICapacityLot>[] = [
  {
    accessorKey: 'stage',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Stage' />
    ),
    cell: ({ row }) => <div>{row.original.stage}</div>,
    enableColumnFilter: true
  }, 

    {
    accessorKey: 'capacity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Capacity' />
    ),
    cell: ({ row }) => <div>{row.original.capacity}</div>,
    enableColumnFilter: true
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Last Update At' />
    ),
    cell: ({ row }) => (
      <div>{format(new Date(row.original.updatedAt), 'yyyy-MM-dd')}</div>
    ),
    enableColumnFilter: true
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <CapacitySlotCellAction data={row.original} />
  }
];
