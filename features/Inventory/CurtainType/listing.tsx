import { searchParamsCache } from '@/lib/searchparams';
import { DataTable } from '@/components/ui/table/data-table';
import { getAllCurtainTypes } from '@/service/curtainType';
import { curtainTypeColumns } from './tables/columns';

type CurtainTypesListingPageProps = object;

export default async function CurtainTypesListingPage({}: CurtainTypesListingPageProps) {
  // ────────────────────────────────────────────────────────────────
  // Query-string inputs
  // ────────────────────────────────────────────────────────────────
  const page = searchParamsCache.get('page') || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = searchParamsCache.get('limit') || 10;

  try {
    // Fetch data from API
    const { curtainTypes, totalCount } = await getAllCurtainTypes({ page, limit });

    // ────────────────────────────────────────────────────────────────
    // Client-side search filter
    // ────────────────────────────────────────────────────────────────
    const filteredData = curtainTypes.filter((item) =>
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
        columns={curtainTypeColumns}
      />
    );
  } catch {
    return (
      <div className='p-4 text-red-500'>
        Error loading curtain types. Please try again later.
      </div>
    );
  }
}
