/* eslint-disable @typescript-eslint/no-explicit-any */
import { searchParamsCache } from '@/lib/searchparams';
import { deliveryEstimationColumns } from './tables/columns';
import { DataTable } from '@/components/ui/table/data-table';
import { getAllDeliveryEstimations } from '@/service/delivery-estimation';

type DeliveryEstimationsListingPageProps = object;

export default async function DeliveryEstimationsListingPage(
  {}: DeliveryEstimationsListingPageProps
) {
  // ────────────────────────────────────────────────────────────────
  // Query-string inputs
  // ────────────────────────────────────────────────────────────────
  const page = Number(searchParamsCache.get('page') || 1);
  const search = String(searchParamsCache.get('q') || '');
  const limit = Number(searchParamsCache.get('limit') || 10);

  try {
    // Fetch data from API
    const { estimations, totalCount } =
      await getAllDeliveryEstimations({ page, limit });

    // ────────────────────────────────────────────────────────────────
    // Client-side search filter (customer name / phone)
    // ────────────────────────────────────────────────────────────────
    const filteredData = estimations.filter((item) =>
      [
        item.customerName,
        item.phone
      ]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase())
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
        columns={deliveryEstimationColumns}
      />
    );
  } catch {
    return (
      <div className='p-4 text-red-500'>
        Error loading delivery estimations. Please try again later.
      </div>
    );
  }
}
