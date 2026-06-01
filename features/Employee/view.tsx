'use client';

import { getEmployeeById } from '@/service/employee';
import { IEmployee } from '@/models/employee';
import EmployeeForm from './formwithoutpass';
import { useEffect, useState } from 'react';

type TEmployeeViewPageProps = {
  id: string;
};

export default function EmployeeViewPage({ id }: TEmployeeViewPageProps) {
  const [employee, setEmployee] = useState<IEmployee | null>(null);
  const [pageTitle, setPageTitle] = useState('Create New Employee');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmployee() {
      if (id === 'new') {
        setPageTitle('Create New Employee');
        setEmployee(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await getEmployeeById(id);
        const employeeData = response || null;

        if (!employeeData) {
          console.warn(`Employee with ID ${id} not found`);
          setPageTitle('Create New Employee');
          setEmployee(null);
        } else {
          setPageTitle('Edit Employee');
          setEmployee(employeeData);
        }
      } catch (err) {
        console.error('Error fetching employee:', err);
        setError('Failed to load employee data');
        setPageTitle('Create New Employee');
        setEmployee(null);
      } finally {
        setLoading(false);
      }
    }

    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return <EmployeeForm initialData={employee} pageTitle={pageTitle} />;
}