

import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import PurchaseStockCheckPage from '@/features/Stages/PURCHASING/listofpurchase';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Perchase detail page'
};

;

export default async function PurchasePage() {
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <PurchaseStockCheckPage  />
        </Suspense>
      </div>
    </PageContainer>
  );
}
