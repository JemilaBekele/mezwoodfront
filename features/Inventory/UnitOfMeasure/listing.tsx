import { searchParamsCache } from '@/lib/searchparams';
import { getAllUnitsOfMeasure } from '@/service/UnitOfMeasure';
import { unitOfMeasureColumns } from './tables/columns';
import { DataTable } from '@/components/ui/table/data-table';
import { IUnitOfMeasure } from '@/models/UnitOfMeasure';

type UnitsListingPageProps = object;

export default async function UnitsListingPage({}: UnitsListingPageProps) {
  // ────────────────────────────────────────────────────────────────
  // Query-string inputs
  // ────────────────────────────────────────────────────────────────
  const page = searchParamsCache.get('page') || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = searchParamsCache.get('limit') || 10;

  try {
    // Fetch data from API
    const { units, totalCount } = await getAllUnitsOfMeasure({ page, limit });

    // ────────────────────────────────────────────────────────────────
    // Client-side search filter
    // ────────────────────────────────────────────────────────────────
    const filteredData = units.filter((item: IUnitOfMeasure) =>
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
        columns={unitOfMeasureColumns}
      />
    );
  } catch  {
    return (
      <div className='p-4 text-red-500'>
        Error loading units of measure. Please try again later.
      </div>
    );
  }
}
