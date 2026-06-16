'use client';

import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { useUserTableFilters } from './tablefilter';

export default function ItemTableAction() {
  const { searchQuery, setPage, setSearchQuery } = useUserTableFilters();

  return (
    <div className='mb-4 flex flex-col gap-4 md:flex-row'>
      <div className='flex-1'>
        <DataTableSearch
          searchKey='name'
          searchQuery={typeof searchQuery === 'string' ? searchQuery : ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
      </div>
    </div>
  );
}
