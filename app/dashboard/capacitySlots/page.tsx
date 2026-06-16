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
import CapacitySlotListingPage from '@/features/capacitySlots/listing';
import CapacitySlotModal from '@/features/capacitySlots/modal';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';


export const metadata = {
  title: 'Dashboard: Capacity Slots'
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
          <Heading title='Capacity Slots' description='Manage Capacity Slots' />
          <PermissionGuard requiredPermission={PERMISSIONS.CAPACITY_SLOT.CREATE.name}>
            <CapacitySlotModal />
          </PermissionGuard>
            <Link
              href='/dashboard/capacitySlots/report'
              className={cn(buttonVariants(), 'text-xs md:text-sm')}
            >
              Capacity Slots Report
            </Link>  
        </div>
        <Separator />
        <ItemTableAction />

        <Suspense
          // key={key}
          fallback={
            <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />
          }
        >
          <CapacitySlotListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
