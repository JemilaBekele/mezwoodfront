'use client';

import { useEffect, useState } from 'react';
import { getEmployeeById } from '@/service/employee';
import { IEmployee } from '@/models/employee';
import EmployeeForm from './formwithoutpass';

type TEmployeeViewPageProps = {
  id: string;
};

export default function EmployeeViewPage({
  id
}: TEmployeeViewPageProps) {
  const [employee, setEmployee] = useState<IEmployee | null>(null);
  const [loading, setLoading] = useState(id !== 'new');

  const pageTitle =
    id === 'new' ? 'Create New Employee' : 'Edit Employee';

  useEffect(() => {
    const fetchEmployee = async () => {
      if (id === 'new') {
        setLoading(false);
        return;
      }

      try {
        const response = await getEmployeeById(id);
        setEmployee(response || null);
      } catch (error) {
        console.error('Failed to fetch employee:', error);
        setEmployee(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <EmployeeForm
      initialData={employee}
      pageTitle={pageTitle}
    />
  );
}