"use client";

import ProformaInvoiceListingPage from "./listing";

// My PIs: the same backend-filtered list, limited by the API to invoices
// the current user prepared.
export default function ProformaInvoicemyListingPage() {
  return <ProformaInvoiceListingPage mine />;
}
