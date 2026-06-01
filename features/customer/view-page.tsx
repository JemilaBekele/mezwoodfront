import { getCustomerById } from '@/service/customer';
import CustomerForm from './form';
import { ICustomer } from '@/models/customer';

type TCustomerViewPageProps = {
  customerId: string;
};

export default async function CustomerViewPage({
  customerId
}: TCustomerViewPageProps) {
  let customer: ICustomer | null = null;
  let pageTitle = 'Create New Customer';

  if (customerId !== 'new') {
    const data = await getCustomerById(customerId);
    customer = data as ICustomer;
    pageTitle = 'Edit Customer';
  }

  return <CustomerForm initialData={customer} pageTitle={pageTitle} />;
}
