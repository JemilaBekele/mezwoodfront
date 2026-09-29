/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertModal } from '@/components/modal/alert-modal';
import { IBank } from '@/models/bank';
import { IProformaInvoiceBank } from '@/models/ProformaInvoice';
import { deleteProformaPayment, updateProformaPayment } from '@/service/paymentsReport';
import { getBanks } from '@/service/bank';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

const errorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

// Local yyyy-mm-dd (toISOString would shift the day in UTC+3)
const toInputDate = (value?: Date | string) => {
  const date = value ? new Date(value) : new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatETB = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(amount || 0);

/**
 * Edit / delete buttons for one PI payment row.
 * The backend re-computes the invoice's amount paid, balance and payment status;
 * `onChanged` reloads the invoice so the page shows the new totals.
 */
export function PaymentRowActions({
  payment,
  banks,
  maxAmount,
  onChanged,
}: {
  payment: IProformaInvoiceBank;
  banks: IBank[];
  /** Highest amount this payment may have = its amount + the invoice's remaining balance */
  maxAmount: number;
  onChanged: () => Promise<void> | void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedBanks, setLoadedBanks] = useState<IBank[]>([]);
  const bankOptions = banks.length > 0 ? banks : loadedBanks;
  const [form, setForm] = useState({
    amount: Number(payment.amount) || 0,
    bankId: payment.bankId,
    paidBy: payment.paidBy || '',
    date: toInputDate(payment.createdAt),
  });

  const openEdit = () => {
    setForm({
      amount: Number(payment.amount) || 0,
      bankId: payment.bankId,
      paidBy: payment.paidBy || '',
      date: toInputDate(payment.createdAt),
    });
    setEditOpen(true);
    // The page loads banks only for its "Record Payment" dialog
    if (banks.length === 0 && loadedBanks.length === 0) {
      getBanks()
        .then((list) => setLoadedBanks(list || []))
        .catch(() => toast.error('Failed to load banks'));
    }
  };

  const tooMuch = form.amount > maxAmount + 0.005;

  const onSave = async () => {
    if (!(form.amount > 0)) {
      toast.error('Amount must be greater than zero');
      return;
    }
    if (tooMuch) {
      toast.error(`Amount cannot be more than ${formatETB(maxAmount)}`);
      return;
    }
    setSaving(true);
    try {
      await updateProformaPayment(payment.id, {
        amount: form.amount,
        bankId: form.bankId,
        paidBy: form.paidBy,
        date: form.date,
      });
      toast.success('Payment updated');
      setEditOpen(false);
      await onChanged();
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to update payment'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    setSaving(true);
    try {
      await deleteProformaPayment(payment.id);
      toast.success('Payment deleted');
      setDeleteOpen(false);
      await onChanged();
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to delete payment'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={openEdit}
          aria-label="Edit payment"
          title="Edit payment"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
                                    <PermissionGuard requiredPermission={PERMISSIONS.PROFORMA_INVOICE.DELETE_PAYMENT.name} fallback="hide">
        
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
          onClick={() => setDeleteOpen(true)}
          aria-label="Delete payment"
          title="Delete payment"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
           </PermissionGuard>
      </div>

      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={(open) => !saving && setEditOpen(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>
              Total paid and balance of this invoice are updated automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={`edit-amount-${payment.id}`} className="text-xs">
                Amount (ETB)
              </Label>
              <Input
                id={`edit-amount-${payment.id}`}
                type="text"
                inputMode="decimal"
                className="font-mono"
                value={form.amount ? form.amount.toLocaleString('en-US') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/,/g, '').replace(/[^\d.]/g, '');
                  setForm({ ...form, amount: parseFloat(raw) || 0 });
                }}
                placeholder="0.00"
              />
              <p className={`text-[11px] ${tooMuch ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                Maximum for this payment: {formatETB(maxAmount)}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`edit-date-${payment.id}`} className="text-xs">
                Payment Date
              </Label>
              <Input
                id={`edit-date-${payment.id}`}
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Bank Account</Label>
              <Select value={form.bankId} onValueChange={(value) => setForm({ ...form, bankId: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {/* Keep the current bank selectable even before the bank list loads */}
                  {!bankOptions.some((b) => b.id === payment.bankId) && payment.bank && (
                    <SelectItem value={payment.bankId}>{payment.bank.bankName}</SelectItem>
                  )}
                  {bankOptions.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id || ''}>
                      {bank.bankName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`edit-paidby-${payment.id}`} className="text-xs">
                Payer Name
              </Label>
              <Input
                id={`edit-paidby-${payment.id}`}
                value={form.paidBy}
                onChange={(e) => setForm({ ...form, paidBy: e.target.value })}
                placeholder="Person or organization name"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={saving || !form.bankId || tooMuch}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onDelete}
        loading={saving}
      />
    </>
  );
}
