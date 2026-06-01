'use client';

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { Suspense, useState } from 'react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import ItemTableAction from '@/features/genralinfo/Branch/tableaction';
import ExpenseModal from '@/features/Expense/view-page';
import ExpensesListingPage from '@/features/Expense/listing';




export default function BraPage() {
  // Create a refresh trigger that can be passed to child components
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading title='Expense' description='Manage Expense' />
          {/* <PermissionGuard requiredPermission={PERMISSIONS.BRANCH.CREATE.name}> */}
            <ExpenseModal onSuccess={handleRefresh} />
          {/* </PermissionGuard> */}
        </div>
        <Separator />
        {/* <ItemTableAction /> */}

        <Suspense
          key={refreshKey} // Force suspense to re-render when refreshKey changes
          fallback={
            <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />
          }
        >
          <ExpensesListingPage refreshTrigger={refreshKey} />
        </Suspense>
      </div>
    </PageContainer>
  );
}