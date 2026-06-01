'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays } from 'lucide-react';

import { ICurtainOrder } from '@/models/curtainType';
import { useRouter } from 'next/navigation';
import { DeliverCurtainOrderCellAction } from './delivercellaction';


const getCurtainStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'DELIVERED':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'PENDING':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};
export const DelivercurtainOrderColumns: ColumnDef<ICurtainOrder>[] = [
{
  accessorKey: 'code',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title='Order Code' />
  ),
  cell: ({ cell, row }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const router = useRouter();
    const code = cell.getValue<string>();

    return (
      <div
        className='cursor-pointer hover:text-primary hover:underline'
        onClick={() =>
          router.push(`/dashboard/CurtainOrder/view?id=${row.original.id}`)
        }
      >
        {code ?? '-'}
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
    cell: ({ row }) => (
      <div>{row.original.customer?.name ?? '-'}</div>
    ),
    enableColumnFilter: true
  }, 
  {
    accessorKey: 'movementType.name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Movement Type' />
    ),
    cell: ({ row }) => (
      <div>{row.original.movementType?.name ?? '-'}</div>
    ),
    enableColumnFilter: true
  },
  {
    accessorKey: 'isSiteMeasured',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Site Measured' />
    ),
    cell: ({ cell }) => (
      <div className='capitalize'>
        {cell.getValue<boolean>() ? 'Yes' : 'No'}
      </div>
    ),
    enableColumnFilter: true
  },
  {
    accessorKey: 'totalAmount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Total Amount' />
    ),
    cell: ({ cell }) => {
      const value = cell.getValue<number | undefined>();
      return <div>{value ? value.toLocaleString() : '-'}</div>;
    },
    enableColumnFilter: false
  },
  {
    accessorKey: 'issueDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Issue Date' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<string | undefined>();
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
  accessorKey: 'curtainStatus',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title='Curtain Status' />
  ),
  cell: ({ row }) => {
    const status = row.original.curtainStatus;

    return (
      <div
        className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${getCurtainStatusColor(
          status
        )}`}
      >
        {status}
      </div>
    );
  },
  enableColumnFilter: true
},

{
  accessorKey: 'paymentStatus',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title='Payment Status' />
  ),
  cell: ({ row }) => {
    const status = row.original.paymentStatus;

    return (
      <div
        className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${getPaymentStatusColor(
          status
        )}`}
      >
        {status}
      </div>
    );
  },
  enableColumnFilter: true
},
  {
    id: 'actions',
    cell: ({ row }) => (
      <DeliverCurtainOrderCellAction data={row.original} />
    )
  }
];
