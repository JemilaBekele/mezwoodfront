'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays, Hash } from 'lucide-react';
import { ITransfer } from '@/models/transfer';
import { TransferCellAction } from './cell-action';
import { useRouter } from 'next/navigation';

// ✅ Transfer Table Columns
// ✅ Transfer Table Columns
export const transferColumns: ColumnDef<ITransfer>[] = [
 {
    accessorKey: 'shortCode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Short Code' />
    ),
    cell: ({ cell, row }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const router = useRouter();
      const shortCode = cell.getValue<ITransfer['shortCode']>();
      
      return (
        <div 
          className='flex items-center gap-1 cursor-pointer hover:text-primary hover:underline'
          onClick={() => router.push(`/dashboard/Transfer/view?id=${row.original.id}`)}
        >
          <Hash className='h-3 w-3 text-gray-500' />
          <span className='font-medium'>{shortCode ?? '-'}</span>
        </div>
      );
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'reference',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Reference' />
    ),
    cell: ({ cell }) => (
      <div>{cell.getValue<ITransfer['reference']>() ?? '-'}</div>
    ),
    enableColumnFilter: true
  },
  {
    accessorKey: 'source',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Source' />
    ),
    cell: ({ row }) => {
      const data = row.original;
      return (
        <div className='flex flex-col'>
          <div className='font-medium'>
            {data.sourceType === 'STORE'
              ? data.sourceStore?.name || '-'
              : data.sourceShop?.name || '-'}
          </div>
          <div className='text-muted-foreground text-xs'>
            {data.sourceType.charAt(0) + data.sourceType.slice(1).toLowerCase()}
          </div>
        </div>
      );
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'destination',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Destination' />
    ),
    cell: ({ row }) => {
      const data = row.original;
      return (
        <div className='flex flex-col'>
          <div className='font-medium'>
            {data.destinationType === 'STORE'
              ? data.destStore?.name || '-'
              : data.destShop?.name || '-'}
          </div>
          <div className='text-muted-foreground text-xs'>
            {data.destinationType.charAt(0) +
              data.destinationType.slice(1).toLowerCase()}
          </div>
        </div>
      );
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<ITransfer['status']>();
      return (
        <span
          className={`rounded px-2 py-1 text-xs font-medium ${
            status === 'COMPLETED'
              ? 'bg-green-100 text-green-700'
              : status === 'CANCELLED'
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {status}
        </span>
      );
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'createdBy',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Initiated By' />
    ),
    cell: ({ row }) => {
      const createdBy = row.original.createdBy;
      return (
        <div>
          {createdBy ? (
            <div className='flex flex-col'>
              <div className='font-medium'>{createdBy.name}</div>
            </div>
          ) : (
            <div className='text-muted-foreground'>-</div>
          )}
        </div>
      );
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'updatedBy',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Approved By' />
    ),
    cell: ({ row }) => {
      const updatedBy = row.original.updatedBy;
      return (
        <div>
          {updatedBy ? (
            <div className='flex flex-col'>
              <div className='font-medium'>{updatedBy.name}</div>
            </div>
          ) : (
            <div className='text-muted-foreground'>-</div>
          )}
        </div>
      );
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<ITransfer['createdAt']>();
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
    cell: ({ row }) => <TransferCellAction data={row.original} />
  }
];
