import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import UserTableAction from '@/features/Employee/components/employee-table-action';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { IconPlus, IconBriefcase } from '@tabler/icons-react';
import Link from 'next/link';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

import ProjectListingPage from '@/features/Project/listing';

export const metadata = {
  title: 'Dashboard: Projects'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function PurchasePage(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        {/* ── Header ──────────────────────────────────────── */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
              <IconBriefcase className='h-5 w-5 text-primary' />
            </div>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>Projects</h2>
              <p className='text-muted-foreground text-sm'>
                Track and manage all active projects
              </p>
            </div>
          </div>

          {/* <PermissionGuard
            requiredPermission={PERMISSIONS.PROJECT.CREATE.name}
          >
            <Link
              href='/dashboard/Project/new'
              className={cn(
                buttonVariants({ size: 'sm' }),
                'gap-2 shadow-sm transition-all hover:shadow-md'
              )}
            >
              <IconPlus className='h-4 w-4' />
              <span className='hidden sm:inline'>New Project</span>
              <span className='sm:hidden'>New</span>
            </Link>
          </PermissionGuard> */}
        </div>

        <Separator />

        {/* ── Filters ─────────────────────────────────────── */}
        <UserTableAction />

        {/* ── Table ───────────────────────────────────────── */}
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={7} rowCount={8} filterCount={2} />
          }
        >
          <ProjectListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
