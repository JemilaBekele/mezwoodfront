'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertModal } from '@/components/modal/alert-modal';

import {
  IconDotsVertical,
  IconTrash} from '@tabler/icons-react';

import {
  IDeliveryEstimation,
  EstimationStatus,
} from '@/models/delivery-estimation';

import {
  deleteDeliveryEstimation,
  updateDeliveryEstimationStatus,
  confirmDeliveryEstimation,
} from '@/service/delivery-estimation';
import CreateProjectFromEstimationModal from './CreateProjectFromEstimationModal';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

interface DeliveryEstimationCellActionProps {
  data: IDeliveryEstimation;
}

export const DeliveryEstimationCellAction: React.FC<
  DeliveryEstimationCellActionProps
> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openCreateProjectModal, setOpenCreateProjectModal] = useState(false); // ⭐ NEW STATE

  const router = useRouter();

  /* ---------------- DELETE ---------------- */
  const onConfirmDelete = async () => {
    if (!data?.id) {
      toast.error('Delivery estimation ID is missing.');
      return;
    }

    setLoading(true);
    try {
      await deleteDeliveryEstimation(data.id);
      toast.success('Delivery estimation deleted successfully');
      router.refresh();
      setOpenDeleteModal(false);
    } catch {
      toast.error('Failed to delete delivery estimation.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- STATUS UPDATE ---------------- */
  const onUpdateStatus = async (status: EstimationStatus) => {
    if (!data?.id) {
      toast.error('Delivery estimation ID is missing.');
      return;
    }

    setLoading(true);
    try {
      await updateDeliveryEstimationStatus(data.id, status);
      toast.success(`Status updated to ${status}`);
      router.refresh();
    } catch {
      toast.error('Failed to update delivery estimation status.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- CONFIRM ---------------- */
  const onConfirmEstimation = async () => {
    if (!data?.id) {
      toast.error('Delivery estimation ID is missing.');
      return;
    }

    setLoading(true);
    try {
      await confirmDeliveryEstimation(data.id);
      toast.success('Delivery estimation confirmed.');
      router.refresh();
    } catch {
      toast.error('Failed to confirm delivery estimation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ⭐ Create Project Modal */}
      <CreateProjectFromEstimationModal
        isOpen={openCreateProjectModal}
        onClose={() => setOpenCreateProjectModal(false)}
      />

      {/* Delete confirmation modal */}
      <AlertModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
      />

      {/* Action dropdown */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>


 
       
  <PermissionGuard
            requiredPermission={PERMISSIONS.DELIVERY_ESTIMATION.DELETE.name}
          >
          {/* Delete */}
          <DropdownMenuItem onClick={() => setOpenDeleteModal(true)}>
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem></PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};