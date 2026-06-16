


import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import UserTableAction from '@/features/Employee/components/employee-table-action';
import { searchParamsCache } from '@/lib/searchparams';

import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

import FinishedAssemblyProjectListingPage from '@/features/Stages/ASSEMBLY/finished';

export const metadata = {
  title: 'Dashboard: Project'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function PurchasePage(props: pageProps) {
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
  title="Finished Assembly Projects" 
  description="Manage completed Assembly projects" 
/>              
        </div>
        <Separator />
        <UserTableAction />

        <Suspense
          // key={key}
          fallback={
            <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />
          }
        >
          <FinishedAssemblyProjectListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
