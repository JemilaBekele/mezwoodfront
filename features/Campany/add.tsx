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
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMemo, useCallback, useState } from 'react';
import Image from 'next/image';
import { ICompany } from '@/models/employee';
import { createCompany, updateCompany } from '@/service/companyService';

export default function CompanyForm({
  initialData,
  pageTitle
}: {
  initialData: ICompany | null;
  pageTitle: string;
}) {
  const router = useRouter();
  const [previewLogo, setPreviewLogo] = useState<string | null>(
    initialData?.logo ? String(initialData.logo) : null
  );

  const defaultValues = useMemo(
    () => ({
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      addressTow: initialData?.addressTow || '',
            tiktok: initialData?.tiktok || '',

      description: initialData?.description || '',
      tinAddress: initialData?.tinAddress || '',
      TIN: initialData?.TIN || '',
      From: initialData?.From || '',
      logo: undefined
    }),
    [initialData]
  );

  const form = useForm<ICompany>({
    defaultValues
  });

  const handleLogoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        form.setValue('logo', file);
        const reader = new FileReader();
        reader.onload = () => setPreviewLogo(reader.result as string);
        reader.readAsDataURL(file);
      }
    },
    [form]
  );

  const onSubmit = async (data: ICompany) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      if (initialData?.id) {
        await updateCompany(initialData.id, formData);
        toast.success('Company updated successfully');
      } else {
        await createCompany(formData);
        toast.success('Company created successfully');
      }

      router.refresh();
      router.push('/dashboard/Company'); // Adjust redirect as needed
    } catch  {
      toast.error('Error saving company');
    }
  };

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle>{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-6'
            encType='multipart/form-data'
          >
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              {/* Left Column */}
              <div className='space-y-4'>
                <FormField
                  name='name'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name='email'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type='email' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name='phone'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name='address'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                    <FormField
                  name='addressTow'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Two</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                    <FormField
                  name='tiktok'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiktok</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column */}
              <div className='space-y-4'>
                <FormField
                  name='description'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name='tinAddress'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TIN Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name='TIN'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TIN Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name='From'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Logo upload */}
            <FormField
              name='logo'
              control={form.control}
              render={() => (
                <FormItem>
                  <FormLabel>Company Logo</FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        type='file'
                        accept='image/*'
                        onChange={handleLogoChange}
                      />
                      {previewLogo && (
                        <div className='mt-2'>
                          <Image
                            src={previewLogo}
                            alt='Logo preview'
                            width={150}
                            height={100}
                            className='rounded-md object-contain'
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type='submit' className='w-full md:w-auto'>
              {initialData ? 'Update Company' : 'Create Company'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}