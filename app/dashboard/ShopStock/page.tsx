import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

import ItemTableAction from '@/features/genralinfo/Branch/tableaction';

import ShopStockListingPage from '@/features/Inventory/ShopStocks/listing';

export const metadata = {
  title: 'Dashboard: Shop Stock'
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
            title='Shop Stock'
            description='Manage all shop stock records, including quantities, stores, and related details'
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
          <ShopStockListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
