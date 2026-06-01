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

import { IExpense } from '@/models/Expense';
import { createExpense, updateExpense } from '@/service/expence';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  expenseDate: z.string().min(1, 'Expense date is required')
});

interface ExpenseFormProps {
  initialData: IExpense | null;
  closeModal: () => void;
  isEdit?: boolean;
}

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export default function ExpenseForm({
  initialData,
  closeModal,
  isEdit = false
}: ExpenseFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      amount: initialData?.amount && initialData.amount > 0 ? initialData.amount : undefined,
      expenseDate: initialData?.expenseDate
        ? new Date(initialData.expenseDate).toISOString().split('T')[0]
        : getTodayDate() // Set today's date as default for new expenses
    }
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      if (isEdit && initialData?.id) {
        await updateExpense(initialData.id, data);
        toast.success('Expense updated successfully');
      } else {
        await createExpense(data);
        toast.success('Expense created successfully');
      }

      router.refresh();
      closeModal();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('An error occurred during saving.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {isEdit ? 'Edit Expense' : 'Create Expense'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Title */}
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g., Office Rent' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount - Empty instead of zero */}
            <FormField
              control={form.control}
              name='amount'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input 
                      type='number' 
                      placeholder='e.g., 5000' 
                      {...field}
                      value={field.value === undefined || field.value === 0 ? '' : field.value}
                      onChange={(e) => {
                        const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expense Date - Defaults to today for new expenses */}
            <FormField
              control={form.control}
              name='expenseDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expense Date</FormLabel>
                  <FormControl>
                    <Input 
                      type='date' 
                      {...field} 
                      max={getTodayDate()} // Optional: Prevent future dates
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder='Optional description' {...field} />
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
                {isLoading ? 'Saving...' : (isEdit ? 'Update Expense' : 'Create Expense')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}