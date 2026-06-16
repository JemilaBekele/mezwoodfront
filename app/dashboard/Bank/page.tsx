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

import BankModal from '@/features/Bank/modal';
import BankListingPage from '@/features/Bank/listing';


export const metadata = {
  title: 'Dashboard: Bank'
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
          <Heading title='Bank' description='Manage Bank' />
          <PermissionGuard requiredPermission={PERMISSIONS.BANK.CREATE.name}>
            <BankModal />
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
          <BankListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
