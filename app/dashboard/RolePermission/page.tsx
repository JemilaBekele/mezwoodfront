import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import RolePermissionListingPage from '@/features/RoleandPermisson/Permission/listing';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import ItemTableAction from '@/features/genralinfo/Branch/tableaction';
export const metadata = {
  title: 'Dashboard: Role Permissions'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function RolePermissionPage(props: pageProps) {
  const searchParams = await props.searchParams;
  // Allow nested RSCs to access the search params (in a type-safe way)
  searchParamsCache.parse(searchParams);

  // This key is used for invoke suspense if any of the search params changed (used for filters).
  // const key = serialize({ ...searchParams });

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between gap-2'>
          <Heading
            title='Role Permission'
            description='Manage Role Permissions'
          />

          <div className='flex gap-2'>
            <PermissionGuard
              requiredPermission={PERMISSIONS.ROLE_PERMISSION.CREATE.name}
            >
              <Link
                href='/dashboard/RolePermission/add'
                className={cn(buttonVariants(), 'text-xs md:text-sm')}
              >
                <IconPlus className='mr-2 h-4 w-4' /> Add New Permissions
              </Link>
            </PermissionGuard>
          </div>
        </div>
        <Separator />
        <ItemTableAction />
        <Suspense
          // key={key}
          fallback={
            <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />
          }
        >
          <RolePermissionListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
