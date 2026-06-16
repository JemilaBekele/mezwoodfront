import { searchParamsCache } from '@/lib/searchparams';
import { productTypeColumns } from './tables/columns';
import { DataTable } from '@/components/ui/table/data-table';
import { getAllTypes } from '@/service/productConfiguration';
import { IProductType } from '@/models/productConfiguration';

type ProductTypesListingPageProps = object;

export default async function ProductTypesListingPage(
  {}: ProductTypesListingPageProps
) {
  // ────────────────────────────────────────────────────────────────
  // Query params
  // ────────────────────────────────────────────────────────────────
  const page = Number(searchParamsCache.get('page') || 1);
  const search = searchParamsCache.get('q') || '';
  const limit = Number(searchParamsCache.get('limit') || 10);

  let paginatedData: Awaited<
    ReturnType<typeof getAllTypes>
  >['types'] = [];

  let totalCount = 0;
  let loadError = false;

  try {
    // Fetch data
    const { types, totalCount: fetchedTotalCount } = await getAllTypes();

    // ────────────────────────────────────────────────────────────────
    // Search filter (client-side)
    // ────────────────────────────────────────────────────────────────
    const filteredData = types.filter((item: IProductType) =>
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
        Error loading product types. Please try again later.
      </div>
    );
  }

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={productTypeColumns}
    />
  );
}