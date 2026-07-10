/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { CalendarDays, Hash, CreditCard, Building, User, Wallet, FileCheck, Smartphone, Users } from 'lucide-react';
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

// Get icon for payment method
const getPaymentIcon = (method: string) => {
  const methodLower = method?.toLowerCase() || '';
  const iconMap: Record<string, React.ReactNode> = {
    'cash': <Wallet className="h-3 w-3" />,
    'bank': <Building className="h-3 w-3" />,
    'card': <CreditCard className="h-3 w-3" />,
    'mobile': <Smartphone className="h-3 w-3" />,
    'cheque': <FileCheck className="h-3 w-3" />,
    'credit': <CreditCard className="h-3 w-3" />,
    'transfer': <Building className="h-3 w-3" />,
  };

  for (const [key, icon] of Object.entries(iconMap)) {
    if (methodLower.includes(key)) {
      return icon;
    }
  }
  return <User className="h-3 w-3" />;
};

// Helper function to get paid by display with up to 3 people
const getPaidByDisplay = (banks?: any[]): { 
  display: React.ReactNode; 
  allMethods: string[]; 
  count: number;
} => {
  if (!banks || banks.length === 0) {
    return { 
      display: <span className="text-sm text-muted-foreground">N/A</span>, 
      allMethods: [], 
      count: 0 
    };
  }

  // Get unique paidBy values with their amounts
  const paymentMap = new Map<string, { method: string; amount: number }>();
  
  banks.forEach(bank => {
    if (bank.paidBy) {
      const key = bank.paidBy.toLowerCase();
      if (paymentMap.has(key)) {
        const existing = paymentMap.get(key)!;
        paymentMap.set(key, { 
          method: bank.paidBy, 
          amount: existing.amount + (bank.amount || 0) 
        });
      } else {
        paymentMap.set(key, { 
          method: bank.paidBy, 
          amount: bank.amount || 0 
        });
      }
    }
  });

  const uniquePayments = Array.from(paymentMap.values());
  const totalCount = uniquePayments.length;

  if (totalCount === 0) {
    return { 
      display: <span className="text-sm text-muted-foreground">N/A</span>, 
      allMethods: [], 
      count: 0 
    };
  }

  // Get the first 3 payment methods
  const displayMethods = uniquePayments.slice(0, 3);
  const remaining = totalCount - 3;

  // Create display with icons
  const display = (
    <div className="flex items-center gap-1.5">
      {displayMethods.map((payment, index) => (
        <div key={index} className="flex items-center gap-0.5">
          <span className="text-muted-foreground">
            {getPaymentIcon(payment.method)}
          </span>
          <span className="text-xs font-medium truncate max-w-[60px]">
            {payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}
          </span>
          {index < displayMethods.length - 1 && (
            <span className="text-xs text-muted-foreground mx-0.5">,</span>
          )}
        </div>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground font-medium ml-0.5">
          +{remaining}
        </span>
      )}
    </div>
  );

  return {
    display,
    allMethods: uniquePayments.map(p => p.method),
    count: totalCount,
  };
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
    id: 'paidBy',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Paid By' />,
    cell: ({ row }) => {
      const banks = row.original.banks;
      const { display } = getPaidByDisplay(banks);
      return display;
    },
    enableColumnFilter: true,
    filterFn: (row, id, value) => {
      const banks = row.original.banks;
      const { allMethods } = getPaidByDisplay(banks);
      return allMethods.some(method => 
        method.toLowerCase().includes((value as string).toLowerCase())
      );
    },
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
    accessorKey: 'amountPaid',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Paid' />,
    cell: ({ cell }) => {
      const amountPaid = cell.getValue<number>();
      return (
        <span className='text-sm font-medium text-emerald-600 dark:text-emerald-400 tabular-nums'>
          {amountPaid != null ? amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
        </span>
      );
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'balance',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Balance' />,
    cell: ({ cell }) => {
      const balance = cell.getValue<number>();
      return (
        <span className={`text-sm font-medium tabular-nums ${balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {balance != null ? balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
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