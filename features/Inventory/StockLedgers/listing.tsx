import { searchParamsCache } from '@/lib/searchparams';
import { getAllStockLedgers } from '@/service/store'; // your service
import { stockLedgerColumns } from './cloumn'; // your columns
import { DataTable } from '@/components/ui/table/data-table';

type StockLedgerListingPageProps = object;

export default async function StockLedgerListingPage({}: StockLedgerListingPageProps) {
  const page = Number(searchParamsCache.get('page')) || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = Number(searchParamsCache.get('limit')) || 10;
  const startDate = searchParamsCache.get('startDate');
  const endDate = searchParamsCache.get('endDate');

  try {
    // ────────────────────────────────────────────────
    // Fetch data from API with optional date filters
    // ────────────────────────────────────────────────
    const { data, totalCount } = await getAllStockLedgers({
      page,
      limit,
      startDate,
      endDate
    });

    // ────────────────────────────────────────────────
    // Client-side search filter
    // (matches movement type, reference, store/shop name, user, notes)
    // ────────────────────────────────────────────────
    const filteredData = data.filter((item) => {
      const searchTerm = search.toLowerCase();

      const movementType = item?.movementType?.toLowerCase() || '';
      const reference = item?.reference?.toLowerCase() || '';
      const notes = item?.notes?.toLowerCase() || '';
      const storeName = item?.store?.name?.toLowerCase() || '';
      const shopName = item?.shop?.name?.toLowerCase() || '';
      const userName = item?.user?.name?.toLowerCase() || '';

      return (
        movementType.includes(searchTerm) ||
        reference.includes(searchTerm) ||
        notes.includes(searchTerm) ||
        storeName.includes(searchTerm) ||
        shopName.includes(searchTerm) ||
        userName.includes(searchTerm)
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
        columns={stockLedgerColumns}
      />
    );
  } catch  {
    return <div>Error loading stock ledger records.</div>;
  }
}
