import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import ProjectGanttPage from '@/features/Project/tables/gantview';
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
{resolvedSearchParams.id ? (
                <main className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">

  <ProjectGanttPage projectId={resolvedSearchParams.id} /> 
  </main>
) : (
  <p className="text-center text-red-600">Project ID is missing</p>
)}
        </Suspense>
      </div>
    </PageContainer>
  );
}
