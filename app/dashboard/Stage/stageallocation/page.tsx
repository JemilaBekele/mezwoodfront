import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import StageAllocationCalendar from '@/features/Project/StageAllocationCalendar';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Project Allocation page'
};

type PageProps = {
  searchParams: Promise<{ stage?: string }>; // Update to reflect searchParams as a Promise
};

export default async function LeasePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams; // Await searchParams
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <StageAllocationCalendar stage={resolvedSearchParams.stage || " "} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
