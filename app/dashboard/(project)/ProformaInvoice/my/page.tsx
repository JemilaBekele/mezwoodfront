

import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import UserTableAction from '@/features/Employee/components/employee-table-action';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { IconPlus, IconFileInvoice } from '@tabler/icons-react';
import Link from 'next/link';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import ProformaInvoicemyListingPage from '@/features/ProformaInvoices/mypi';


export const metadata = {
  title: 'Dashboard: Proforma Invoice'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function PurchasePage(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col gap-4'>
        {/* ── Header ──────────────────────────────────────── */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10'>
              <IconFileInvoice className='h-5 w-5 text-primary' />
            </div>
            <div>
              <h2 className='text-xl font-bold tracking-tight'>Proforma Invoices</h2>
              <p className='text-muted-foreground text-xs'>
                Manage invoices and track payments
              </p>
            </div>
          </div>

          <PermissionGuard
            requiredPermission={PERMISSIONS.PROFORMA_INVOICE.CREATE.name}
          >
            <Link
              href='/dashboard/ProformaInvoice/new'
              className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
            >
              <IconPlus className='h-4 w-4' />
              New Invoice
            </Link>
          </PermissionGuard>
        </div>

        {/* ── Filters ─────────────────────────────────────── */}
        <UserTableAction />

        {/* ── Listing ─────────────────────────────────────── */}
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />
          }
        >
          <ProformaInvoicemyListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
