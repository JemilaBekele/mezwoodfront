'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { getCustomerById } from '@/service/customer';
import CustomerForm from './form';
import { ICustomer } from '@/models/customer';

type TCustomerViewPageProps = {
  customerId: string;
};

export default function CustomerViewPage({
  customerId
}: TCustomerViewPageProps) {
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [pageTitle, setPageTitle] = useState('Create New Customer');

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        setLoading(true);

        if (customerId !== 'new') {
          const data = await getCustomerById(customerId);

          if (data) {
            setCustomer(data as ICustomer);
            setPageTitle('Edit Customer');
          }
        }
      } catch (error) {
        console.error('Error loading customer:', error);
        toast.error('Failed to load customer');
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        Loading...
      </div>
    );
  }

  return (
    <CustomerForm
      initialData={customer}
      pageTitle={pageTitle}
    />
  );
}