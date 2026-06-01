'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { IProduct } from '@/models/Product';
import { createProductBatchSingle, getProducts } from '@/service/Product';

const formSchema = z.object({
  batchNumber: z.string().min(1, {
    message: 'Batch number is required'
  }),
  expiryDate: z.string().optional(),
  productId: z.string().min(1, {
    message: 'Product is required'
  })
});

interface CreateProductBatchModalProps {
  closeModal: () => void;
  initialProductId?: string;
  onSuccess?: () => void;
}

export interface IProductBatch {
  id: number;
  batchNumber: string;
  expiryDate?: string;
  productId: string;
}

export default function CreateProductBatchModal({
  closeModal,
  initialProductId,
  onSuccess
}: CreateProductBatchModalProps) {
  const router = useRouter();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const productsData = await getProducts();
        setProducts(productsData || []);
      } catch  {
        toast.error('Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      batchNumber: '',
      expiryDate: '',
      productId: initialProductId || ''
    }
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setSubmitting(true);

      // Validate required fields
      if (!data.batchNumber || !data.productId) {
        toast.error('Please fill all required fields');
        return;
      }

      // Debug: Log the data being sent

      // Send as JSON instead of FormData
      await createProductBatchSingle(data);

      toast.success('Product batch created successfully');
      closeModal();
      onSuccess?.();
      router.refresh();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Error creating product batch';
      toast.error(backendMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className='mx-auto w-full max-w-md'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          Create Product Batch
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='productId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loading || !!initialProductId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select product' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem
                          key={product.id}
                          value={product.id || 'unknown'}
                        >
                          {product.name} ({product.productCode || 'No code'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='batchNumber'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch Number</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter batch number' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='expiryDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Date (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type='date'
                      placeholder='Select expiry date'
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2 pt-4'>
              <Button variant='outline' type='button' onClick={closeModal}>
                Cancel
              </Button>
              <Button type='submit' disabled={loading || submitting}>
                {submitting ? 'Creating...' : 'Create Batch'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
