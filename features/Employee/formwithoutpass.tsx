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

// Define the form data type
interface FormData {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  userCode?: string;
  roleId: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  storeId?: string | null;
  showroomId?: string | null;
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
      storeId: initialData?.storeId || initialData?.store?.id || null,
      showroomId: initialData?.showroomId || initialData?.showroom?.id || null,
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

      // Handle storeId - send null for "None", otherwise send the ID
      if (data.storeId === null || data.storeId === '') {
        submitData.storeId = null;
      } else if (data.storeId) {
        submitData.storeId = data.storeId;
      }

      // Handle showroomId - send null for "None", otherwise send the ID
      if (data.showroomId === null || data.showroomId === '') {
        submitData.showroomId = null;
      } else if (data.showroomId) {
        submitData.showroomId = data.showroomId;
      }

      console.log('Submitting data:', submitData);

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

              {/* Store Selection - Independent */}
              <FormField
                name='storeId'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store (Optional)</FormLabel>
                    <Select 
                      value={field.value || 'none'} 
                      onValueChange={(value) => {
                        field.onChange(value === 'none' ? null : value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingStores ? 'Loading stores...' : 'Select store'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='none'>None</SelectItem>
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Showroom Selection - Independent */}
              <FormField
                name='showroomId'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Showroom (Optional)</FormLabel>
                    <Select 
                      value={field.value || 'none'} 
                      onValueChange={(value) => {
                        field.onChange(value === 'none' ? null : value);
                      }}
                      disabled={loadingShowrooms}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingShowrooms 
                                ? 'Loading showrooms...' 
                                : 'Select showroom'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='none'>None</SelectItem>
                        {showrooms.map((showroom) => (
                          <SelectItem key={showroom.id} value={showroom.id}>
                            {showroom.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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