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
import { IColour } from '@/models/Category';
import { createColour, updateColour } from '@/service/Category';


// ---------------- Schema ----------------
const formSchema = z.object({
  name: z.string().min(1, 'Colour name is required')
});

// ---------------- Props ----------------
interface ColourFormProps {
  initialData: IColour | null;
  closeModal: () => void;
  isEdit?: boolean;
}

// ---------------- Component ----------------
export default function ColourForm({
  initialData,
  closeModal,
  isEdit = false
}: ColourFormProps) {
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
        await updateColour(initialData.id, data);
        toast.success('Colour updated successfully');
      } else {
        await createColour(data);
        toast.success('Colour created successfully');
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
          {isEdit ? 'Edit Colour' : 'Create Colour'}
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
                    <Input placeholder='e.g., Red' {...field} />
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
                {isEdit ? 'Update Colour' : 'Create Colour'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
