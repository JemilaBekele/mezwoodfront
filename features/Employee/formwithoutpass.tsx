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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { IEmployee } from '@/models/employee';
import { useForm } from 'react-hook-form';
import { createEmployee, updateEmployee } from '@/service/employee';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getRoleall, IRole } from '@/service/roleService';
import { IStore } from '@/models/store';
import { IShowroom } from '@/models/showroom';
import { getStoresAll } from '@/service/store';
import { getShowroomsAll } from '@/service/showroom';
import { MultiSelect } from './mm';

// Define the form data type
interface FormData {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  userCode?: string;
  roleId: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  storeIds: string[];
  showroomIds: string[];
}

export default function EmployeeForm({
  initialData,
  pageTitle
}: {
  initialData: IEmployee | null;
  pageTitle: string;
}) {
  const router = useRouter();
  const [roles, setRoles] = useState<IRole[]>([]);
  const [stores, setStores] = useState<IStore[]>([]);
  const [showrooms, setShowrooms] = useState<IShowroom[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingShowrooms, setLoadingShowrooms] = useState(true);

  const isUpdateMode = !!initialData;

  const defaultValues = useMemo(
    () => ({
      name: initialData?.name || '',
      email: initialData?.email || '',
      password: '',
      phone: initialData?.phone || '',
      userCode: initialData?.userCode || '',
      roleId: initialData?.roleId || initialData?.role?.id || '',
      status: initialData?.status || 'Active',
      storeIds: initialData?.storeIds || initialData?.stores?.map(s => s.id) || [],
      showroomIds: initialData?.showroomIds || initialData?.showrooms?.map(s => s.id) || [],
    }),
    [initialData]
  );

  const form = useForm<FormData>({
    defaultValues,
    mode: 'onChange'
  });

  useEffect(() => {
    (async () => {
      try {
        const [rolesData, storesData, showroomsData] = await Promise.all([
          getRoleall(),
          getStoresAll(),
          getShowroomsAll()
        ]);
        setRoles(rolesData);
        setStores(storesData);
        setShowrooms(showroomsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to fetch data');
      } finally {
        setLoadingRoles(false);
        setLoadingStores(false);
        setLoadingShowrooms(false);
      }
    })();
  }, []);

  const validateForm = (data: FormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!data.name || data.name.trim().length < 2) {
      errors.name = 'Employee name must be at least 2 characters.';
    }

    // Email validation
    if (!data.email) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address.';
    }

    // Password validation - only for create mode
    if (!isUpdateMode && (!data.password || data.password.length < 6)) {
      errors.password = 'Password must be at least 6 characters.';
    }

    // Role validation
    if (!data.roleId) {
      errors.roleId = 'Role is required.';
    }

    return errors;
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Validate form
      const errors = validateForm(data);
      if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([field, message]) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          form.setError(field as any, {
            type: 'manual',
            message
          });
        });
        return;
      }

      // Prepare submit data
      const submitData: any = {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        roleId: data.roleId,
        status: data.status,
        storeIds: data.storeIds || [],
        showroomIds: data.showroomIds || [],
      };

      // Handle password
      if (isUpdateMode) {
        // For update mode, only include password if provided
        if (data.password && data.password.length > 0) {
          submitData.password = data.password;
        }
      } else {
        // For create mode, password is required
        if (!data.password) {
          toast.error('Password is required');
          return;
        }
        submitData.password = data.password;
      }


      if (isUpdateMode && initialData?.id) {
        await updateEmployee(initialData.id, submitData);
        toast.success('Employee updated successfully');
        router.push(`/dashboard/employee`);
      } else {
        await createEmployee(submitData);
        toast.success('Employee created successfully');
        router.push(`/dashboard/employee`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(
        isUpdateMode ? 'Error updating employee' : 'Error creating employee'
      );
    }
  };

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {pageTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                name='name'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field - Only show in create mode */}
              {!isUpdateMode && (
                <FormField
                  name='password'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type='password' 
                          {...field} 
                          placeholder='Enter password' 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Password Field for update mode - optional */}
              {isUpdateMode && (
                <FormField
                  name='password'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type='password' 
                          {...field} 
                          placeholder='Leave empty to keep current password' 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
                name='roleId'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingRoles ? 'Loading roles...' : 'Select role'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id ?? ''}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Multiple Store Selection */}
              <FormField
                name='storeIds'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stores (Optional - Multiple)</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={stores.map(store => ({
                          label: store.name,
                          value: store.id
                        }))}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder={
                          loadingStores 
                            ? 'Loading stores...' 
                            : 'Select stores'
                        }
                        disabled={loadingStores}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Multiple Showroom Selection */}
              <FormField
                name='showroomIds'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Showrooms (Optional - Multiple)</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={showrooms.map(showroom => ({
                          label: showroom.name,
                          value: showroom.id
                        }))}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder={
                          loadingShowrooms 
                            ? 'Loading showrooms...' 
                            : 'Select showrooms'
                        }
                        disabled={loadingShowrooms}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status Field - Only show in update mode */}
              {isUpdateMode && (
                <FormField
                  name='status'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select status' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='Active'>Active</SelectItem>
                          <SelectItem value='Inactive'>Inactive</SelectItem>
                          <SelectItem value='Suspended'>Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className='flex gap-4'>
              <Button type='submit'>
                {isUpdateMode ? 'Update Employee' : 'Add Employee'}
              </Button>
              <Button 
                type='button' 
                variant='outline'
                onClick={() => router.push('/dashboard/employee')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}