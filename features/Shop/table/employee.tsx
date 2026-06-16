'use client';

import { User } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IEmployee } from '@/models/employee';
import { useRouter } from 'next/navigation';

interface EmployeeFilterProps {
  employees: IEmployee[];
  currentEmployeeFilter: string;
  saleStatusFilter: string;
  paymentStatusFilter: string;
  uncheckedCorrectionsFilter?: boolean;
  search?: string;
  limit?: number | string;
  startDate?: string;
  endDate?: string;
}

export default function EmployeeFilter({
  employees,
  currentEmployeeFilter,
  saleStatusFilter,
  paymentStatusFilter,
  uncheckedCorrectionsFilter,
  search,
  limit = 10,
  startDate,
  endDate,
}: EmployeeFilterProps) {
  const router = useRouter();

  const buildEmployeeFilterUrl = (employeeId: string) => {
    const params = new URLSearchParams();

    if (search) params.set('q', search);
    params.set('page', '1');
    params.set('limit', limit.toString());
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    params.set('saleStatus', saleStatusFilter);
    params.set('paymentStatus', paymentStatusFilter);
    params.set('employee', employeeId);
    
    // Add the uncheckedCorrectionsFilter if provided
    if (uncheckedCorrectionsFilter !== undefined) {
      params.set('uncheckedCorrections', uncheckedCorrectionsFilter.toString());
    }

    return `?${params.toString()}`;
  };

  const handleValueChange = (value: string) => {
    const url = buildEmployeeFilterUrl(value);
    router.push(url);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor="employee-filter">Filter by Employee</Label>
      </div>
      <Select value={currentEmployeeFilter.toString()} onValueChange={handleValueChange}>
        <SelectTrigger className="w-62.5">
          <SelectValue placeholder="All Employees" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Employees</SelectItem>
          {employees
            .filter((employee) => employee.id !== undefined && employee.id !== null)
            .map((employee) => {
              const empId = employee.id!;
              return (
                <SelectItem key={empId.toString()} value={empId.toString()}>
                  {employee.name}
                </SelectItem>
              );
            })}
        </SelectContent>
      </Select>
    </div>
  );
}