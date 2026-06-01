import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import CurtainViewPage from '@/features/Production/workermangment/view';
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
          <CurtainViewPage curtainOrderId={params.id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
