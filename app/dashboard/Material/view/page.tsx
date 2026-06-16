import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import MaterialDetailPage from '@/features/material/detail';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Material detail page'
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
          <MaterialDetailPage id={resolvedSearchParams.id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
