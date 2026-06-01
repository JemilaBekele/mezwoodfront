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
import MovementTypeModal from '@/features/Inventory/MOVEMENTTYPES/view-page';
import MovementTypesListingPage from '@/features/Inventory/MOVEMENTTYPES/listing';

export const metadata = {
  title: 'Dashboard: Movement Type'
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
            title='Movement Type'
            description='Manage Movement Type information and records.'
          />

          <PermissionGuard
            requiredPermission={PERMISSIONS.COLOUR.CREATE.name}
          >
            <MovementTypeModal />
          </PermissionGuard>
        </div>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />
          }
        >
          <ItemTableAction />
          <MovementTypesListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
