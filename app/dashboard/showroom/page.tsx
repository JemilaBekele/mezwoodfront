import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';


import ShowroomListingPage from '@/features/genralinfo/showroom/listing';
import UserTableAction from '@/features/Employee/components/employee-table-action';
import ShowroomModal from '@/features/genralinfo/showroom/modal';

export const metadata = {
  title: 'Dashboard: Showroom'
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
          <Heading
            title='Show room'
            description='Manage all showroom '
          />
          <PermissionGuard requiredPermission={PERMISSIONS.SHOWROOM.CREATE.name}>
            <ShowroomModal />
          </PermissionGuard>
        </div>
        <Separator />
            <UserTableAction />

        <Suspense
          // key={key}
          fallback={
            <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />
          }
        >
          <ShowroomListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
