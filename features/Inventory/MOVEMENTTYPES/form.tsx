'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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

import { IMovementType } from '@/models/curtainType';
import {
  createMovementType,
  updateMovementType
} from '@/service/curtainType';

// ---------------- Schema ----------------
const formSchema = z.object({
  name: z.string().min(1, 'Movement type name is required')
});

// ---------------- Props ----------------
interface MovementTypeFormProps {
  initialData: IMovementType | null;
  closeModal: () => void;
  isEdit?: boolean;
}

// ---------------- Component ----------------
export default function MovementTypeForm({
  initialData,
  closeModal,
  isEdit = false
}: MovementTypeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || ''
    }
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      if (isEdit && initialData?.id) {
        await updateMovementType(initialData.id, data);
        toast.success('Movement type updated successfully');
      } else {
        await createMovementType(data);
        toast.success('Movement type created successfully');
      }

      router.refresh();
      closeModal();
    } catch {
      toast.error('An error occurred during saving.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {isEdit ? 'Edit Movement Type' : 'Create Movement Type'}
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
                    <Input placeholder='e.g., Incoming' {...field} />
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
                {isEdit ? 'Update Movement Type' : 'Create Movement Type'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
