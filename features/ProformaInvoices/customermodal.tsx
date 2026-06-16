/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Button } from '@/components/ui/button';
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
import { createCustomer, getCustomer } from '@/service/customer';
import { ICustomer } from '@/models/customer';
import { Modal } from '@/components/ui/modal';
import Select from 'react-select';
import { IconPlus } from '@tabler/icons-react';

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
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function CreateCustomerModalContent({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess?: () => void;
}) {
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

      const cleanedData: any = {
        name: data.name,
        phone1: data.phone1,
        phone2: data.phone2 || undefined,
        address: data.address || undefined,
        companyName: data.companyName || undefined,
        tinNumber: data.tinNumber || undefined,
        notes: data.notes || undefined
      };

      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === undefined) {
          delete cleanedData[key];
        }
      });

      await createCustomer(cleanedData);

      toast.success('Customer created successfully');
      onClose();
      onSuccess?.();
      router.refresh();
    } catch (error: any) {
      console.error('Error creating customer:', error);
      
      if (error.response) {
        const backendMessage = 
          error.response.data?.message ||
          error.response.data?.error ||
          JSON.stringify(error.response.data) ||
          'Error creating customer';
        toast.error(backendMessage);
      } else if (error.request) {
        toast.error('No response from server. Please check your connection.');
      } else {
        toast.error(error.message || 'Error creating customer');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter customer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter primary phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alternate Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter alternate phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tinNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TIN Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter TIN number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter full address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Input placeholder="Additional notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

// Main Customer Modal Component
export function CustomerModal({ isOpen, onClose, onSuccess }: CreateCustomerModalProps) {
  return (
    <Modal
      title="Create New Customer"
      description="Fill in the customer details below"
      isOpen={isOpen}
      onClose={onClose}
    >
      <CreateCustomerModalContent onClose={onClose} onSuccess={onSuccess} />
    </Modal>
  );
}

// Customer Select Component with Modal
interface CustomerSelectProps {
  isStore: boolean;
  form: any;
  control: any;
  isDark?: boolean;
}

export function CustomerSelect({ isStore, form, control, isDark = false }: CustomerSelectProps) {
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);

  const darkStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      color: '#f3f4f6',
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: '#1f2937',
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#374151' : '#1f2937',
      color: '#f3f4f6',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: '#f3f4f6',
    }),
    input: (base: any) => ({
      ...base,
      color: '#f3f4f6',
    }),
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await getCustomer();
      
      let customers = [];
      if (response?.data && Array.isArray(response.data)) {
        customers = response.data;
      } else if (Array.isArray(response)) {
        customers = response;
      } else {
        customers = [];
      }
      
      const options = customers.map((customer: any) => ({
        value: customer.id,
        label: `${customer.name}${customer.phone1 ? ` - ${customer.phone1}` : ''}`
      }));
      setCustomerOptions(options);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCustomerCreated = async () => {
    setShowCustomerModal(false);
    await fetchCustomers();
    toast.success('Customer created successfully! You can now select them from the dropdown.');
  };

  return (
    <>
      {!isStore && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <FormField
              name="customerId"
              control={control}
              rules={{
                required: !isStore ? 'Customer is required' : false,
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer *</FormLabel>
                  <FormControl>
                    <Select
                      options={customerOptions}
                      value={customerOptions.find(
                        (option) => option.value === field.value
                      )}
                      onChange={(option) => field.onChange(option?.value)}
                      placeholder={loading ? "Loading customers..." : "Select customer"}
                      isSearchable
                      isLoading={loading}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                      styles={{
                        ...(isDark ? darkStyles : {}),
                        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                      }}
                      noOptionsMessage={() => loading ? "Loading..." : "No customers found. Click the + button to add one."}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mb-1"
            onClick={() => setShowCustomerModal(true)}
          >
            <IconPlus size={16} />
          </Button>
        </div>
      )}

      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSuccess={handleCustomerCreated}
      />
    </>
  );
}