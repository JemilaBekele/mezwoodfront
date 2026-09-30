/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Banknote, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IProformaInvoice } from '@/models/ProformaInvoice';
import { IBank } from '@/models/bank';
import { addPaymentToProformaInvoice, getProformaInvoiceById } from '@/service/ProformaInvoice';
import { getBanks } from '@/service/bank';

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'ETB 0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(amount);
};

const emptyPayment = () => ({
  amountPaid: 0,
  amountDate: new Date().toISOString().split('T')[0],
  bankId: '',
  paidBy: '',
});

// Record Payment modal (same flow as the PI detail page): form -> confirm -> addPaymentToProformaInvoice
export function RecordPaymentModal({
  invoice,
  open,
  onOpenChange,
  onPaid,
}: {
  invoice: IProformaInvoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaid?: (updated: IProformaInvoice) => void;
}) {
  const [paymentData, setPaymentData] = useState(emptyPayment);
  const [banks, setBanks] = useState<IBank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);

  const balance = Number(invoice.balance ?? 0);

  // Fetch banks when the dialog opens; reset the form when it closes
  useEffect(() => {
    if (!open) {
      setPaymentData(emptyPayment());
      return;
    }
    const fetchBanksData = async () => {
      try {
        setLoadingBanks(true);
        const banksData = await getBanks();
        setBanks(banksData);
        if (banksData.length > 0) {
          setPaymentData((prev) => (prev.bankId ? prev : { ...prev, bankId: banksData[0].id || '' }));
        }
      } catch (error: any) {
        toast.error('Failed to fetch banks');
        console.error('Error fetching banks:', error);
      } finally {
        setLoadingBanks(false);
      }
    };
    fetchBanksData();
  }, [open]);

  const handlePaymentRequest = () => {
    if (!paymentData.amountPaid || paymentData.amountPaid <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    if (!paymentData.bankId) {
      toast.error('Please select a bank');
      return;
    }
    if (!paymentData.paidBy) {
      toast.error('Please enter the payer name');
      return;
    }
    if (paymentData.amountPaid > balance) {
      toast.error('Payment amount cannot exceed balance due');
      return;
    }
    setShowPaymentAlert(true);
  };

  const handlePaymentConfirm = async () => {
    if (!paymentData.amountPaid || paymentData.amountPaid <= 0) {
      setShowPaymentAlert(false);
      return;
    }

    setAddingPayment(true);
    try {
      await addPaymentToProformaInvoice(invoice.id, {
        amountPaid: paymentData.amountPaid,
        amountDate: paymentData.amountDate,
        bankId: paymentData.bankId,
        paidBy: paymentData.paidBy,
      });

      toast.success(`Payment of ${formatCurrency(paymentData.amountPaid)} added successfully`);
      setShowPaymentAlert(false);
      onOpenChange(false);

      const updatedInvoice = await getProformaInvoiceById(invoice.id);
      onPaid?.(updatedInvoice);
    } catch (error: any) {
      toast.error('Failed to add payment');
      console.error('Error adding payment:', error);
    } finally {
      setAddingPayment(false);
    }
  };

  const newBalance = balance - paymentData.amountPaid;
  const isFullyPaid = newBalance === 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">Record New Payment</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter details for payment received against invoice {invoice.piNumber || ''} balance.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4 bg-white dark:bg-card">
            <div className="space-y-1.5">
              <Label htmlFor={`amount-${invoice.id}`} className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payment Amount (ETB)</Label>
              <Input
                id={`amount-${invoice.id}`}
                type="text"
                className="h-9 rounded-lg border-slate-300 dark:border-slate-700 font-mono text-sm"
                value={paymentData.amountPaid ? paymentData.amountPaid.toLocaleString('en-US') : ''}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/,/g, '').replace(/[^\d.]/g, '');
                  setPaymentData({ ...paymentData, amountPaid: parseFloat(rawValue) || 0 });
                }}
                placeholder="0.00"
              />
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-mono">
                Remaining balance due: <strong>{formatCurrency(balance)}</strong>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`date-${invoice.id}`} className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payment Date</Label>
              <Input
                id={`date-${invoice.id}`}
                type="date"
                className="h-9 rounded-lg border-slate-300 dark:border-slate-700 text-xs font-mono"
                value={paymentData.amountDate}
                onChange={(e) => setPaymentData({ ...paymentData, amountDate: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bank Account</Label>
              {loadingBanks ? (
                <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 py-1">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading banks...
                </div>
              ) : banks.length > 0 ? (
                <Select
                  value={paymentData.bankId}
                  onValueChange={(value) => setPaymentData({ ...paymentData, bankId: value })}
                >
                  <SelectTrigger className="h-9 rounded-lg border-slate-300 dark:border-slate-700 text-xs">
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-slate-200 dark:border-slate-800">
                    {banks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id || ''} className="text-xs">
                        {bank.bankName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-rose-600 dark:text-rose-400 italic">No bank accounts available</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`paidBy-${invoice.id}`} className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payer Name</Label>
              <Input
                id={`paidBy-${invoice.id}`}
                className="h-9 rounded-lg border-slate-300 dark:border-slate-700 text-xs"
                value={paymentData.paidBy}
                onChange={(e) => setPaymentData({ ...paymentData, paidBy: e.target.value })}
                placeholder="Person or organization name"
              />
            </div>

            <Button
              onClick={handlePaymentRequest}
              disabled={addingPayment || !paymentData.bankId || !paymentData.paidBy}
              className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs mt-2"
            >
              Review Payment Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Alert Dialog */}
      <AlertDialog open={showPaymentAlert} onOpenChange={setShowPaymentAlert}>
        <AlertDialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Confirm Payment Entry
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-300 text-sm">
              Record a payment of {formatCurrency(paymentData.amountPaid)}?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-3 space-y-2 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300">Amount: {formatCurrency(paymentData.amountPaid)}</p>
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300">Current Balance: {formatCurrency(balance)}</p>
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300">New Balance: {formatCurrency(newBalance)}</p>
          </div>

          {isFullyPaid && (
            <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2 font-medium">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                This payment will fully settle the invoice balance.
              </p>
            </div>
          )}

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-lg border-slate-200 dark:border-slate-800">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handlePaymentConfirm();
              }}
              disabled={addingPayment}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {addingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Payment'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
