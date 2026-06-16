/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { ISize, IProductCategory } from '@/models/productConfiguration';
import { createSize, updateSize, getCategories } from '@/service/productConfiguration';

const formSchema = z.object({
  name: z.string().min(1, 'Size name is required'),
  categoryId: z.string().min(1, 'Category is required')
});

interface SizeFormProps {
  initialData: ISize | null;
  closeModal: () => void;
  isEdit?: boolean;
}

export default function SizeForm({
  initialData,
  closeModal,
  isEdit = false
}: SizeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<IProductCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      categoryId: initialData?.categoryId || ''
    }
  });

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      if (isEdit && initialData?.id) {
        await updateSize(initialData.id, data);
        toast.success('Size updated successfully');
      } else {
        await createSize(data);
        toast.success('Size created successfully');
      }

      router.refresh();
      closeModal();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An error occurred while saving size';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {isEdit ? 'Edit Size' : 'Create Size'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Category Selection with Search */}
            <FormField
              control={form.control}
              name='categoryId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoadingCategories}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="flex items-center border-b px-3 pb-2">
                          <Input
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        {isLoadingCategories ? (
                          <div className="py-6 text-center text-sm">
                            Loading categories...
                          </div>
                        ) : filteredCategories.length === 0 ? (
                          <div className="py-6 text-center text-sm">
                            No categories found
                          </div>
                        ) : (
                          filteredCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size Name *</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g., Small, Medium, Large' {...field} />
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
                {isEdit ? 'Update Size' : 'Create Size'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}