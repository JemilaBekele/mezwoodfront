import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import WorkerCommissionReport from '@/features/worker/allreport';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Worker Commission Report'
};

export default async function Page() {

  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <WorkerCommissionReport  />
        </Suspense>
      </div>
    </PageContainer>
  );
}