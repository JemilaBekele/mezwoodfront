import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import SaleDetailPage from '@/features/Shop/detail';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Sale Details'
};

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ProductPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const id = resolvedSearchParams?.id;

  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          {id ? <SaleDetailPage id={id} /> : <FormCardSkeleton />}
        </Suspense>
      </div>
    </PageContainer>
  );
}
