import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import PurchaseProjectDetailPage from '@/features/Stages/PURCHASING/Project/design';
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
                      <main className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">

          <PurchaseProjectDetailPage id={resolvedSearchParams.id} />
                </main>
        </Suspense>
      </div>
    </PageContainer>
  );
}
