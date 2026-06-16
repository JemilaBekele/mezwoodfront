import { searchParamsCache } from '@/lib/searchparams';
import { DataTable } from '@/components/ui/table/data-table';
import { bankColumns } from './tables/columns';
import { getAllBanks } from '@/service/bank';

type BankListingPageProps = object;

export default async function BankListingPage({}: BankListingPageProps) {
  const page = searchParamsCache.get('page') || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = searchParamsCache.get('limit') || 10;

  // Fetch banks from API
  const { banks, totalCount } = await getAllBanks({
    page,
    limit,
    search
  });

  // ─────────────────────────────────────────────
  // Client-side search filtering by bank name
  // (optional, API already supports search)
  // ─────────────────────────────────────────────
  const filteredData = banks.filter((bank: { bankName: string }) =>
    bank.bankName.toLowerCase().includes(search.toLowerCase())
  );

  // ─────────────────────────────────────────────
  // Pagination (client-side safety)
  // ─────────────────────────────────────────────
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={bankColumns}
    />
  );
}
