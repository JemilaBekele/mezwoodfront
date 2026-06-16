'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

interface UncheckedCorrectionsFilterProps {
  isChecked: boolean;
  count: number;
  search: string;
  limit: number;
  startDate?: string;
  endDate?: string;
  statusFilter: string;
  employeeFilter: string;
}

export default function UncheckedCorrectionsFilter({
  isChecked,
  count,
  search,
  limit,
  startDate,
  endDate,
  statusFilter,
  employeeFilter,
}: UncheckedCorrectionsFilterProps) {
  const router = useRouter();

  const handleCheckedChange = (checked: boolean) => {
    const urlParams = new URLSearchParams();
    
    if (search) urlParams.set('q', search);
    urlParams.set('page', '1');
    urlParams.set('limit', limit.toString());
    if (startDate) urlParams.set('startDate', startDate);
    if (endDate) urlParams.set('endDate', endDate);
    urlParams.set('status', statusFilter);
    urlParams.set('employee', employeeFilter);

    if (checked) {
      urlParams.set('unchecked', 'true');
    } else {
      urlParams.delete('unchecked');
    }
    
    const newUrl = `?${urlParams.toString()}`;
    
    router.push(newUrl);
    router.refresh(); // Force a refresh to update server component
  };

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id="unchecked-corrections"
        checked={isChecked}
        onCheckedChange={(checked) => handleCheckedChange(checked === true)}
      />
      <Label
        htmlFor="unchecked-corrections"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Show only sells with unchecked corrections
        {count > 0 && (
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
            {count} sells
          </span>
        )}
      </Label>
    </div>
  );
}