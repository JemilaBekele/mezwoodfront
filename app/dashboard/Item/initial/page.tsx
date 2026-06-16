



import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import ItemDetailPage from '@/features/Item/detail';
import ItemInitialStockForm from '@/features/Item/initialstock';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Product detail page'
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
          <ItemInitialStockForm itemId={resolvedSearchParams.id ?? ''} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
