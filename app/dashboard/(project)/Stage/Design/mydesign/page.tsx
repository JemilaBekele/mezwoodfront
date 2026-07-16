import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import UserTableAction from '@/features/Employee/components/employee-table-action';
import { searchParamsCache } from '@/lib/searchparams';

import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';


import MyDesignProjectListingPage from '@/features/Stages/design/Project/mydesign';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

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
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading title='Project Design stage' description='Manage Project ' />
         <Link
              href='/dashboard/Stage/Design/mydesign/finish'
              className={cn(buttonVariants(), 'text-xs md:text-sm')}
            >
              Finished Design stage
            </Link> 
                <Link
              href={`/dashboard/Stage/stageallocation?stage=DESIGN`}
              className={cn(buttonVariants(), 'text-xs md:text-sm')}
            >
Calendar            </Link>  
        </div>
        <Separator />
      

        <UserTableAction />

        <Suspense
          // key={key}
          fallback={
            <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />
          }
        >
          <MyDesignProjectListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
