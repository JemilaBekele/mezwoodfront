import { searchParamsCache } from '@/lib/searchparams';
import { DataTable } from '@/components/ui/table/data-table';
import { storeColumns } from './tables/columns';
import { getAllStores } from '@/service/store';

type StoreListingPageProps = object;

export default async function StoreListingPage({}: StoreListingPageProps) {
  const page = searchParamsCache.get('page') || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = searchParamsCache.get('limit') || 10;

  let paginatedData = [];
  let totalCount = 0;

  try {
    // Fetch stores from API
    const { stores, totalCount: count } = await getAllStores({ page });

    // ─────────────────────────────────────────────
    // Client-side search filtering
    // ─────────────────────────────────────────────
    const filteredData = stores.filter((store) =>
      store.name.toLowerCase().includes(search.toLowerCase())
    );

    // ─────────────────────────────────────────────
    // Pagination
    // ─────────────────────────────────────────────
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    paginatedData = filteredData.slice(startIndex, endIndex);
    totalCount = count;
  } catch {
    return <div>Error loading stores list.</div>;
  }

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={storeColumns}
    />
  );
}