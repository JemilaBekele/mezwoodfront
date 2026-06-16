'use client';

import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { useUserTableFilters } from './sellTableFilters';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/DatePicker';
import React from 'react';

export default function UserTableAction() {
  const {
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
    filters,
    setFilter
  } = useUserTableFilters();

  // Optimized date change handlers
  const handleStartDateChange = React.useCallback(
    async (date: Date | undefined) => {
      await setFilter('startDate', date, {
        shallow: false,
        scroll: false
      });
    },
    [setFilter]
  );

  const handleEndDateChange = React.useCallback(
    async (date: Date | undefined) => {
      await setFilter('endDate', date, {
        shallow: false,
        scroll: false
      });
    },
    [setFilter]
  );

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

      <div className='flex flex-col gap-4 sm:flex-row'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='startDate'>From</Label>
          <DatePicker
            selectedDate={filters.startDate ?? undefined}
            onSelect={handleStartDateChange}
            fromDate={new Date(2000, 0, 1)}
            key={filters.startDate?.toISOString()} // Force re-render on date change
          />
        </div>

        <div className='flex flex-col gap-2'>
          <Label htmlFor='endDate'>To</Label>
          <DatePicker
            selectedDate={filters.endDate ?? undefined}
            onSelect={handleEndDateChange}
            fromDate={filters.startDate ?? new Date(2000, 0, 1)}
            key={filters.endDate?.toISOString()} // Force re-render on date change
          />
        </div>

        <div className='flex items-end'>
          <DataTableResetFilter
            isFilterActive={isAnyFilterActive}
            onReset={resetFilters}
          />
        </div>
      </div>
    </div>
  );
}
