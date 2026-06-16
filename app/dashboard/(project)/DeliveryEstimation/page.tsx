import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import ItemTableAction from '@/features/capacitySlots/tableaction';


import DeliveryEstimationsListingPage from '@/features/DeliveryEstimation/listing';
import Link from 'next/dist/client/link';
import { IconPlus } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';


export const metadata = {
  title: 'Dashboard: DeliveryEstimation'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function BraPage(props: pageProps) {
  const searchParams = await props.searchParams;
  // Allow nested RSCs to access the search params (in a type-safe way)
  searchParamsCache.parse(searchParams);

  // This key is used for invoke suspense if any of the search params changed (used for filters).
  // const key = serialize({ ...searchParams });

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading title='Delivery Estimation' description='Manage Delivery Estimation' />
          <PermissionGuard requiredPermission={PERMISSIONS.DELIVERY_ESTIMATION.CREATE.name}>
 <Link
              href='/dashboard/DeliveryEstimation/new'
              className={cn(buttonVariants(), 'text-xs md:text-sm')}
            >
              <IconPlus className='mr-2 h-4 w-4' /> Add New
            </Link>{' '}          </PermissionGuard>
        </div>
        <Separator />
        <ItemTableAction />

        <Suspense
          // key={key}
          fallback={
            <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />
          }
        >
          <DeliveryEstimationsListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
