'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { IUnitOfMeasure } from '@/models/UnitOfMeasure';
import {
  createUnitOfMeasure,
  updateUnitOfMeasure
} from '@/service/UnitOfMeasure';

interface FormValues {
  name: string;
  symbol?: string;
  base: boolean;
}

interface UnitOfMeasureFormProps {
  initialData: IUnitOfMeasure | null;
  closeModal: () => void;
  isEdit?: boolean;
}

export default function UnitOfMeasureForm({
  initialData,
  closeModal,
  isEdit = false
}: UnitOfMeasureFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    defaultValues: {
      name: initialData?.name || '',
      symbol: initialData?.symbol || '',
      base: initialData?.base || false
    }
  });

  const onSubmit = async (data: FormValues) => {
    // Manual validation
    if (!data.name || data.name.trim() === '') {
      form.setError('name', {
        type: 'manual',
        message: 'Unit name is required'
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isEdit && initialData?.id) {
        await updateUnitOfMeasure(initialData.id, data);
        toast.success('Unit updated successfully');
      } else {
        await createUnitOfMeasure(data);
        toast.success('Unit created successfully');
      }

      router.refresh();
      closeModal();
    } catch  {
      const message =
        'An error occurred during saving.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {isEdit ? 'Edit Unit of Measure' : 'Create Unit of Measure'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Name */}
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g., Kilogram' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Symbol */}
            <FormField
              control={form.control}
              name='symbol'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g., kg' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2'>
              <Button variant='outline' type='button' onClick={closeModal}>
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isEdit ? 'Update Unit' : 'Create Unit'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}