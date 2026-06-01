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
import CurtainTypesListingPage from '@/features/Inventory/CurtainType/listing';
import CurtainTypeModal from '@/features/Inventory/CurtainType/view-page';

export const metadata = {
  title: 'Dashboard: Curtain Type'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ColourPage({ searchParams }: PageProps) {
  const parsedParams = await searchParams;
  searchParamsCache.parse(parsedParams);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Curtain Type'
            description='Manage Curtain Type information and records.'
          />

          <PermissionGuard
            requiredPermission={PERMISSIONS.CURTAIN_TYPE.CREATE.name}
          >
            <CurtainTypeModal />
          </PermissionGuard>
        </div>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />
          }
        >
          <ItemTableAction />
          <CurtainTypesListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
