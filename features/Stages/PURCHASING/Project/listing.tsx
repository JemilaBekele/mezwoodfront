/* eslint-disable react-hooks/error-boundaries */
import { searchParamsCache } from '@/lib/searchparams';
import { projectColumns } from './tables/columns';
import { DataTable } from '@/components/ui/table/data-table';
import {  getpurchasingProjects } from '@/service/Stages';

type ProjectListingPageProps = object;

export default async function PurchaseProjectListingPage({}: ProjectListingPageProps) {
  // ────────────────────────────────────────────────────────────────
  // Query-string inputs
  // ────────────────────────────────────────────────────────────────
  const page = Number(searchParamsCache.get('page') || 1);
  const search = searchParamsCache.get('q') || '';
  const limit = Number(searchParamsCache.get('limit') || 10);

  try {
    // Fetch projects
    const { projects, totalCount } = await getpurchasingProjects({
        status: 'not-finished'
      });
    // ────────────────────────────────────────────────────────────────
    // Client-side search filter (safe fallback)
    // ────────────────────────────────────────────────────────────────
    const filteredData = projects.filter((project) => {
      const searchLower = search.toLowerCase();
      return (
        project.invoice?.piNumber?.toLowerCase().includes(searchLower) ||
        project.customer?.name?.toLowerCase().includes(searchLower)
      );
    });

    // ────────────────────────────────────────────────────────────────
    // Client-side pagination fallback
    // ────────────────────────────────────────────────────────────────
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return (
      <DataTable
        data={paginatedData}
        totalItems={totalCount ?? 0}
        columns={projectColumns}
      />
    );
  } catch (error) {
    console.error('Error loading projects:', error);
    return (
      <div className="p-4 text-red-500">
        Error loading projects. Please try again later.
      </div>
    );
  }
}
