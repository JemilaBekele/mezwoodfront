/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import {
  addSellPayment,
  getSellPaymentHistory,
  uploadSellFiles,
} from '@/service/Sell';

import { getBanks } from '@/service/bank';
import { IBank } from '@/models/bank';

import { IconFile, IconUpload, IconX } from '@tabler/icons-react';
import { normalizeImagePath } from '@/lib/norm';

import Image from 'next/image';

interface SellPaymentModalProps {
  open: boolean;
  onClose: () => void;
  sellId: string;
  invoiceNo?: string;
  total?: number;
  existingImageUrl?: string | null;
  existingDocumentUrl?: string | null;
}

export const SellPaymentModal: React.FC<SellPaymentModalProps> = ({
  open,
  onClose,
  sellId,
  invoiceNo,
  total,
  existingImageUrl,
  existingDocumentUrl,
}) => {
  const [loading, setLoading] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [paidBy, setPaidBy] = useState('');

  const [banks, setBanks] = useState<IBank[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // File states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [uploadingFiles, setUploadingFiles] = useState(false);

  const fetchBanks = useCallback(async () => {
    try {
      const res = await getBanks();
      setBanks(res || []);
    } catch (error) {
      console.error('Failed to fetch banks:', error);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getSellPaymentHistory(sellId);
      setSummary(res || null);
    } catch (error) {
      console.error(error);
    }
  }, [sellId]);

  const resetFileStates = () => {
    setSelectedImage(null);
    setSelectedDocument(null);
    setImagePreview(null);
  };

  useEffect(() => {
    if (open) {
      fetchSummary();
      fetchBanks();
      resetFileStates();
    }
  }, [open, fetchBanks, fetchSummary]);

  // =========================
  // Image Upload
  // =========================

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        toast.error('Image size should be less than 20MB');
        return;
      }

      setSelectedImage(file);

      const reader = new FileReader();

      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };

      reader.readAsDataURL(file);
    }
  };

  // =========================
  // Document Upload
  // =========================

  const handleDocumentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 20 * 1024 * 1024) {
        toast.error('Document size should be less than 20MB');
        return;
      }

      setSelectedDocument(file);
    }
  };

  // =========================
  // Upload Files Only
  // =========================

  const handleUploadFilesOnly = async () => {
    if (!selectedImage && !selectedDocument) {
      toast.error('Please select at least one file');
      return;
    }

    setUploadingFiles(true);

    try {
      const formData = new FormData();

      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      if (selectedDocument) {
        formData.append('document', selectedDocument);
      }

      await uploadSellFiles(sellId, formData);

      toast.success('Files uploaded successfully');

      resetFileStates();

      await fetchSummary();
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          'Error uploading files'
      );
    } finally {
      setUploadingFiles(false);
    }
  };

  // =========================
  // Upload Files With Payment
  // =========================

  const uploadFilesWithPayment = async () => {
    if (!selectedImage && !selectedDocument) {
      return true;
    }

    try {
      const formData = new FormData();

      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      if (selectedDocument) {
        formData.append('document', selectedDocument);
      }

      await uploadSellFiles(sellId, formData);

      toast.success('Files uploaded successfully');

      resetFileStates();

      return true;
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          'Error uploading files'
      );

      return false;
    }
  };

  // =========================
  // Add Payment
  // =========================

  const handleAddPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Enter valid amount');
      return;
    }

    if (!selectedBankId) {
      toast.error('Please select a bank');
      return;
    }

    if (!paidBy || paidBy.trim() === '') {
      toast.error('Please enter who paid');
      return;
    }

    const currentBalance = summary?.balance || 0;

    if (Number(paymentAmount) > currentBalance) {
      toast.error(
        `Payment amount cannot exceed remaining balance of ${currentBalance}`
      );
      return;
    }

    setLoading(true);

    try {
      await addSellPayment(sellId, {
        amount: Number(paymentAmount),
        bankId: selectedBankId,
        paidBy: paidBy.trim(),
      });

      toast.success('Payment added successfully');

      // Upload files after payment
      await uploadFilesWithPayment();

      const newTotalPaid =
        (summary?.totalPaid || 0) + Number(paymentAmount);

      if (
        newTotalPaid >=
        (total || summary?.grandTotal || 0)
      ) {
        toast.success('Invoice is now fully paid!');
      }

      setPaymentAmount('');
      setPaidBy('');
      setSelectedBankId('');

      await fetchSummary();

      // DO NOT CLOSE MODAL
      // This keeps upload inputs active
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Payment failed'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Helpers
  // =========================

  const isAddPaymentDisabled = () => {
    if (loading || uploadingFiles) return true;

    if (!paymentAmount || Number(paymentAmount) <= 0)
      return true;

    if (!selectedBankId) return true;

    if (!paidBy || paidBy.trim() === '') return true;

    const currentBalance = summary?.balance || 0;

    if (Number(paymentAmount) > currentBalance)
      return true;

    return false;
  };

  // IMPORTANT FIX
  // Upload fields disabled ONLY while uploading
  const isUploadDisabled = () => {
    return uploadingFiles;
  };

  const hasFilesSelected = () => {
    return !!(selectedImage || selectedDocument);
  };

  const remainingBalance = summary?.balance || 0;

  const isFullyPaid =
    remainingBalance === 0 &&
    (summary?.totalPaid || 0) > 0;

  const normalizedExistingImage = normalizeImagePath(
    existingImageUrl ?? undefined
  );

  const normalizedExistingDocument = normalizeImagePath(
    existingDocumentUrl ?? undefined
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Sell Payment & Documents
          </DialogTitle>

          <DialogDescription>
            Invoice #{invoiceNo}

            {isFullyPaid && (
              <span className="ml-2 text-green-600 font-semibold">
                (Fully Paid)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}

        <div className="space-y-3">
          <div>
            <Label>Grand Total</Label>

            <Input
              value={total || summary?.grandTotal || 0}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label>Total Paid</Label>

            <Input
              value={summary?.totalPaid || 0}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label>Remaining Balance</Label>

            <Input
              value={remainingBalance}
              disabled
              className={`font-bold ${
                isFullyPaid
                  ? 'text-green-600 bg-green-50'
                  : 'text-blue-600 bg-blue-50'
              }`}
            />
          </div>
        </div>

        {/* Payment Form */}

        {!isFullyPaid && (
          <div className="space-y-3 mt-4">
            <div>
              <Label htmlFor="amount">
                Payment Amount *
              </Label>

              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder={`Max: ${remainingBalance}`}
                value={paymentAmount}
                onChange={(e) =>
                  setPaymentAmount(e.target.value)
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="bank">Bank *</Label>

              <Select
                value={selectedBankId}
                onValueChange={setSelectedBankId}
                disabled={loading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>

                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem
                      key={bank.id}
                      value={bank.id}
                    >
                      {bank.bankName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="paidBy">
                Paid By *
              </Label>

              <Input
                id="paidBy"
                type="text"
                placeholder="Customer name or payment method"
                value={paidBy}
                onChange={(e) =>
                  setPaidBy(e.target.value)
                }
                className="mt-1"
              />
            </div>
          </div>
        )}

        {/* Upload Section */}

        <div
          className={`mt-4 pt-4 border-t ${
            isFullyPaid ? 'mt-0' : ''
          }`}
        >
          <Label className="text-sm font-semibold mb-2 block">
            <IconUpload className="inline h-4 w-4 mr-1" />
            Upload Documents
          </Label>

          {/* Image */}

          <div className="space-y-2 mb-4">
            <Label className="text-xs text-gray-600">
              Invoice Image
            </Label>

            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="flex-1 text-sm"
                disabled={isUploadDisabled()}
              />

              {selectedImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="text-red-500"
                  disabled={uploadingFiles}
                >
                  <IconX size={16} />
                </Button>
              )}
            </div>

            {imagePreview && (
              <div className="mt-2">
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            {!selectedImage &&
              normalizedExistingImage && (
                <div className="mt-2">
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <Image
                      src={normalizedExistingImage}
                      alt="Current invoice image"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
          </div>

          {/* Document */}

          <div className="space-y-2">
            <Label className="text-xs text-gray-600">
              Supporting Document
            </Label>

            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*"
                onChange={handleDocumentChange}
                className="flex-1 text-sm"
                disabled={isUploadDisabled()}
              />

              {selectedDocument && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSelectedDocument(null)
                  }
                  className="text-red-500"
                  disabled={uploadingFiles}
                >
                  <IconX size={16} />
                </Button>
              )}
            </div>

            {selectedDocument && (
              <div className="mt-2 p-2 bg-gray-50 rounded border">
                <div className="flex items-center gap-2">
                  <IconFile className="h-5 w-5 text-blue-500" />

                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {selectedDocument.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      {(
                        selectedDocument.size / 1024
                      ).toFixed(2)}{' '}
                      KB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {normalizedExistingDocument &&
              !selectedDocument && (
                <div className="mt-2">
                  <a
                    href={normalizedExistingDocument}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-2 bg-gray-50 rounded border"
                  >
                    <IconFile className="h-4 w-4" />

                    <span>
                      View Existing Document
                    </span>
                  </a>
                </div>
              )}
          </div>

          {/* Upload Button */}

          {hasFilesSelected() && (
            <div className="mt-4">
              <Button
                type="button"
                onClick={handleUploadFilesOnly}
                disabled={uploadingFiles}
                variant="outline"
                className="w-full"
              >
                {uploadingFiles
                  ? 'Uploading...'
                  : 'Upload Documents Only'}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading || uploadingFiles}
          >
            Cancel
          </Button>

          {!isFullyPaid && (
            <Button
              onClick={handleAddPayment}
              disabled={isAddPaymentDisabled()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading
                ? 'Processing...'
                : 'Add Payment & Upload'}
            </Button>
          )}

          {isFullyPaid && hasFilesSelected() && (
            <Button
              onClick={handleUploadFilesOnly}
              disabled={uploadingFiles}
              className="bg-green-600 hover:bg-green-700"
            >
              {uploadingFiles
                ? 'Uploading...'
                : 'Upload Documents'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};