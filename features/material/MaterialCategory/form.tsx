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

import { IMaterialCategory } from '@/models/materialCategory';
import {
  createMaterialCategory,
  updateMaterialCategory
} from '@/service/materialcatagory';

const formSchema = z.object({
  name: z.string().min(1, 'Material category name is required')
});

interface MaterialCategoryFormProps {
  initialData: IMaterialCategory | null;
  closeModal: () => void;
  isEdit?: boolean;
}

export default function MaterialCategoryForm({
  initialData,
  closeModal,
  isEdit = false
}: MaterialCategoryFormProps) {
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
        await updateMaterialCategory(initialData.id, data);
        toast.success('Material category updated successfully');
      } else {
        await createMaterialCategory(data);
        toast.success('Material category created successfully');
      }

      router.refresh();
      closeModal();
    } catch {
      const message = 'An error occurred while saving the material category.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {isEdit ? 'Edit Material Category' : 'Create Material Category'}
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
                    <Input placeholder='e.g., Electronics' {...field} />
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
                {isEdit ? 'Update Material Category' : 'Create Material Category'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
