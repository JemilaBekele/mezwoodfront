import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { CUTTINGProjectDetailPage } from '@/features/Stages/CUTTING/Project/design';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Project detail page'
};

type PageProps = {
  searchParams: Promise<{ id?: string }>; // Update to reflect searchParams as a Promise
};

export default async function LeasePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams; // Await searchParams
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <CUTTINGProjectDetailPage id={resolvedSearchParams.id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
