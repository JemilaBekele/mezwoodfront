import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import CategoriesListingPage from '@/features/Inventory/catagory/listing';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import CategoryModal from '@/features/Inventory/catagory/view-page';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import ItemTableAction from '@/features/genralinfo/Branch/tableaction';

export const metadata = {
  title: 'Dashboard: Category'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function SupplierPage({ searchParams }: PageProps) {
  const parsedParams = await searchParams;
  searchParamsCache.parse(parsedParams);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Categories'
            description='Manage Categories information and records.'
          />

          <PermissionGuard
            requiredPermission={PERMISSIONS.CATEGORY.CREATE.name}
          >
            <CategoryModal />
          </PermissionGuard>
        </div>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />
          }
        >
          {' '}
          <ItemTableAction />
          <CategoriesListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
