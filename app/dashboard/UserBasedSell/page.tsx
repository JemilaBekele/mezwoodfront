import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { searchParamsCache } from '@/lib/searchparams';

import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import UserSellListingPage from '@/features/Shop/userbased/listing';
import UserTableAction from '@/features/Employee/components/employee-table-action';

export const metadata = {
  title: 'Dashboard: Own Sales'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function SupplierPage({ searchParams }: PageProps) {
  const parsedParams = await searchParams;
  searchParamsCache.parse(parsedParams);

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading title='Sales' description='Manage all product Sales.' />
        </div>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />
          }
        >
          <UserTableAction />

          <UserSellListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
