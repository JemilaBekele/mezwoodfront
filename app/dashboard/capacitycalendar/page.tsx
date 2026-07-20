import PageContainer from '@/components/layout/page-container';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import ThCapacityCalendar from '@/features/Project/calander';
import CapacityCalendar from '@/features/Project/calander';
import { searchParamsCache } from '@/lib/searchparams';

import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Calendar'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function SupplierPage({
  searchParams
}: PageProps) {
  const parsedParams = await searchParams;
  searchParamsCache.parse(parsedParams);

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4 pb-6'>
        <Suspense
          fallback={
            <DataTableSkeleton
              columnCount={6}
              rowCount={8}
              filterCount={2}
            />
          }
        >
          <div className='w-full'>
            <ThCapacityCalendar />
          </div>
        </Suspense>
      </div>
    </PageContainer>
  );
}
