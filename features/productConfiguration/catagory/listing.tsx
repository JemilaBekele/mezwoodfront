import { searchParamsCache } from '@/lib/searchparams';
import { productCategoryColumns } from './tables/columns';
import { DataTable } from '@/components/ui/table/data-table';
import { getAllCategories } from '@/service/productConfiguration';

type ProductCategoriesListingPageProps = object;

export default async function ProductCategoriesListingPage(
  {}: ProductCategoriesListingPageProps
) {
  // ────────────────────────────────────────────────────────────────
  // Query params
  // ────────────────────────────────────────────────────────────────
  const page = Number(searchParamsCache.get('page') || 1);
  const search = searchParamsCache.get('q') || '';
  const limit = Number(searchParamsCache.get('limit') || 10);

  let paginatedData: Awaited<ReturnType<typeof getAllCategories>>['categories'] = [];
  let totalCount = 0;
  let loadError = false;

  try {
    // Fetch data
    const { categories, totalCount: fetchedTotalCount } = await getAllCategories();

    // ────────────────────────────────────────────────────────────────
    // Search filter (client-side)
    // ────────────────────────────────────────────────────────────────
    const filteredData = categories.filter((item: { name: string; }) =>
      item.name?.toLowerCase().includes(search.toLowerCase())
    );

    // ────────────────────────────────────────────────────────────────
    // Pagination (client-side)
    // ────────────────────────────────────────────────────────────────
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    paginatedData = filteredData.slice(startIndex, endIndex);
    totalCount = fetchedTotalCount;
  } catch {
    loadError = true;
  }

  if (loadError) {
    return (
      <div className='p-4 text-red-500'>
        Error loading product categories. Please try again later.
      </div>
    );
  }

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={productCategoryColumns}
    />
  );
}