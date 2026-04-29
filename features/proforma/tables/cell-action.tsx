/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

import {
  IconEdit,
  IconDotsVertical,
  IconTrash,
  IconUpload,
  IconCheck,
  IconX as IconReject
} from '@tabler/icons-react';
import { Edit } from 'lucide-react';

import {
  deleteProforma,
  uploadProformaFiles,
  approveProforma,
  rejectProforma,
  convertProformaToSale
} from '@/service/proforma';

import { IProforma } from '@/models/proforma';
import { normalizeImagePath } from '@/lib/norm';

interface ProformaCellActionProps {
  data: IProforma;
}

export const ProformaCellAction: React.FC<ProformaCellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const router = useRouter();

  const normalizedImageUrl = normalizeImagePath(data.imageUrl);
  const normalizedDocumentUrl = normalizeImagePath(data.documentUrl);

  // DELETE
  const onConfirm = async () => {
    if (!data?.id) {
      toast.error('Proforma ID is missing');
      return;
    }

    setLoading(true);
    try {
      await deleteProforma(data.id);
      setOpen(false);
      router.refresh();
      toast.success('Proforma deleted successfully');
    } catch {
      toast.error('Error deleting proforma');
    } finally {
      setLoading(false);
    }
  };

  // APPROVE
  const handleApprove = async () => {
    try {
      await approveProforma(data.id);
      toast.success('Proforma approved');
      router.refresh();
    } catch {
      toast.error('Failed to approve');
    }
  };

  // REJECT
  const handleReject = async () => {
    try {
      await rejectProforma(data.id);
      toast.success('Proforma rejected');
      router.refresh();
    } catch {
      toast.error('Failed to reject');
    }
  };

  // CONVERT TO SALE
  const handleConvert = async () => {
    try {
      await convertProformaToSale(data.id);
      toast.success('Converted to sale');
      router.refresh();
    } catch {
      toast.error('Conversion failed');
    }
  };

  // FILE UPLOAD
  const handleFileUpload = async () => {
    if (!selectedImage && !selectedDocument) {
      toast.error('Select at least one file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      if (selectedImage) formData.append('image', selectedImage);
      if (selectedDocument) formData.append('document', selectedDocument);

      await uploadProformaFiles(data.id, formData);

      toast.success('Files uploaded');
      setOpenUploadDialog(false);
      setSelectedImage(null);
      setSelectedDocument(null);
      setImagePreview(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  // IMAGE CHANGE
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid image');
      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // DOCUMENT CHANGE
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedDocument(file);
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      />

      {/* Upload Dialog */}
      <Dialog open={openUploadDialog} onOpenChange={setOpenUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Proforma #{data.proformaNo}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* IMAGE */}
            <div>
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={handleImageChange} />

              {imagePreview && (
                <div className="mt-2 relative w-full h-40">
                  <Image src={imagePreview} alt="preview" fill className="object-contain" />
                </div>
              )}

              {!selectedImage && normalizedImageUrl && (
                <Image src={normalizedImageUrl} alt="existing" width={200} height={200} />
              )}
            </div>

            {/* DOCUMENT */}
            <div>
              <Label>Document</Label>
              <Input type="file" onChange={handleDocumentChange} />

              {normalizedDocumentUrl && (
                <a href={normalizedDocumentUrl} target="_blank" className="text-blue-500 text-sm">
                  View Document
                </a>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedImage(null);
              setSelectedDocument(null);
              setImagePreview(null);
            }}>
              Clear
            </Button>

            <Button onClick={handleFileUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ACTION MENU */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          {/* Upload */}
          <DropdownMenuItem onClick={() => setOpenUploadDialog(true)}>
            <IconUpload className="mr-2 h-4 w-4" /> Upload Files
          </DropdownMenuItem>

          {/* Update */}
          {data.status !== 'APPROVED' && (
            <DropdownMenuItem onClick={() => router.push(`/dashboard/proforma/${data.id}`)}>
              <IconEdit className="mr-2 h-4 w-4" /> Update
            </DropdownMenuItem>
          )}

          {/* View */}
          <DropdownMenuItem onClick={() => router.push(`/dashboard/proforma/view?id=${data.id}`)}>
            <Edit className="mr-2 h-4 w-4" /> View
          </DropdownMenuItem>

          {/* Approve */}
          {data.status === 'PENDING' && (
            <DropdownMenuItem onClick={handleApprove}>
              <IconCheck className="mr-2 h-4 w-4" /> Approve
            </DropdownMenuItem>
          )}

          {/* Reject */}
          {data.status === 'PENDING' && (
            <DropdownMenuItem onClick={handleReject}>
              <IconReject className="mr-2 h-4 w-4" /> Reject
            </DropdownMenuItem>
          )}

          {/* Convert */}
          {data.status === 'APPROVED' && (
            <DropdownMenuItem onClick={handleConvert}>
              <IconCheck className="mr-2 h-4 w-4" /> Convert to Sale
            </DropdownMenuItem>
          )}

          {/* Delete */}
          {data.status !== 'APPROVED' && (
            <DropdownMenuItem onClick={() => setOpen(true)}>
              <IconTrash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};