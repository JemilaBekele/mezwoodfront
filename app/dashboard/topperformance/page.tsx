



import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import TopPerformersDashboard from '@/features/Dasboard/curtain/topperform';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : top performers'
};


export default async function Page() {
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <TopPerformersDashboard  />
        </Suspense>
      </div>
    </PageContainer>
  );
}
