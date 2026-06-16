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
import { IProductCategory } from '@/models/productConfiguration';
import { createCategory, updateCategory } from '@/service/productConfiguration';



const formSchema = z.object({
  name: z.string().min(1, 'Product category name is required')
});

interface ProductCategoryFormProps {
  initialData: IProductCategory | null;
  closeModal: () => void;
  isEdit?: boolean;
}

export default function ProductCategoryForm({
  initialData,
  closeModal,
  isEdit = false
}: ProductCategoryFormProps) {
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
        await updateCategory(initialData.id, data);
        toast.success('Product category updated successfully');
      } else {
        await createCategory(data);
        toast.success('Product category created successfully');
      }

      router.refresh();
      closeModal();
    } catch {
      toast.error('Error saving product category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {isEdit ? 'Edit Product Category' : 'Create Product Category'}
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
                  <FormLabel>Product Category Name</FormLabel>
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
                {isEdit ? 'Update Category' : 'Create Category'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}