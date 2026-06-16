import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';


import UnitOfMeasureModal from '@/features/Inventory/UnitOfMeasure/view-page';
import UnitsListingPage from '@/features/Inventory/UnitOfMeasure/listing';
import ItemTableAction from '@/features/capacitySlots/tableaction';

export const metadata = {
  title: 'Dashboard: UnitOfMeasure'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function UnitOfMeasurePage(props: pageProps) {
  const searchParams = await props.searchParams;
  // Allow nested RSCs to access the search params (in a type-safe way)
  searchParamsCache.parse(searchParams);

  // This key is used for invoke suspense if any of the search params changed (used for filters).
  // const key = serialize({ ...searchParams });

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Units of Measure'
            description='Manage all units of measure, including their symbols and base unit settings.'
          />
          <PermissionGuard
            requiredPermission={PERMISSIONS.UNIT_OF_MEASURE.CREATE.name}
          >
            <UnitOfMeasureModal />
          </PermissionGuard>
        </div>
        <Separator />
        <ItemTableAction />

        <Suspense
          // key={key}
          fallback={
            <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />
          }
        >
          <UnitsListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
