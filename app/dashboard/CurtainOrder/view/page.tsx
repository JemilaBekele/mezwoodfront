import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import CurtainOrderDetailPage from '@/features/Production/CurtainOrder/detail';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Curtain Order'
};

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function InventoryPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <CurtainOrderDetailPage id={resolvedSearchParams?.id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
