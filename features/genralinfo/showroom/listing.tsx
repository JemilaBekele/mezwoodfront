import { searchParamsCache } from '@/lib/searchparams';
import { DataTable } from '@/components/ui/table/data-table';
import { showroomColumns } from './tables/columns';
import { getAllShowrooms } from '@/service/showroom';

type ShowroomListingPageProps = object;

export default async function ShowroomListingPage({}: ShowroomListingPageProps) {
  const page = searchParamsCache.get('page') || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = searchParamsCache.get('limit') || 10;

  // Fetch showrooms from API
  const { showrooms, totalCount } = await getAllShowrooms({ page });

  // ─────────────────────────────────────────────
  // Client-side search filtering
  // ─────────────────────────────────────────────
  const filteredData = showrooms.filter((showroom) =>
    showroom.name.toLowerCase().includes(search.toLowerCase())
  );

  // ─────────────────────────────────────────────
  // Pagination
  // ─────────────────────────────────────────────
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={showroomColumns}
    />
  );
}