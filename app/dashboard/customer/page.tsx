import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import CustomersListingPage from '@/features/customer/listing';
import ItemTableAction from '@/features/genralinfo/Branch/tableaction';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

export const metadata = {
  title: 'Dashboard: Customer'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function SupplierPage({ searchParams }: PageProps) {
  const parsedParams = await searchParams;
  searchParamsCache.parse(parsedParams);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Customers'
            description='Manage customer information and records.'
          />

          <PermissionGuard
            requiredPermission={PERMISSIONS.CUSTOMER.CREATE.name}
          >
            <Link
              href='/dashboard/customer/new'
              className={cn(buttonVariants(), 'text-xs md:text-sm')}
            >
              <IconPlus className='mr-2 h-4 w-4' />
              Add New Customer
            </Link>
          </PermissionGuard>
        </div>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />
          }
        >
          {' '}
          <ItemTableAction />
          <CustomersListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
