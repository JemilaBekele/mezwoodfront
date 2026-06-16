/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { IProformaInvoice, PIStatus } from '@/models/ProformaInvoice';
import { ProformaInvoiceCellAction } from './cell-action';
import { useRouter } from 'next/navigation';

const statusMap: Record<string, { label: string; cls: string }> = {
  PENDING_ST: { label: 'Pending', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  APPROVED_ST: { label: 'Approved', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  SENT_TO_CLIENT: { label: 'Sent', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  REVISION: { label: 'Revision', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  APPROVED_CLIENT: { label: 'Client OK', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  APPROVED_CREATE_PROJECT: { label: 'Project', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

const paymentMap: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-amber-100/60 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  PARTIAL: { label: 'Partial', cls: 'bg-orange-100/60 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' },
  PAID: { label: 'Paid', cls: 'bg-emerald-100/60 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-100/60 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
  NONE: { label: 'None', cls: 'bg-muted text-muted-foreground' },
};

export const proformaInvoiceColumns: ColumnDef<IProformaInvoice>[] = [
  {
    accessorKey: 'piNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title='PI Number' />,
    cell: ({ cell, row }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const router = useRouter();
      const piNumber = cell.getValue<IProformaInvoice['piNumber']>();
      return (
        <button
          className='inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline underline-offset-4'
          onClick={() => router.push(`/dashboard/ProformaInvoice/view?id=${row.original.id}`)}
        >
          <Hash className='h-3 w-3 opacity-40' />
          {piNumber ?? '-'}
        </button>
      );
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'customer.name',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Customer' />,
    cell: ({ cell }) => {
      const name = cell.getValue<string>();
      return (
        <div className='flex items-center gap-2'>
          <div className='flex h-6 w-6 items-center justify-center rounded-md bg-muted text-[10px] font-bold uppercase text-muted-foreground'>
            {name ? name.charAt(0) : '?'}
          </div>
          <span className='text-sm font-medium truncate max-w-[180px]'>{name || '-'}</span>
        </div>
      );
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    cell: ({ cell }) => {
      const status = cell.getValue<PIStatus>();
      const v = statusMap[status] || { label: String(status).replace(/_/g, ' '), cls: 'bg-muted text-muted-foreground' };
      return (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${v.cls}`}>
          {v.label}
        </span>
      );
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'paymentStatus',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Payment' />,
    cell: ({ cell }) => {
      const status = cell.getValue<string>();
      const v = paymentMap[status] || { label: status || '-', cls: 'bg-muted text-muted-foreground' };
      return (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${v.cls}`}>
          {v.label}
        </span>
      );
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'total',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Total' />,
    cell: ({ cell }) => {
      const total = cell.getValue<number>();
      return (
        <span className='text-sm font-semibold tabular-nums'>
          {total != null ? total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
        </span>
      );
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Created' />,
    cell: ({ cell }) => {
      const date = cell.getValue<IProformaInvoice['createdAt']>();
      if (!date) return <span className='text-muted-foreground text-sm'>-</span>;
      const d = new Date(date);
      return (
        <span className='text-sm text-muted-foreground'>
          {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      );
    },
    enableColumnFilter: false,
  },
  {
    id: 'actions',
    header: () => <span className='sr-only'>Actions</span>,
    cell: ({ row }) => <ProformaInvoiceCellAction data={row.original} />,
  },
];
