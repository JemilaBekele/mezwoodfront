import { searchParamsCache } from '@/lib/searchparams';
import { DataTable } from '@/components/ui/table/data-table';
import { getAllColours } from '@/service/Category';
import { colourColumns } from './tables/columns';

type ColoursListingPageProps = object;

export default async function ColoursListingPage({}: ColoursListingPageProps) {
  // ────────────────────────────────────────────────────────────────
  // Query-string inputs
  // ────────────────────────────────────────────────────────────────
  const page = searchParamsCache.get('page') || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = searchParamsCache.get('limit') || 10;

  try {
    // Fetch data from API
    const { colours, totalCount } = await getAllColours({ page, limit });

    // ────────────────────────────────────────────────────────────────
    // Client-side search filter
    // ────────────────────────────────────────────────────────────────
    const filteredData = colours.filter((item) =>
      item.name?.toLowerCase().includes(search.toLowerCase())
    );

    // ────────────────────────────────────────────────────────────────
    // Client-side pagination
    // ────────────────────────────────────────────────────────────────
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return (
      // eslint-disable-next-line react-hooks/error-boundaries
      <DataTable
        data={paginatedData}
        totalItems={totalCount}
        columns={colourColumns}
      />
    );
  } catch {
    return (
      <div className='p-4 text-red-500'>
        Error loading colours. Please try again later.
      </div>
    );
  }
}
