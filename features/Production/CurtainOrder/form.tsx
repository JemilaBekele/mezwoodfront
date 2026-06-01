'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import { ICurtainOrder } from '@/models/curtainType';
import { IMovementType } from '@/models/curtainType';
import { ICustomer } from '@/models/customer';

import { getMovementTypes } from '@/service/curtainType';
import { getCustomer } from '@/service/customer';
import {
  createCurtainOrder,
  updateCurtainOrder
} from '@/service/Curtain';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------- Type ----------------
interface CurtainOrderFormValues {
  customerId: string;
  movementTypeId?: string;
  isSiteMeasured: boolean;
  siteMeasurePrice?: number;
  issueDate?: string;
  remark?: string;
}

// ---------------- Props ----------------
interface CurtainOrderFormProps {
  initialData?: ICurtainOrder | null;
  closeModal: () => void;
  isEdit?: boolean;
}

// ---------------- Component ----------------
export default function CurtainOrderForm({
  initialData,
  closeModal,
  isEdit = false
}: CurtainOrderFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [movementTypes, setMovementTypes] = useState<IMovementType[]>([]);
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const router = useRouter();

  const form = useForm<CurtainOrderFormValues>({
    defaultValues: {
      customerId: initialData?.customerId ?? '',
      movementTypeId: initialData?.movementTypeId ?? '',
      isSiteMeasured: initialData?.isSiteMeasured ?? false,
      siteMeasurePrice: initialData?.siteMeasurePrice ?? undefined,
      issueDate: initialData?.issueDate?.slice(0, 10) ?? '',
      remark: initialData?.remark ?? ''
    }
  });

  // Fetch movement types
  useEffect(() => {
    getMovementTypes()
      .then(setMovementTypes)
      .catch(() => toast.error('Failed to load movement types'));
  }, []);

  // Fetch customers
  useEffect(() => {
    getCustomer()
      .then(setCustomers)
      .catch(() => toast.error('Failed to load customers'));
  }, []);

  const isSiteMeasured = form.watch('isSiteMeasured');

  // Simple validation function
  const validateForm = (data: CurtainOrderFormValues): boolean => {
    if (!data.customerId || data.customerId.trim() === '') {
      toast.error('Customer is required');
      return false;
    }
    
    if (data.siteMeasurePrice !== undefined && data.siteMeasurePrice < 0) {
      toast.error('Price must be positive');
      return false;
    }
    
    return true;
  };

  const onSubmit = async (data: CurtainOrderFormValues) => {
    if (!validateForm(data)) {
      return;
    }

    setIsLoading(true);
    try {
      // Clean up empty strings to undefined
      const cleanedData = {
        ...data,
        movementTypeId: data.movementTypeId === '' ? undefined : data.movementTypeId,
        siteMeasurePrice: data.siteMeasurePrice === 0 ? undefined : data.siteMeasurePrice,
        issueDate: data.issueDate === '' ? undefined : data.issueDate,
        remark: data.remark === '' ? undefined : data.remark
      };

      if (isEdit && initialData?.id) {
        await updateCurtainOrder(initialData.id, cleanedData);
        toast.success('Curtain order updated successfully');
      } else {
        await createCurtainOrder(cleanedData);
        toast.success('Curtain order created successfully');
      }

      router.refresh();
      closeModal();
    } catch {
      toast.error('Failed to save curtain order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>
          {isEdit ? 'Edit Curtain Order' : 'Create Curtain Order'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Customer */}
         <FormField
  control={form.control}
  name="customerId"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel>
        Customer <span className="text-red-500">*</span>
      </FormLabel>

      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "justify-between",
                !field.value && "text-muted-foreground"
              )}
            >
              {field.value
                ? customers.find(
                    (customer) => customer.id === field.value
                  )?.name
                : "Select customer"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search customer..." />
            <CommandEmpty>No customer found.</CommandEmpty>

            <CommandGroup className="max-h-60 overflow-auto">
              {customers.map((customer) => (
                <CommandItem
                  value={customer.name}
                  key={customer.id}
                  onSelect={() => {
                    field.onChange(customer.id);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      customer.id === field.value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {customer.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <FormMessage />
    </FormItem>
  )}
/>

            {/* Movement Type */}
            <FormField
              control={form.control}
              name='movementTypeId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Movement Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select movement type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {movementTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Site Measurement */}
            <FormField
              control={form.control}
              name='isSiteMeasured'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-lg border p-4'>
                  <FormLabel>Site Measurement</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Site Measurement Price */}
            {isSiteMeasured && (
              <FormField
                control={form.control}
                name='siteMeasurePrice'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Measurement Price</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min="0"
                        step="0.01"
                        placeholder='0.00'
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Issue Date */}
            <FormField
              control={form.control}
              name='issueDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Date</FormLabel>
                  <FormControl>
                    <Input 
                      type='date' 
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Remark */}
            <FormField
              control={form.control}
              name='remark'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remark</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder='Optional notes...' 
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={closeModal}>
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isEdit ? 'Update Order' : 'Create Order'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}