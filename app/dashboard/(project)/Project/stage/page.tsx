import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import ProjectStageUpdatePage from '@/features/Project/modal';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Project detail page'
};

type PageProps = {
  searchParams: Promise<{
    id?: string;
  }>;
};

export default async function LeasePage({
  searchParams
}: PageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <PageContainer scrollable>
      <div className='flex-1 min-w-0 w-full space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <ProjectStageUpdatePage
            id={resolvedSearchParams?.id}
          />
        </Suspense>
      </div>
    </PageContainer>
  );
}