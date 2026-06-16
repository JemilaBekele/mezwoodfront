/* eslint-disable @typescript-eslint/no-explicit-any */
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

// Updated form schema with phone validation (counting only digits)
const formSchema = z.object({
  name: z.string().min(1, {
    message: 'Customer name is required'
  }),
  phone1: z
    .string()
    .min(1, {
      message: 'Primary phone number is required'
    })
    .refine(
      (val) => {
        // Remove all non-digit characters (dashes, spaces, etc.)
        const digits = val.replace(/\D/g, '');
        // Check if exactly 10 digits remain
        return digits.length === 10;
      },
      {
        message:
          'Primary phone number must be exactly 10 digits (counting only numbers)'
      }
    ),
  phone2: z
    .string()
    .optional()
    .refine(
      (val) => {
        // If phone2 is provided, validate it
        if (!val || val.trim() === '') return true;

        // Remove all non-digit characters
        const digits = val.replace(/\D/g, '');
        return digits.length === 10;
      },
      {
        message:
          'Secondary phone number must be exactly 10 digits if provided (counting only numbers)'
      }
    ),
  tinNumber: z.string().optional(),
  address: z.string().optional(),
  companyName: z.string().optional()
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
      tinNumber: '',
      address: '',
      companyName: ''
    }
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setSubmitting(true);

      // Clean phone numbers (remove any non-digit characters)
      const cleanedData: ICustomer = {
        name: data.name,
        phone1: data.phone1.replace(/\D/g, ''), // Keep only digits
        phone2: data.phone2 ? data.phone2.replace(/\D/g, '') : undefined,
        tinNumber: data.tinNumber || undefined,
        address: data.address || undefined,
        companyName: data.companyName || undefined
      };

      await createCustomer(cleanedData);

      toast.success('Customer created successfully');
      closeModal();
      onSuccess?.();
      router.refresh();
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Error creating customer';
      toast.error(backendMessage);
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

              {/* OPTION 1: With formatting dashes */}
              <FormField
                control={form.control}
                name='phone1'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Phone *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter 10-digit phone number'
                        {...field}
                        onChange={(e) => {
                          // Format with dashes as user types
                          field.onChange(e.target.value);
                        }}
                        onBlur={field.onBlur}
                        value={field.value}
                        maxLength={12} // For XXX-XXX-XXXX format
                      />
                    </FormControl>
                    <FormMessage />
                    <div className='text-muted-foreground mt-1 text-xs'>
                      Example: 123-456-7890 (dashes will be ignored, only
                      numbers counted)
                    </div>
                  </FormItem>
                )}
              />

              {/* OPTION 2: Without formatting (just digits) - Use this if you don't want dashes */}
              {/* <FormField
                control={form.control}
                name='phone1'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Phone *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter 10-digit phone number'
                        {...field}
                        onChange={(e) => handlePhoneChange(e, field)}
                        onBlur={field.onBlur}
                        value={field.value}
                        maxLength={10}
                        type='tel'
                      />
                    </FormControl>
                    <FormMessage />
                    <div className='text-xs text-muted-foreground mt-1'>
                      Only numbers allowed, exactly 10 digits
                    </div>
                  </FormItem>
                )}
              /> */}

              <FormField
                control={form.control}
                name='phone2'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter 10-digit phone number'
                        {...field}
                        onChange={(e) => {
                          // Format with dashes as user types
                          field.onChange(e.target.value);
                        }}
                        onBlur={field.onBlur}
                        value={field.value || ''}
                        maxLength={12}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className='text-muted-foreground mt-1 text-xs'>
                      Optional
                    </div>
                  </FormItem>
                )}
              />

              {/* Alternative without formatting for phone2:
              <FormField
                control={form.control}
                name='phone2'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter 10-digit phone number'
                        {...field}
                        onChange={(e) => handlePhoneChange(e, field)}
                        onBlur={field.onBlur}
                        value={field.value || ''}
                        maxLength={10}
                        type='tel'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

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

              <FormField
                control={form.control}
                name='address'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter address' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
