'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
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
  SelectValue
} from '@/components/ui/select';

import { IProductType, ISize, IProductCategory } from '@/models/productConfiguration';
import {
  createType,
  updateType,
  getSizes,
  getCategories
} from '@/service/productConfiguration';

const formSchema = z.object({
  name: z.string().min(1, 'Product type name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  sizeId: z.string().min(1, 'Size is required')
});

interface ProductTypeFormProps {
  initialData: IProductType | null;
  closeModal: () => void;
  isEdit?: boolean;
}

export default function ProductTypeForm({
  initialData,
  closeModal,
  isEdit = false
}: ProductTypeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<IProductCategory[]>([]);
  const [sizes, setSizes] = useState<ISize[]>([]);
  const [filteredSizes, setFilteredSizes] = useState<ISize[]>([]);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      categoryId: initialData?.size?.categoryId || '',
      sizeId: initialData?.sizeId || ''
    }
  });

  const selectedCategory = form.watch('categoryId');

  // ✅ Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, sizeRes] = await Promise.all([
          getCategories(),
          getSizes()
        ]);
        setCategories(catRes);
        setSizes(sizeRes);
      } catch {
        toast.error('Failed to load data');
      }
    };

    fetchData();
  }, []);

  // ✅ Filter sizes by category
  useEffect(() => {
    if (selectedCategory) {
      const filtered = sizes.filter(
        (s) => s.categoryId === selectedCategory
      );
      setFilteredSizes(filtered);
    } else {
      setFilteredSizes([]);
    }
  }, [selectedCategory, sizes]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const payload = {
        name: data.name,
        sizeId: data.sizeId
      };

      if (isEdit && initialData?.id) {
        await updateType(initialData.id, payload);
        toast.success('Product type updated successfully');
      } else {
        await createType(payload);
        toast.success('Product type created successfully');
      }

      router.refresh();
      closeModal();
    } catch {
      toast.error('An error occurred while saving product type');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {isEdit ? 'Edit Product Type' : 'Create Product Type'}
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
                  <FormLabel>Product Type Name</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g., Shirt, Shoe, Pant' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name='categoryId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('sizeId', ''); // reset size
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select category' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Size */}
            <FormField
              control={form.control}
              name='sizeId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedCategory}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select size' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredSizes.map((size) => (
                        <SelectItem key={size.id} value={size.id}>
                          {size.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2'>
              <Button variant='outline' type='button' onClick={closeModal}>
                Cancel
              </Button>

              <Button type='submit' disabled={isLoading}>
                {isEdit ? 'Update Type' : 'Create Type'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}