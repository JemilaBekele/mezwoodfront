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
import { useState } from 'react';
import { createCustomer } from '@/service/customer';
import { ICustomer } from '@/models/customer';

const formSchema = z.object({
  name: z.string().min(1, {
    message: 'Customer name is required'
  }),
  phone1: z.string().min(1, {
    message: 'Phone number is required'
  }),
  phone2: z.string().optional(),
  address: z.string().optional(),
  companyName: z.string().optional(),
  tinNumber: z.string().optional(),
  notes: z.string().optional()
});

interface CreateCustomerModalProps {
  closeModal: () => void;
  onSuccess?: () => void;
}

export default function CreateCustomerModal({
  closeModal,
  onSuccess
}: CreateCustomerModalProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone1: '',
      phone2: '',
      address: '',
      companyName: '',
      tinNumber: '',
      notes: ''
    }
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setSubmitting(true);

      // Log the data being sent
      console.log('Form data before cleaning:', data);

      // Clean up empty strings to undefined
      const cleanedData: any = {
        name: data.name,
        phone1: data.phone1,
        phone2: data.phone2 || undefined,
        address: data.address || undefined,
        companyName: data.companyName || undefined,
        tinNumber: data.tinNumber || undefined,
        notes: data.notes || undefined
      };

      // Remove undefined values to avoid sending them
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === undefined) {
          delete cleanedData[key];
        }
      });

      console.log('Cleaned data being sent:', cleanedData);

      const response = await createCustomer(cleanedData);
      
      console.log('Create customer response:', response);

      toast.success('Customer created successfully');
      closeModal();
      onSuccess?.();
      router.refresh();
    } catch (error: any) {
      console.error('Full error object:', error);
      
      // More detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        const backendMessage = 
          error.response.data?.message ||
          error.response.data?.error ||
          JSON.stringify(error.response.data) ||
          'Error creating customer';
        
        toast.error(backendMessage);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        toast.error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        toast.error(error.message || 'Error creating customer');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          Create New Customer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter customer name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='phone1'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter primary phone number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='phone2'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternate Phone</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter alternate phone number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='companyName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter company name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='tinNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TIN Number</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter TIN number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='address'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter full address' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder='Additional notes' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2 pt-4'>
              <Button variant='outline' type='button' onClick={closeModal}>
                Cancel
              </Button>
              <Button type='submit' disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Customer'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}