// REMOVE 'use client'

import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import PurchasecorrectPage from '@/features/purchase/correctview';
import { Suspense } from 'react';

export default async function StockPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  console.log('Rendering StockPage with id:', params.id);

  return (
    <PageContainer scrollable>
      <Suspense fallback={<FormCardSkeleton />}>
        {params.id ? (
          <PurchasecorrectPage purchaseId={params.id} />
        ) : (
          <div className='flex h-64 items-center justify-center'>
            <p className='text-muted-foreground'>
              No purchase ID provided. Please go back and select a purchase.
            </p>
          </div>
        )}
      </Suspense>
    </PageContainer>
  );
}