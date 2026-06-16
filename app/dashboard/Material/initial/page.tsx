





import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import MaterialInitialStockForm from '@/features/material/initial';
import {  Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Product detail page'
};

type PageProps = {
  searchParams: Promise<{ id?: string }>; // Update to reflect searchParams as a Promise
};

export default async function MaterialPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams; // Await searchParams
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <MaterialInitialStockForm materialId={resolvedSearchParams.id ?? ''} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
