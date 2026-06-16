import { useQueryState } from 'nuqs';
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

  // Reset all filters
  const resetFilters = async () => {
    await Promise.all([setSearchQuery(''), setPage(1)]);
  };

  // Check if any filter is active
  const isAnyFilterActive = searchQuery !== '';

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive
  };
}
