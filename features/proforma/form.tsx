/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
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
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { IProforma } from '@/models/proforma';
import { IProduct } from '@/models/Product';
import { getProducts } from '@/service/Product';
import { createProforma, updateProforma } from '@/service/proforma';
import { getShops } from '@/service/shop';
import { IShop } from '@/models/shop';
import { ICustomer } from '@/models/customer';
import { useEffect, useState } from 'react';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { format } from 'date-fns';
import { getCustomer } from '@/service/customer';

// TypeScript interfaces for form values
interface FormItemValues {
  productId: string;
  isBox: boolean;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

interface FormValues {
  proformaNo: string;
  customerId: string;
  shopId: string;
  proformaDate: string;
  validUntil?: string;
  notes?: string;
  discount: number;
  tax: number;
  items: FormItemValues[];
}

interface ProformaFormProps {
  initialData: IProforma | null;
  isEdit?: boolean;
}

export default function ProformaForm({
  initialData,
  isEdit = false
}: ProformaFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [shops, setShops] = useState<IShop[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    defaultValues: {
      proformaNo: initialData?.proformaNo || '',
      customerId: initialData?.customerId?.toString() || '',
      shopId: initialData?.shopId?.toString() || '',
      proformaDate: initialData?.proformaDate
        ? new Date(initialData.proformaDate).toISOString().split('T')[0]
        : format(new Date(), 'yyyy-MM-dd'),
      validUntil: initialData?.validUntil
        ? new Date(initialData.validUntil).toISOString().split('T')[0]
        : '',
      notes: initialData?.notes || '',
      discount: initialData?.discount || 0,
      tax: initialData?.tax || 0,
      items:
        initialData?.items?.map((item) => ({
          productId: item.productId.toString(),
          isBox: item.isBox || false,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          discount: item.discount || 0
        })) || []
    }
  });

  // Calculate totals
  const items = form.watch('items');
  const discount = form.watch('discount');
  const tax = form.watch('tax');
  
  const subTotal = items.reduce(
    (total, item) => total + (item.quantity * item.unitPrice),
    0
  );
  
  const grandTotal = subTotal - discount + tax;
  const totalProducts = items.filter((item) => item.productId).length;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch customers, shops, products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersData, shopsData, productsData] = await Promise.all([
          getCustomer(),
          getShops(),
          getProducts()
        ]);
        setCustomers(customersData);
        setShops(shopsData);
        setProducts(productsData);
      } catch {
        toast.error('Failed to load customers, shops, or products');
      }
    };
    fetchData();
  }, []);

  const updateItemTotal = (index: number) => {
    const currentItems = form.getValues('items');
    const item = currentItems[index];
    const totalPrice = item.quantity * item.unitPrice;

    const updatedItems = [...currentItems];
    updatedItems[index] = { ...item, totalPrice };
    form.setValue('items', updatedItems);
  };

  const validateForm = (data: FormValues): boolean => {
    let isValid = true;

    if (!data.proformaNo || data.proformaNo.trim() === '') {
      form.setError('proformaNo', {
        type: 'manual',
        message: 'Proforma number is required'
      });
      isValid = false;
    }

    if (!data.customerId || data.customerId.trim() === '') {
      form.setError('customerId', {
        type: 'manual',
        message: 'Customer is required'
      });
      isValid = false;
    }

    if (!data.shopId || data.shopId.trim() === '') {
      form.setError('shopId', {
        type: 'manual',
        message: 'Shop is required'
      });
      isValid = false;
    }

    if (!data.proformaDate || data.proformaDate.trim() === '') {
      form.setError('proformaDate', {
        type: 'manual',
        message: 'Proforma date is required'
      });
      isValid = false;
    }

    if (data.validUntil) {
      const validUntilDate = new Date(data.validUntil);
      const proformaDate = new Date(data.proformaDate);
      if (validUntilDate < proformaDate) {
        form.setError('validUntil', {
          type: 'manual',
          message: 'Valid until date must be after proforma date'
        });
        isValid = false;
      }
    }

    if (data.discount < 0) {
      form.setError('discount', {
        type: 'manual',
        message: 'Discount cannot be negative'
      });
      isValid = false;
    }

    if (data.tax < 0) {
      form.setError('tax', {
        type: 'manual',
        message: 'Tax cannot be negative'
      });
      isValid = false;
    }

    if (data.items.length === 0) {
      form.setError('items', {
        type: 'manual',
        message: 'At least one item is required'
      });
      isValid = false;
    }

    data.items.forEach((item, index) => {
      if (!item.productId || item.productId.trim() === '') {
        form.setError(`items.${index}.productId` as any, {
          type: 'manual',
          message: 'Product is required'
        });
        isValid = false;
      }

      if (item.quantity <= 0 || isNaN(item.quantity)) {
        form.setError(`items.${index}.quantity` as any, {
          type: 'manual',
          message: 'Quantity must be greater than 0'
        });
        isValid = false;
      }

      if (item.unitPrice < 0 || isNaN(item.unitPrice)) {
        form.setError(`items.${index}.unitPrice` as any, {
          type: 'manual',
          message: 'Unit price must be positive'
        });
        isValid = false;
      }

      if (item.discount && item.discount < 0) {
        form.setError(`items.${index}.discount` as any, {
          type: 'manual',
          message: 'Discount cannot be negative'
        });
        isValid = false;
      }
    });

    return isValid;
  };

  const onSubmit = async (data: FormValues) => {
    form.clearErrors();

    if (!validateForm(data)) {
      return;
    }

    console.log('Form data:', data);
    
    data.items.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        productId: item.productId,
        isBox: item.isBox,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        discount: item.discount
      });
    });

    setIsLoading(true);
    try {
      const payload = {
        proformaNo: data.proformaNo,
        customerId: data.customerId,
        shopId: data.shopId,
        proformaDate: data.proformaDate,
        validUntil: data.validUntil || null,
        notes: data.notes,
        discount: Number(data.discount),
        tax: Number(data.tax),
        items: data.items.map((item) => ({
          productId: item.productId,
          isBox: item.isBox === true,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          discount: Number(item.discount) || 0
        }))
      };

      if (isEdit && initialData?.id) {
        await updateProforma(initialData.id, payload);
        toast.success('Proforma updated successfully');
      } else {
        await createProforma(payload);
        toast.success('Proforma created successfully');
      }
      router.push('/dashboard/proforma');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving proforma:', error);
      console.error('Error response:', error?.response?.data);
      const message =
        error?.response?.data?.message ||
        'An error occurred while saving proforma.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const darkStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      color: '#f9fafb'
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: '#1f2937',
      color: '#f9fafb'
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#374151' : '#1f2937',
      color: '#f9fafb'
    }),
    singleValue: (base: any) => ({
      ...base,
      color: '#f9fafb'
    }),
    input: (base: any) => ({
      ...base,
      color: '#f9fafb'
    }),
    placeholder: (base: any) => ({
      ...base,
      color: '#9ca3af'
    })
  };

  if (!isMounted) {
    return (
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
            {isEdit ? 'Edit Proforma' : 'Create Proforma'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {isEdit ? 'Edit Proforma' : 'Create Proforma'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='proformaNo'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proforma Number</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter proforma number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='customerId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <FormControl>
                      <Select
                        instanceId='customer-select'
                        options={customers.map((customer) => ({
                          value: customer?.id?.toString() ?? '',
                          label: customer?.name ?? 'Unnamed Customer'
                        }))}
                        onChange={(newValue) =>
                          field.onChange(newValue?.value || '')
                        }
                        value={customers
                          .map((c) => ({
                            value: c?.id?.toString() ?? '',
                            label: c?.name ?? 'Unnamed Customer'
                          }))
                          .find((c) => c.value === field.value)}
                        placeholder='Search for a customer'
                        isSearchable
                        styles={isDark ? darkStyles : {}}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='shopId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop</FormLabel>
                    <ShadcnSelect
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select a shop' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {shops.map((shop) => (
                          <SelectItem
                            key={shop.id}
                            value={shop.id.toString()}
                          >
                            {shop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </ShadcnSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='proformaDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proforma Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='validUntil'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Until (Optional)</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='discount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount (Amount)</FormLabel>
                    <FormControl>
                      <Input 
                        type='number' 
                        placeholder='0.00' 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='tax'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax (Amount)</FormLabel>
                    <FormControl>
                      <Input 
                        type='number' 
                        placeholder='0.00' 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='items'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Items</FormLabel>
                  <FormControl>
                    <div className='space-y-4'>
                      {/* Header with correct column count: 6 columns */}
                      <div className='grid grid-cols-6 gap-4 text-sm font-semibold'>
                        <div>Product</div>
                        <div className='text-center'>Box/Piece</div>
                        <div>Quantity</div>
                        <div>Unit Price</div>
                        <div>Total</div>
                        <div>Action</div>
                      </div>

                      {field.value.map((item, index) => (
                        <div
                          key={index}
                          className='grid grid-cols-6 items-center gap-4'
                        >
                          {/* Product - col 1 */}
                          <div>
                            <Select
                              instanceId={`product-select-${index}`}
                              options={products.map((product) => ({
                                value: product.id.toString(),
                                label: product.name
                              }))}
                              onChange={(newValue) => {
                                const newItems = [...field.value];
                                newItems[index].productId =
                                  newValue?.value || '';
                                field.onChange(newItems);
                              }}
                              value={products
                                .map((p) => ({
                                  value: p.id.toString(),
                                  label: p.name
                                }))
                                .find((p) => p.value === item.productId)}
                              placeholder='Search product'
                              isSearchable
                              styles={isDark ? darkStyles : {}}
                            />
                          </div>

                          {/* isBox Switch - col 2 */}
                          <div className='flex items-center justify-center'>
                            <FormField
                              control={form.control}
                              name={`items.${index}.isBox`}
                              render={({ field: switchField }) => (
                                <Switch
                                  checked={switchField.value}
                                  onCheckedChange={(checked) => {
                                    switchField.onChange(checked);
                                    console.log(`Item ${index} isBox changed to:`, checked);
                                  }}
                                  className='data-[state=checked]:bg-primary'
                                />
                              )}
                            />
                          </div>

                          {/* Quantity - col 3 */}
                          <div>
                            <Input
                              type='number'
                              placeholder='Qty'
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...field.value];
                                const quantity = Number(e.target.value);
                                newItems[index].quantity = isNaN(quantity)
                                  ? 0
                                  : quantity;
                                newItems[index].totalPrice =
                                  newItems[index].quantity *
                                  newItems[index].unitPrice;
                                field.onChange(newItems);
                                updateItemTotal(index);
                              }}
                            />
                          </div>

                          {/* Unit Price - col 4 */}
                          <div>
                            <Input
                              type='number'
                              placeholder='Price'
                              value={item.unitPrice}
                              onChange={(e) => {
                                const newItems = [...field.value];
                                const unitPrice = Number(e.target.value);
                                newItems[index].unitPrice = isNaN(unitPrice)
                                  ? 0
                                  : unitPrice;
                                newItems[index].totalPrice =
                                  newItems[index].quantity *
                                  newItems[index].unitPrice;
                                field.onChange(newItems);
                                updateItemTotal(index);
                              }}
                            />
                          </div>

                          {/* Total Price - col 5 */}
                          <div className='flex items-center justify-center'>
                            <span className='text-sm font-medium'>
                              {(item.quantity * item.unitPrice).toFixed(2)}
                            </span>
                          </div>

                          {/* Delete Button - col 6 */}
                          <div>
                            <Button
                              type='button'
                              variant='destructive'
                              size='sm'
                              onClick={() => {
                                const newItems = [...field.value];
                                newItems.splice(index, 1);
                                field.onChange(newItems);
                              }}
                              disabled={field.value.length <= 1}
                            >
                              <IconTrash size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Summary Row - 6 columns */}
                      <div className='grid grid-cols-6 items-center gap-4 border-t pt-4'>
                        <div className='col-span-4 text-right font-semibold'>
                          Subtotal:
                        </div>
                        <div className='text-center font-bold'>
                          {subTotal.toFixed(2)}
                        </div>
                        <div></div>
                      </div>

                      <div className='flex justify-end'>
                        <Button
                          type='button'
                          onClick={() => {
                            field.onChange([
                              ...field.value,
                              {
                                productId: '',
                                isBox: false,
                                quantity: 1,
                                unitPrice: 0,
                                totalPrice: 0,
                                discount: 0
                              }
                            ]);
                          }}
                        >
                          <IconPlus size={16} className='mr-2' />
                          Add Item
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Totals Summary */}
            <div className='rounded-lg bg-muted p-4 space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='text-sm font-medium'>Subtotal:</div>
                <div className='text-lg font-semibold'>
                  {subTotal.toFixed(2)}
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <div className='text-sm font-medium'>Discount:</div>
                <div className='text-lg font-semibold text-red-600'>
                  - {discount.toFixed(2)}
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <div className='text-sm font-medium'>Tax:</div>
                <div className='text-lg font-semibold text-yellow-600'>
                  + {tax.toFixed(2)}
                </div>
              </div>
              <div className='flex items-center justify-between border-t pt-2'>
                <div className='text-lg font-bold'>Grand Total:</div>
                <div className='text-2xl font-bold text-green-600'>
                  {grandTotal.toFixed(2)}
                </div>
              </div>
              <div className='text-sm text-muted-foreground'>
                Total Products: {totalProducts}
              </div>
            </div>

            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter notes' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isEdit ? 'Update Proforma' : 'Create Proforma'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}