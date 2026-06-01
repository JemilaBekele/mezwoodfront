import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import CurtainMeasurementViewPage from '@/features/Production/CurtainOrder/tables/view-page';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Curtain Order'
};

type PageProps = { params: Promise<{ id: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <CurtainMeasurementViewPage orderId={params.id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
