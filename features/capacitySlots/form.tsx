/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ICapacityLot, CapacityStage } from '@/models/CapacityLot';
import { createCapacitySlot, updateCapacitySlot } from '@/service/CapacityLot';

interface CapacityLotFormProps {
  initialData: ICapacityLot | null;
  closeModal: () => void;
  isEdit?: boolean;
}

export default function CapacityLotForm({
  initialData,
  closeModal,
  isEdit = false
}: CapacityLotFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState<CapacityStage>(initialData?.stage || CapacityStage.DESIGN);
  const [days, setDays] = useState<string>(initialData?.days?.toString() || '1');
  const [capacity, setCapacity] = useState<string>(initialData?.capacity?.toString() || '');
  const [workingHours, setWorkingHours] = useState<string>(initialData?.workingHours?.toString() || '7.5');
  const [parallelSlots, setParallelSlots] = useState<string>(initialData?.parallelSlots?.toString() || '1');

  const [errors, setErrors] = useState<{ stage?: string; days?: string; capacity?: string }>({});
  const router = useRouter();

  const validateForm = () => {
    const newErrors: { stage?: string; days?: string; capacity?: string } = {};
    
    if (!stage) {
      newErrors.stage = 'Stage is required';
    }
    
    const daysNum = parseInt(days, 10);
    if (!days || isNaN(daysNum) || daysNum < 1) {
      newErrors.days = 'Days must be at least 1';
    }
    
    if (capacity !== '') {
      const capacityNum = parseInt(capacity, 10);
      if (isNaN(capacityNum) || capacityNum < 0) {
        newErrors.capacity = 'Capacity must be a non-negative number';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const formData = {
        stage,
        days: 1,
        ...(capacity !== '' && { capacity: parseInt(capacity, 10) }),
        ...(workingHours !== '' && { workingHours: parseFloat(workingHours) }),
        ...(parallelSlots !== '' && { parallelSlots: Math.max(1, parseInt(parallelSlots, 10)) }),
      };

      if (isEdit && initialData?.id) {
        await updateCapacitySlot(initialData.id, formData);
        toast.success('Capacity Lot updated successfully');
      } else {
        await createCapacitySlot(formData);
        toast.success('Capacity Lot created successfully');
      }

      router.refresh();
      closeModal();
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while saving the capacity lot.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or numbers
    if (value === '' || /^\d*$/.test(value)) {
      setDays(value);
      if (value && errors.days) {
        setErrors(prev => ({ ...prev, days: undefined }));
      }
    }
  };

  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or numbers
    if (value === '' || /^\d*$/.test(value)) {
      setCapacity(value);
      if (value && errors.capacity) {
        setErrors(prev => ({ ...prev, capacity: undefined }));
      }
    }
  };

  return (
    <Card className='mx-auto w-full max-w-md'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {isEdit ? 'Edit Capacity Lot' : 'Create Capacity Lot'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Stage */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Stage</label>
            <Select value={stage} onValueChange={(value: CapacityStage) => setStage(value)}>
              <SelectTrigger>
                <SelectValue placeholder='Select Stage' />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CapacityStage).map(stage => (
                  <SelectItem key={stage} value={stage}>
                    {stage.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.stage && <p className='text-sm text-red-500'>{errors.stage}</p>}
          </div>

        

          {/* Capacity (optional) */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Capacity</label>
            <Input
              type='text'
              placeholder='Enter capacity'
              value={capacity}
              onChange={handleCapacityChange}
            />
            <p className='text-xs text-gray-500'>Units per day. Must be 0 or greater</p>
            {errors.capacity && <p className='text-sm text-red-500'>{errors.capacity}</p>}
          </div>

          {/* <div className='space-y-2'>
            <label className='text-sm font-medium'>Working hours / day</label>
            <Input
              type='text'
              placeholder='7.5'
              value={workingHours}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '' || /^\d*\.?\d*$/.test(v)) setWorkingHours(v);
              }}
            />
            <p className='text-xs text-gray-500'>Default 7.5 hours.</p>
          </div> */}

          {/* Parallel slots */}
          {/* <div className='space-y-2'>
            <label className='text-sm font-medium'>Parallel slots</label>
            <Input
              type='text'
              placeholder='1'
              value={parallelSlots}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '' || /^\d*$/.test(v)) setParallelSlots(v);
              }}
            />
            <p className='text-xs text-gray-500'>Parallel workstations — multiplies daily throughput.</p>
          </div> */}

          <div className='flex justify-end gap-2'>
            <Button variant='outline' type='button' onClick={closeModal}>
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Saving...' : isEdit ? 'Update Lot' : 'Create Lot'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}