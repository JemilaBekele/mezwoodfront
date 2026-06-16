'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { autoScheduleProjectStages, manualScheduleProjectStage } from '@/service/Project';


interface ProjectScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess?: () => void;
}

export const ProjectScheduleModal: React.FC<ProjectScheduleModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [manualDelivery, setManualDelivery] = useState('');

  /* ===============================
     Auto Schedule
  =============================== */
  const handleAutoSchedule = async () => {
    setLoading(true);
    try {
      await autoScheduleProjectStages(projectId);
      toast.success('Project stages auto-scheduled successfully');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to auto schedule project');
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     Manual Schedule
  =============================== */
  const handleManualSchedule = async () => {
    if (!manualDelivery) {
      toast.error('Please select a delivery date');
      return;
    }

    setLoading(true);
    try {
      await manualScheduleProjectStage(projectId, manualDelivery);
      toast.success('Project scheduled with manual delivery date');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Schedule Project"
      description="Choose how you want to schedule the project stages"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="space-y-6">
        {/* AUTO SCHEDULE */}
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-medium">Auto Schedule</h3>
          <p className="text-sm text-muted-foreground">
            Automatically calculate and schedule all project stages
          </p>
          <Button
            onClick={handleAutoSchedule}
            disabled={loading}
            className="w-full"
          >
            Auto Schedule
          </Button>
        </div>

        {/* MANUAL SCHEDULE */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-medium">Manual Delivery Date</h3>

          <Input
            type="date"
            value={manualDelivery}
            onChange={(e) => setManualDelivery(e.target.value)}
          />

          <Button
            variant="outline"
            onClick={handleManualSchedule}
            disabled={loading}
            className="w-full"
          >
            Schedule Manually
          </Button>
        </div>
      </div>
    </Modal>
  );
};
