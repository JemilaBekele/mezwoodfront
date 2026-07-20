/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

import { IconEdit, IconDotsVertical, IconTrash, IconWallet, IconX, IconFile, IconUpload } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { deleteSell, uploadSellFiles } from '@/service/Sell';
import { ISell } from '@/models/Sell';
import { Edit } from 'lucide-react';
import { SellPaymentModal } from '../../userbased/tables/SellPaymentModal';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label'; // FIXED: Changed import from 'recharts' to '@/components/ui/label'
import { Input } from '@/components/ui/input';
import { normalizeImagePath } from '@/lib/norm';
import Image from 'next/image'; // FIXED: Added missing Image import

interface SellCellActionProps {
  data: ISell;
}

export const SellCellAction: React.FC<SellCellActionProps> = ({ data }) => {
   const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  // Normalize image and document URLs
  const normalizedImageUrl = normalizeImagePath(data.imageUrl);
  const normalizedDocumentUrl = normalizeImagePath(data.documentUrl);

  const onConfirm = async () => {
    if (!data?.id) {
      toast.error('Sell ID is missing. Cannot delete sell.');
      return;
    }

    setLoading(true);
    try {
      await deleteSell(data.id);
      setOpen(false);
      router.refresh();
      toast.success('Sell deleted successfully');
    } catch {
      toast.error('Error deleting sell. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedImage && !selectedDocument) {
      toast.error('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      if (selectedDocument) {
        formData.append('document', selectedDocument);
      }

      await uploadSellFiles(data.id, formData);
      toast.success('Files uploaded successfully');
      setOpenUploadDialog(false);
      setSelectedImage(null);
      setSelectedDocument(null);
      setImagePreview(null);
      router.refresh();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.response?.data?.message || 'Error uploading files');
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Image size should be less than 20MB');
        return;
      }
      setSelectedImage(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Document size should be less than 20MB');
        return;
      }
      setSelectedDocument(file);
    }
  };

  const clearSelectedFiles = () => {
    setSelectedImage(null);
    setSelectedDocument(null);
    setImagePreview(null);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      />
      {/* Sell Payment Modal */}
      <SellPaymentModal
        open={openPaymentModal}
        onClose={() => setOpenPaymentModal(false)}
        sellId={data.id}
        invoiceNo={data.invoiceNo}
        total={data.grandTotal}
         existingImageUrl={data.imageUrl}
  existingDocumentUrl={data.documentUrl}
      />
      {/* Upload Files Dialog */}
      <Dialog open={openUploadDialog} onOpenChange={setOpenUploadDialog}>
        <DialogContent className="sm:max-w-125 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Upload image or document for sell invoice #{data.invoiceNo}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Image Upload with Preview */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Image
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1"
                  />
                  {selectedImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeSelectedImage}
                      className="text-red-500"
                    >
                      <IconX size={16} />
                    </Button>
                  )}
                </div>
                
                {/* Preview for new image */}
                {imagePreview && (
                  <div className="mt-2 relative">
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedImage?.name} {selectedImage?.size !== undefined ? `(${(selectedImage.size / 1024).toFixed(2)} KB)` : ''}
                    </p>
                  </div>
                )}

                {/* Display existing image with normalized URL */}
                {!selectedImage && normalizedImageUrl && (
                  <div className="mt-2">
                    <p className="text-sm text-blue-600 mb-1">Current image:</p>
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                      <Image
                        src={normalizedImageUrl}
                        alt="Current invoice image"
                        fill
                        className="object-contain"
                        onError={(e) => {
                          console.error('Failed to load image:', normalizedImageUrl);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <a
                      href={normalizedImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                    >
                      View full size
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Document Upload */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="document" className="text-right">
                Document
              </Label>
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <Input
                    id="document"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*"
                    onChange={handleDocumentChange}
                    className="flex-1"
                  />
                  {selectedDocument && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDocument(null)}
                      className="text-red-500"
                    >
                      <IconX size={16} />
                    </Button>
                  )}
                </div>
                
                {/* Preview for new document */}
                {selectedDocument && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border">
                    <div className="flex items-center gap-2">
                      <IconFile className="h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{selectedDocument.name}</p>
                        <p className="text-xs text-gray-500">
                          {(selectedDocument.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Display existing document with normalized URL */}
                {normalizedDocumentUrl && !selectedDocument && (
                  <div className="mt-2">
                    <p className="text-sm text-blue-600 mb-1">Current document:</p>
                    <a
                      href={normalizedDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-2 bg-gray-50 rounded border"
                    >
                      <IconFile className="h-4 w-4" />
                      <span>View Document</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={clearSelectedFiles}
            >
              Clear All
            </Button>
            <Button
              type="button"
              onClick={handleFileUpload}
              disabled={uploading || (!selectedImage && !selectedDocument)}
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          
          {(data.saleStatus === 'APPROVED' ||
            data.saleStatus === 'NOT_APPROVED') && (
            <PermissionGuard requiredPermission={PERMISSIONS.SELL.UPDATE.name}>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/Sell/${data.id}`)}
              >
                <IconEdit className='mr-2 h-4 w-4' /> Update
              </DropdownMenuItem>
            </PermissionGuard>
          )}
          <PermissionGuard requiredPermission={PERMISSIONS.SELL.ADD_PAYMENT.name}>
            <DropdownMenuItem onClick={() => setOpenPaymentModal(true)}>
              <IconWallet className='mr-2 h-4 w-4' /> Add Payment
            </DropdownMenuItem>
          </PermissionGuard>
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/Sell/view?id=${data.id}`)}
          >
            <Edit className='mr-2 h-4 w-4' /> View
          </DropdownMenuItem>
          
        

          <PermissionGuard requiredPermission={PERMISSIONS.SELL.DELETE.name}>
            <DropdownMenuItem onClick={() => setOpen(true)}>
              <IconTrash className='mr-2 h-4 w-4' /> Delete
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};