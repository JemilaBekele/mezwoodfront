/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { IBank } from '@/models/bank';
import { createBank, updateBank } from '@/service/bank';

interface BankFormProps {
  initialData: IBank | null;
  closeModal: () => void;
  isEdit?: boolean;
}

export default function BankForm({
  initialData,
  closeModal,
  isEdit = false
}: BankFormProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [bankName, setBankName] = useState(initialData?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(
    initialData?.accountNumber || ''
  );
  const [errors, setErrors] = useState<{
    bankName?: string;
    accountNumber?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }

    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isEdit && initialData?.id) {
        await updateBank(initialData.id, {
          bankName,
          accountNumber
        });
        toast.success('Bank updated successfully');
      } else {
        await createBank({
          bankName,
          accountNumber
        });
        toast.success('Bank created successfully');
      }

      router.refresh();
      closeModal();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save bank');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          {isEdit ? 'Edit Bank' : 'Create Bank'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bank Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Bank Name</label>
            <Input
              placeholder="Enter bank name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
            {errors.bankName && (
              <p className="text-sm text-red-500">{errors.bankName}</p>
            )}
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Account Number</label>
            <Input
              placeholder="Enter account number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
            {errors.accountNumber && (
              <p className="text-sm text-red-500">
                {errors.accountNumber}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isEdit ? 'Update Bank' : 'Create Bank'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
