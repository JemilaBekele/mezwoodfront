'use client';

import { ColumnDef } from '@tanstack/react-table';
import { IShowroom } from '@/models/showroom';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { ShowroomCellAction } from './cell-action';

export const showroomColumns: ColumnDef<IShowroom>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => <div>{row.original.name}</div>,
    enableColumnFilter: true
  },

  {
    accessorKey: 'isMain',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Main Showroom" />
    ),
    cell: ({ row }) => (
      <div>
        {row.original.isMain ? 'Yes' : 'No'}
      </div>
    ),
    enableColumnFilter: true
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <ShowroomCellAction data={row.original} />
  }
];