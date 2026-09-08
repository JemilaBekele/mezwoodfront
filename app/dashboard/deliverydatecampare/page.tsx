import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import DeliveryDateComparisonReport from '@/features/Dasboard/wood/delivery';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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
         <div className='flex items-start justify-between'>
       
<Link
  href='/dashboard/deliverycomplete'
  className={cn(buttonVariants(), 'text-xs md:text-sm')}
>
  Project Delivery Completion Date Report
</Link>                   
           
        </div>
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
            <DeliveryDateComparisonReport />
          </div>
        </Suspense>
      </div>
    </PageContainer>
  );
}
