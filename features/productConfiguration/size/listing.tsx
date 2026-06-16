import { searchParamsCache } from '@/lib/searchparams';
import { sizeColumns } from './tables/columns';
import { DataTable } from '@/components/ui/table/data-table';
import { getAllSizes } from '@/service/productConfiguration';
import { ISize } from '@/models/productConfiguration';

type SizesListingPageProps = object;

export default async function SizesListingPage(
  {}: SizesListingPageProps
) {
  // ────────────────────────────────────────────────────────────────
  // Query params
  // ────────────────────────────────────────────────────────────────
  const page = Number(searchParamsCache.get('page') || 1);
  const search = searchParamsCache.get('q') || '';
  const limit = Number(searchParamsCache.get('limit') || 10);

  let paginatedData: Awaited<
    ReturnType<typeof getAllSizes>
  >['sizes'] = [];

  let totalCount = 0;
  let loadError = false;

  try {
    // Fetch data
    const { sizes, totalCount: fetchedTotalCount } = await getAllSizes();

    // ────────────────────────────────────────────────────────────────
    // Search filter (client-side)
    // ────────────────────────────────────────────────────────────────
    const filteredData = sizes.filter((item:ISize) =>
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
        Error loading sizes. Please try again later.
      </div>
    );
  }

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={sizeColumns}
    />
  );
}