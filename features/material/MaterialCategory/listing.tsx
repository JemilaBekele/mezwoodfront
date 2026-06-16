
import { searchParamsCache } from '@/lib/searchparams';
import { getAllMaterialCategories } from '@/service/materialcatagory';
import { materialCategoryColumns } from './tables/columns';
import { DataTable } from '@/components/ui/table/data-table';
import { IMaterialCategory } from '@/models/materialCategory';

type MaterialCategoriesListingPageProps = object;

export default async function MaterialCategoriesListingPage(
  {}: MaterialCategoriesListingPageProps
) {
  // ────────────────────────────────────────────────────────────────
  // Query-string inputs
  // ────────────────────────────────────────────────────────────────
  const page = searchParamsCache.get('page') || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = searchParamsCache.get('limit') || 10;

  let materialCategories: IMaterialCategory[] = [];
  let totalCount = 0;
  let error = false;

  try {
    // Fetch data from API
    const result = await getAllMaterialCategories();
    materialCategories = result.materialCategories;
    totalCount = result.totalCount;
  } catch {
    error = true;
  }

  if (error) {
    return (
      <div className='p-4 text-red-500'>
        Error loading material categories. Please try again later.
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────
  // Client-side search filter
  // ────────────────────────────────────────────────────────────────
  const filteredData = materialCategories.filter((item: IMaterialCategory) =>
    item.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ────────────────────────────────────────────────────────────────
  // Client-side pagination
  // ────────────────────────────────────────────────────────────────
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={materialCategoryColumns}
    />
  );
}
