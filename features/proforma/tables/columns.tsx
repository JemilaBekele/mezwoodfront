'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { ProformaCellAction } from './cell-action';
import { IProforma, ProformaStatus } from '@/models/proforma';
import { Badge } from '@/components/ui/badge';

export const proformaColumns: ColumnDef<IProforma>[] = [
  {
    accessorKey: 'proformaNo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Proforma No' />
    ),
    cell: ({ cell }) => (
      <div className='font-medium'>
        {cell.getValue<IProforma['proformaNo']>()}
      </div>
    ),
    enableColumnFilter: true
  },

  {
    accessorKey: 'customer',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Customer' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<IProforma['customer']>()?.name || '-'}</div>
    ),
    enableColumnFilter: true
  },


  {
    accessorKey: 'proformaDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Date' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<IProforma['proformaDate']>();
      return <div>{date ? new Date(date).toLocaleDateString() : '-'}</div>;
    },
    enableColumnFilter: true
  },

  {
    accessorKey: 'validUntil',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Valid Until' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<IProforma['validUntil']>();
      return <div>{date ? new Date(date).toLocaleDateString() : '-'}</div>;
    },
    enableColumnFilter: true
  },

  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<ProformaStatus>();

      const statusColors: Record<ProformaStatus, string> = {
        PENDING: 'bg-yellow-500 text-white',
        APPROVED: 'bg-green-500 text-white',
        REJECTED: 'bg-red-500 text-white',
        CONVERTED: 'bg-blue-500 text-white',
        EXPIRED: 'bg-gray-500 text-white'
      };

      return <Badge className={statusColors[status]}>{status}</Badge>;
    },
    enableColumnFilter: true
  },

  {
    accessorKey: 'grandTotal',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Total Price' />
    ),
    cell: ({ cell }) => (
      <div className='font-medium'>
        {cell.getValue<number>().toFixed(2)}
      </div>
    )
  },

  {
    accessorKey: 'totalProducts',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Total Product' />
    ),
    cell: ({ cell }) => (
      <div className='font-medium'>{cell.getValue<number>()}</div>
    )
  },

  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <ProformaCellAction data={row.original} />
  }
];