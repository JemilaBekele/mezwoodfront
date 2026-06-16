
import { getProformaInvoiceId } from '@/service/ProformaInvoice';
import ProformaInvoiceForm from './form';
import { IProformaInvoice } from '@/models/ProformaInvoice';
import { toast } from 'sonner';

type TProformaInvoiceViewPageProps = {
  invoiceId: string;
};

export default async function ProformaInvoiceViewPage({
  invoiceId
}: TProformaInvoiceViewPageProps) {
  let invoice: IProformaInvoice | null = null;
  let pageTitle = 'Create New Proforma Invoice';

  if (invoiceId !== 'new') {
    try {
      const data = await getProformaInvoiceId(invoiceId);
      invoice = data as IProformaInvoice | null;

      if (invoice) {
        pageTitle = `Edit Proforma Invoice: ${invoice.piNumber}`;
      }
    } catch {
      toast.error('Error loading proforma invoice');
    }
  }

  return (
    <ProformaInvoiceForm
      initialData={invoice}
      pageTitle={pageTitle}
    />
  );
}
