import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import ItemTableAction from '@/features/genralinfo/Branch/tableaction';
import CurtainOrdersListingPage from '@/features/Production/CurtainOrder/listing';
import CurtainModal from '@/features/Production/CurtainOrder/view-page';

export const metadata = {
  title: 'Dashboard: Curtain Order'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ColourPage({ searchParams }: PageProps) {
  const parsedParams = await searchParams;
  searchParamsCache.parse(parsedParams);

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Curtain Order'
            description='Manage Curtain Order information and records.'
          />

          <PermissionGuard
            requiredPermission={PERMISSIONS.CURTAIN_ORDER.CREATE.name}
          >
            <CurtainModal />
          </PermissionGuard>
        </div>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />
          }
        >
          <ItemTableAction />
          <CurtainOrdersListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
