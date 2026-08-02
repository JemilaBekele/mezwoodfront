
import { getProformaInvoiceId } from '@/service/ProformaInvoice';
import { IProformaInvoice } from '@/models/ProformaInvoice';
import { toast } from 'sonner';
import SecoProformaInvoiceForm from './secontupdate';

type TProformaInvoiceViewPageProps = {
  invoiceId: string;
};

export default async function SecoProformaInvoiceViewPage({
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
    <SecoProformaInvoiceForm
      initialData={invoice}
      pageTitle={pageTitle}
    />
  );
}
