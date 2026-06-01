import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import RoleListingPage from '@/features/RoleandPermisson/listing';
import RoleModal from '@/features/RoleandPermisson/modal';
import { searchParamsCache } from '@/lib/searchparams';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import ItemTableAction from '@/features/genralinfo/Branch/tableaction';

export const metadata = {
  title: 'Dashboard: Role'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function RolePage(props: pageProps) {
  const searchParams = await props.searchParams;

  searchParamsCache.parse(searchParams);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading title='Role' description='Manage Role ' />
          <PermissionGuard requiredPermission={PERMISSIONS.ROLE.CREATE.name}>
            <RoleModal />
          </PermissionGuard>
        </div>
        <Separator />
        <ItemTableAction />
        <Suspense
          // key={key}
          fallback={
            <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />
          }
        >
          <RoleListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
