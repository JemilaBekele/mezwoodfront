import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

import ItemTableAction from '@/features/genralinfo/Branch/tableaction';

import StoreStockListingPage from '@/features/Inventory/StoreStocks/listing';

export const metadata = {
  title: 'Dashboard: Store Stock'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function StorePage(props: pageProps) {
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
            title='Store Stock'
            description='Manage all store stock records, including quantities, batches, and related store details'
          />
        </div>
        <Separator />
        <ItemTableAction />

        <Suspense
          // key={key}
          fallback={
            <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />
          }
        >
          <StoreStockListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
