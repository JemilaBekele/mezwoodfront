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

import { createShowroom, updateShowroom } from '@/service/showroom';
import { IShowroom } from '@/models/showroom';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  isMain: z.boolean().optional()
});

interface ShowroomFormProps {
  initialData: IShowroom | null;
  closeModal: () => void;
  isEdit?: boolean;
}

export default function ShowroomForm({
  initialData,
  closeModal,
  isEdit = false
}: ShowroomFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      isMain: initialData?.isMain || false
    }
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      if (isEdit && initialData?.id) {
        await updateShowroom(initialData.id, data);
        toast.success('Showroom updated successfully');
      } else {
        await createShowroom(data);
        toast.success('Showroom created successfully');
      }

      router.refresh();
      closeModal();
    } catch {
      toast.error('An error occurred while saving showroom');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          {isEdit ? 'Edit Showroom' : 'Create Showroom'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Main Showroom" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is Main */}
            <FormField
              control={form.control}
              name="isMain"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <FormLabel>Main Showroom</FormLabel>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isEdit ? 'Update Showroom' : 'Create Showroom'}
              </Button>
            </div>

          </form>
        </Form>
      </CardContent>
    </Card>
  );
}