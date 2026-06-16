import { Options, useQueryState } from 'nuqs';
import { searchParams } from '@/lib/searchparams';

export function useUserTableFilters() {
  // Search query state with proper debouncing
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q
      .withOptions({
        shallow: false,
        throttleMs: 500,
        clearOnDefault: true
      })
      .withDefault('')
  );

  // Pagination state
  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1)
  );

  // Date filter states with proper options
  const [startDateString, setStartDateString] = useQueryState(
    'startDate',
    searchParams.startDate.withOptions({
      shallow: false,
      clearOnDefault: true,
      history: 'push'
    })
  );

  const [endDateString, setEndDateString] = useQueryState(
    'endDate',
    searchParams.endDate.withOptions({
      shallow: false,
      clearOnDefault: true,
      history: 'push'
    })
  );

  // Convert ISO strings to Date objects
  const startDate = startDateString ? new Date(startDateString) : null;
  const endDate = endDateString ? new Date(endDateString) : null;

  const setFilter = async (
    key: 'startDate' | 'endDate',
    value: Date | undefined | null,
    options?: Options
  ) => {
    const isoString = value ? value.toISOString() : null;
    const setter = key === 'startDate' ? setStartDateString : setEndDateString;

    // Batch updates together
    await Promise.all([setter(isoString, options), setPage(1, options)]);
  };

  // Reset all filters
  const resetFilters = async () => {
    await Promise.all([
      setSearchQuery(''),
      setStartDateString(null),
      setEndDateString(null),
      setPage(1)
    ]);
  };

  // Check if any filter is active
  const isAnyFilterActive =
    searchQuery !== '' || startDate !== null || endDate !== null;

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    filters: { startDate, endDate },
    setFilter,
    resetFilters,
    isAnyFilterActive
  };
}
