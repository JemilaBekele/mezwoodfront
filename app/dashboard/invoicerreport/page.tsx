

import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import InvoiceReport from '@/features/Dasboard/curtain/invoicereport';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : invoice report'
};


export default async function Page() {
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <InvoiceReport  />
        </Suspense>
      </div>
    </PageContainer>
  );
}
