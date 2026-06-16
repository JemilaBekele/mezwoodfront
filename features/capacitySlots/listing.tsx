
import { searchParamsCache } from '@/lib/searchparams';
import { DataTable } from '@/components/ui/table/data-table';
import { capacitySlotColumns } from './tables/columns'; // Adjust path to your capacity slot columns
import { getAllCapacitySlots } from '@/service/CapacityLot';

type CapacitySlotListingPageProps = object;
import { CapacityStage } from "@/models/CapacityLot";

const stageOrder: CapacityStage[] = [
  CapacityStage.DESIGN,
  CapacityStage.METAL_WORKS,
  CapacityStage.CNC,
  CapacityStage.CUTTING,
  CapacityStage.EDGE_BANDING,
  CapacityStage.ASSEMBLY,
  CapacityStage.PAINTING,
  CapacityStage.FINISHING,
  CapacityStage.DELIVERY,
];
export default async function CapacitySlotListingPage({}: CapacitySlotListingPageProps) {
  const page = searchParamsCache.get('page') || 1;
  const search = searchParamsCache.get('q') || '';
  const limit = searchParamsCache.get('limit') || 10;

  // Fetch capacity slots from API
  const { capacitySlots, totalCount } = await getAllCapacitySlots();

  // ─────────────────────────────────────────────
  // Client-side search filtering by stage
  // ─────────────────────────────────────────────
const filteredData = capacitySlots.filter((slot: { stage: string }) =>
  slot.stage.toLowerCase().includes(search.toLowerCase())
);

// Sort by stage order
const sortedData = filteredData.sort(
  (a: { stage: CapacityStage }, b: { stage: CapacityStage }) =>
    stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage)
);

// Pagination
const startIndex = (page - 1) * limit;
const endIndex = startIndex + limit;
const paginatedData = sortedData.slice(startIndex, endIndex);

  return (
    <DataTable
      data={paginatedData}
      totalItems={totalCount}
      columns={capacitySlotColumns}
    />
  );
}
