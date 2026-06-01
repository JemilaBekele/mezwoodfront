import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import BranchModal from '@/features/genralinfo/Branch/modal';
import BranchListingPage from '@/features/genralinfo/Branch/listing';
import ItemTableAction from '@/features/genralinfo/Branch/tableaction';

export const metadata = {
  title: 'Dashboard: Branch'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function BraPage(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading title='Branch' description='Manage Branch' />
          <PermissionGuard requiredPermission={PERMISSIONS.BRANCH.CREATE.name}>
            <BranchModal />
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
          <BranchListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
