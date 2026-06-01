import { searchParamsCache } from '@/lib/searchparams';
import { getAllStoreStocks } from '@/service/store'; // your service
import { DataTable } from '@/components/ui/table/data-table';
import { storeStockColumns } from './cloumn';

type StoreStockListingPageProps = object;

export default async function StoreStockListingPage({}: StoreStockListingPageProps) {
  const page = Number(searchParamsCache.get('page')) || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = Number(searchParamsCache.get('limit')) || 10;
  const startDate = searchParamsCache.get('startDate');
  const endDate = searchParamsCache.get('endDate');

  try {
    // ────────────────────────────────────────────────
    // Fetch data from API with optional date filters
    // ────────────────────────────────────────────────
    const { data, totalCount } = await getAllStoreStocks({
      page,
      limit,
      startDate,
      endDate
    });

    // ────────────────────────────────────────────────
    // Client-side search filter
    // (matches batchId, store name, status)
    // ────────────────────────────────────────────────
    const filteredData = data.filter((item) => {
      const searchTerm = search.toLowerCase();

      const storeName = item?.store?.name?.toLowerCase() || '';
      const status = item?.status?.toLowerCase() || '';

      return (
        storeName.includes(searchTerm) ||
        status.includes(searchTerm)
      );
    });

    // ────────────────────────────────────────────────
    // Client-side pagination
    // ────────────────────────────────────────────────
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return (
      // eslint-disable-next-line react-hooks/error-boundaries
      <DataTable
        data={paginatedData}
        totalItems={totalCount}
        columns={storeStockColumns}
      />
    );
  } catch  {
    return <div>Error loading store stock records.</div>;
  }
}
