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
import { IPurchase } from '@/models/purchase';
import { IProduct } from '@/models/Product';
import { getStores } from '@/service/store';
import {
  getProducts,
  getUnitOfMeasuresByProductId
} from '@/service/Product';
import { createPurchase, updatePurchase } from '@/service/purchase';
import { ISupplier } from '@/models/supplier';
import { getSupplier } from '@/service/supplier';
import { useCallback, useEffect, useState } from 'react';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { Modal } from '@/components/ui/modal';
import CreateSupplierModal from './suppliyer';
import { IUnitOfMeasure } from '@/models/UnitOfMeasure';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// TypeScript interfaces for form values
interface FormItemValues {
  productId: string;
  unitOfMeasureId: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  height?: number;
  width?: number;
}

interface FormValues {
  invoiceNo: string;
  supplierId: string;
  storeId: string;
  purchaseDate: string;
  paymentStatus: string;
  notes?: string;
  items: FormItemValues[];
}

interface PurchaseFormProps {
  initialData: IPurchase | null;
  isEdit?: boolean;
}

export default function PurchaseForm({
  initialData,
  isEdit = false
}: PurchaseFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<{
    [key: string]: IUnitOfMeasure[];
  }>({});
  const [isMounted, setIsMounted] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [loadingUOM, setLoadingUOM] = useState<{ [key: string]: boolean }>({});
  const [itemTypes, setItemTypes] = useState<{ [key: number]: 'quantity' | 'dimension' }>({});
  const router = useRouter();

  const form = useForm<FormValues>({
    defaultValues: {
      invoiceNo: initialData?.invoiceNo || '',
      supplierId: initialData?.supplierId?.toString() || '',
      storeId: initialData?.storeId?.toString() || '',
      purchaseDate: initialData?.purchaseDate
        ? new Date(initialData.purchaseDate).toISOString().split('T')[0]
        : format(new Date(), 'yyyy-MM-dd'),
      paymentStatus: initialData?.paymentStatus || 'PENDING',
      notes: initialData?.notes || '',
      items:
        initialData?.items?.map((item) => ({
          ...item,
          productId: item.productId.toString(),
          unitOfMeasureId: item.unitOfMeasureId.toString(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          height: item.height ? Number(item.height) : undefined,
          width: item.width ? Number(item.width) : undefined
        })) || []
    }
  });

  // Initialize item types from initial data
  useEffect(() => {
    if (initialData?.items) {
      const types: { [key: number]: 'quantity' | 'dimension' } = {};
      initialData.items.forEach((item, index) => {
        if (item.height && item.width) {
          types[index] = 'dimension';
        } else {
          types[index] = 'quantity';
        }
      });
      setItemTypes(types);
    }
  }, [initialData]);

  // Calculate totals
  const items = form.watch('items');
  const grandTotal = items.reduce(
    (total, item) => total + ((item.quantity || 0) * (item.unitPrice || 0)),
    0
  );
  const totalProducts = items.filter((item) => item.productId).length;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch suppliers, stores, products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersData, storesData, productsData] = await Promise.all([
          getSupplier(),
          getStores(),
          getProducts()
        ]);
        setSuppliers(suppliersData);
        setStores(storesData);
        setProducts(productsData);
      } catch {
        toast.error('Failed to load suppliers, stores, or products');
      }
    };
    fetchData();
  }, []);

  const fetchUnitsOfMeasure = useCallback(
    async (productId: string) => {
      if (!productId) return;

      if (!unitsOfMeasure[productId] && !loadingUOM[productId]) {
        setLoadingUOM((prev) => ({ ...prev, [productId]: true }));
        try {
          const uomData = await getUnitOfMeasuresByProductId(productId);

          let uomArray: IUnitOfMeasure[] = [];

          if (Array.isArray(uomData)) {
            uomArray = uomData;
          } else if (uomData && typeof uomData === 'object') {
            uomArray = [uomData as IUnitOfMeasure];
          }

          setUnitsOfMeasure((prev) => ({ ...prev, [productId]: uomArray }));

          if (uomArray.length === 1) {
            const currentItems = form.getValues('items');
            const updatedItems = currentItems.map((item) => {
              if (item.productId === productId && !item.unitOfMeasureId) {
                return {
                  ...item,
                  unitOfMeasureId: uomArray[0]?.id?.toString() || ''
                };
              }
              return item;
            });
            form.setValue('items', updatedItems);
          }
        } catch {
          toast.error('Failed to load units of measure');
          setUnitsOfMeasure((prev) => ({ ...prev, [productId]: [] }));
        } finally {
          setLoadingUOM((prev) => ({ ...prev, [productId]: false }));
        }
      }
    },
    [unitsOfMeasure, loadingUOM, form]
  );

  useEffect(() => {
    items.forEach((item) => {
      if (
        item.productId &&
        !unitsOfMeasure[item.productId] &&
        !loadingUOM[item.productId]
      ) {
        fetchUnitsOfMeasure(item.productId);
      }
    });
  }, [
    items,
    unitsOfMeasure,
    loadingUOM,
    fetchUnitsOfMeasure
  ]);

  // Check if a product is already selected
  const isProductSelected = (productId: string, currentIndex: number): boolean => {
    return items.some((item, idx) => idx !== currentIndex && item.productId === productId);
  };

  // Get available products (excluding already selected ones)
  const getAvailableProducts = (currentIndex: number) => {
    const selectedProductIds = items
      .filter((_, idx) => idx !== currentIndex)
      .map(item => item.productId)
      .filter(id => id);
    
    return products.filter(product => !selectedProductIds.includes(product.id.toString()));
  };

  const handleSupplierCreated = () => {
    setShowSupplierModal(false);
    getSupplier()
      .then(setSuppliers)
      .catch(() => {
        toast.error('Failed to refresh suppliers');
      });
  };

  const updateItemTotal = (index: number) => {
    const items = form.getValues('items');
    const item = items[index];
    const totalPrice = (item.quantity || 0) * (item.unitPrice || 0);

    const updatedItems = [...items];
    updatedItems[index] = { ...item, totalPrice };
    form.setValue('items', updatedItems);
  };

  const validateForm = (data: FormValues): boolean => {
    let isValid = true;

    if (!data.invoiceNo || data.invoiceNo.trim() === '') {
      form.setError('invoiceNo', {
        type: 'manual',
        message: 'Invoice No is required'
      });
      isValid = false;
    }

    if (!data.supplierId || data.supplierId.trim() === '') {
      form.setError('supplierId', {
        type: 'manual',
        message: 'Supplier is required'
      });
      isValid = false;
    }

    if (!data.storeId || data.storeId.trim() === '') {
      form.setError('storeId', {
        type: 'manual',
        message: 'Store is required'
      });
      isValid = false;
    }

    if (!data.purchaseDate || data.purchaseDate.trim() === '') {
      form.setError('purchaseDate', {
        type: 'manual',
        message: 'Purchase Date is required'
      });
      isValid = false;
    }

    if (!data.paymentStatus || data.paymentStatus.trim() === '') {
      form.setError('paymentStatus', {
        type: 'manual',
        message: 'Payment status is required'
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
      const itemType = itemTypes[index] || 'quantity';

      if (!item.productId || item.productId.trim() === '') {
        form.setError(`items.${index}.productId` as any, {
          type: 'manual',
          message: 'Product is required'
        });
        isValid = false;
      }

      if (!item.unitOfMeasureId || item.unitOfMeasureId.trim() === '') {
        form.setError(`items.${index}.unitOfMeasureId` as any, {
          type: 'manual',
          message: 'Unit of measure is required'
        });
        isValid = false;
      }

      // Quantity validation - only if quantity is provided
      if (item.quantity !== undefined && (item.quantity < 0 || isNaN(item.quantity))) {
        form.setError(`items.${index}.quantity` as any, {
          type: 'manual',
          message: 'Quantity must be 0 or greater'
        });
        isValid = false;
      }

      if (itemType === 'dimension') {
        if (!item.height || item.height <= 0 || isNaN(item.height)) {
          form.setError(`items.${index}.height` as any, {
            type: 'manual',
            message: 'Height must be greater than 0'
          });
          isValid = false;
        }
        if (!item.width || item.width <= 0 || isNaN(item.width)) {
          form.setError(`items.${index}.width` as any, {
            type: 'manual',
            message: 'Width must be greater than 0'
          });
          isValid = false;
        }
      }

      // Unit price validation - only if unit price is provided
      if (item.unitPrice !== undefined && (item.unitPrice < 0 || isNaN(item.unitPrice))) {
        form.setError(`items.${index}.unitPrice` as any, {
          type: 'manual',
          message: 'Unit price must be 0 or greater'
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

    setIsLoading(true);
    try {
      const payload = {
        ...data,
        items: data.items.map((item, index) => {
          const itemType = itemTypes[index] || 'quantity';
          const baseItem = {
            productId: item.productId,
            unitOfMeasureId: item.unitOfMeasureId,
            quantity: item.quantity !== undefined ? Number(item.quantity) : 0,
            unitPrice: item.unitPrice !== undefined ? Number(item.unitPrice) : 0,
            totalPrice: (item.quantity || 0) * (item.unitPrice || 0)
          };

          if (itemType === 'dimension') {
            return {
              ...baseItem,
              height: Number(item.height),
              width: Number(item.width)
            };
          }

          return baseItem;
        })
      };

      if (isEdit && initialData?.id) {
        await updatePurchase(initialData.id, payload);
        toast.success('Purchase updated successfully');
      } else {
        await createPurchase(payload);
        toast.success('Purchase created successfully');
      }
      router.push('/dashboard/purchase');
      router.refresh();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'An error occurred while saving purchase.';
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
      color: '#f9fafb',
      cursor: state.isDisabled ? 'not-allowed' : 'default',
      opacity: state.isDisabled ? 0.5 : 1
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

  // Function to delete item (always allowed)
  const deleteItem = (index: number, field: any) => {
    const newItems = [...field.value];
    newItems.splice(index, 1);
    field.onChange(newItems);
    
    // Update item types
    const newTypes = { ...itemTypes };
    delete newTypes[index];
    const reindexedTypes: { [key: number]: 'quantity' | 'dimension' } = {};
    Object.values(newTypes).forEach((type, i) => {
      reindexedTypes[i] = type;
    });
    setItemTypes(reindexedTypes);
  };

  if (!isMounted) {
    return (
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
            {isEdit ? 'Edit Purchase' : 'Create Purchase'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
            {isEdit ? 'Edit Purchase' : 'Create Purchase'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='invoiceNo'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice No</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter invoice number' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='supplierId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <div className='flex gap-2'>
                        <div className='flex-1'>
                          <Select
                            instanceId='supplier-select'
                            options={suppliers.map((supplier) => ({
                              value: supplier?.id?.toString() ?? '',
                              label: supplier?.name ?? 'Unnamed Supplier'
                            }))}
                            onChange={(newValue) =>
                              field.onChange(newValue?.value || '')
                            }
                            value={suppliers
                              .map((s) => ({
                                value: s?.id?.toString() ?? '',
                                label: s?.name ?? 'Unnamed Supplier'
                              }))
                              .find((s) => s.value === field.value)}
                            placeholder='Search for a supplier'
                            isSearchable
                            styles={isDark ? darkStyles : {}}
                          />
                        </div>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => setShowSupplierModal(true)}
                        >
                          <IconPlus size={16} />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='storeId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store</FormLabel>
                      <ShadcnSelect
                        value={field.value}
                        onValueChange={(value: string) => field.onChange(value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select a store' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stores.map((store) => (
                            <SelectItem
                              key={store.id}
                              value={store.id.toString()}
                            >
                              {store.name}
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
                  name='purchaseDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
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
                        {/* Responsive header - hidden on mobile */}
                        <div className='hidden lg:grid lg:grid-cols-8 xl:grid-cols-9 gap-4 text-sm font-semibold'>
                          <div>Product</div>
                          <div>Unit</div>
                          <div>Type</div>
                          <div>Qty</div>
                          <div>Height</div>
                          <div>Width</div>
                          <div>Price</div>
                          <div>Total</div>
                          <div>Action</div>
                        </div>

                        {field.value.map((item, index) => (
                          <div
                            key={index}
                            className='border rounded-lg p-4 lg:p-0 lg:border-none space-y-4 lg:space-y-0'
                          >
                            {/* Mobile view - stacked layout */}
                            <div className='lg:hidden space-y-3'>
                              <div className='flex justify-between items-start'>
                                <Label className='font-semibold'>Product</Label>
                                <Button
                                  type='button'
                                  variant='destructive'
                                  size='sm'
                                  onClick={() => deleteItem(index, field)}
                                >
                                  <IconTrash size={16} />
                                </Button>
                              </div>
                              
                              <div>
                                <Label className='text-sm'>Product</Label>
                                <Select
                                  instanceId={`product-select-mobile-${index}`}
                                  options={getAvailableProducts(index).map((product) => ({
                                    value: product.id.toString(),
                                    label: product.name
                                  }))}
                                  onChange={(newValue) => {
                                    const newItems = [...field.value];
                                    newItems[index].productId = newValue?.value || '';
                                    newItems[index].unitOfMeasureId = '';
                                    field.onChange(newItems);
                                    if (newValue?.value) {
                                      fetchUnitsOfMeasure(newValue.value);
                                    }
                                  }}
                                  value={products
                                    .map((p) => ({
                                      value: p.id.toString(),
                                      label: p.name
                                    }))
                                    .find((p) => p.value === item.productId)}
                                  placeholder='Search product'
                                  isSearchable
                                  isOptionDisabled={(option) => isProductSelected(option.value, index)}
                                  styles={isDark ? darkStyles : {}}
                                />
                              </div>

                              <div>
                                <Label className='text-sm'>Unit</Label>
                                <Select
                                  instanceId={`uom-select-mobile-${index}`}
                                  options={
                                    Array.isArray(unitsOfMeasure[item.productId])
                                      ? unitsOfMeasure[item.productId].map(
                                          (uom) => ({
                                            value: uom.id.toString(),
                                            label: uom.name
                                          })
                                        )
                                      : []
                                  }
                                  onChange={(newValue) => {
                                    const newItems = [...field.value];
                                    newItems[index].unitOfMeasureId = newValue?.value || '';
                                    field.onChange(newItems);
                                  }}
                                  value={
                                    Array.isArray(unitsOfMeasure[item.productId])
                                      ? unitsOfMeasure[item.productId]
                                          .map((uom) => ({
                                            value: uom.id.toString(),
                                            label: uom.name
                                          }))
                                          ?.find(
                                            (u) => u.value === item.unitOfMeasureId
                                          )
                                      : undefined
                                  }
                                  placeholder={
                                    loadingUOM[item.productId]
                                      ? 'Loading...'
                                      : 'Select unit'
                                  }
                                  isSearchable
                                  isDisabled={
                                    !item.productId ||
                                    loadingUOM[item.productId] ||
                                    (Array.isArray(unitsOfMeasure[item.productId]) &&
                                      unitsOfMeasure[item.productId].length === 1)
                                  }
                                  isLoading={loadingUOM[item.productId]}
                                  styles={isDark ? darkStyles : {}}
                                />
                              </div>

                              <div className='flex items-center space-x-2'>
                                <Checkbox
                                  id={`dimension-mobile-${index}`}
                                  checked={itemTypes[index] === 'dimension'}
                                  onCheckedChange={(checked) => {
                                    setItemTypes(prev => ({
                                      ...prev,
                                      [index]: checked ? 'dimension' : 'quantity'
                                    }));
                                    if (!checked) {
                                      const newItems = [...field.value];
                                      newItems[index].height = undefined;
                                      newItems[index].width = undefined;
                                      field.onChange(newItems);
                                    }
                                  }}
                                />
                                <Label htmlFor={`dimension-mobile-${index}`}>
                                  Use Dimensions
                                </Label>
                              </div>

                              <div className='grid grid-cols-2 gap-3'>
                                <div>
                                  <Label className='text-sm'>Quantity</Label>
                                  <Input
                                    type='number'
                                    placeholder='Qty'
                                    value={item.quantity === undefined ? '' : item.quantity}
                                    onChange={(e) => {
                                      const newItems = [...field.value];
                                      const value = e.target.value;
                                      const quantity = value === '' ? undefined : Number(value);
                                      if (quantity !== undefined && !isNaN(quantity) && quantity >= 0) {
                                        newItems[index].quantity = quantity;
                                        newItems[index].totalPrice = (quantity || 0) * (newItems[index].unitPrice || 0);
                                      } else if (value === '') {
                                        newItems[index].quantity = undefined;
                                        newItems[index].totalPrice = 0;
                                      }
                                      field.onChange(newItems);
                                      updateItemTotal(index);
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label className='text-sm'>Unit Price</Label>
                                  <Input
                                    type='number'
                                    placeholder='Price'
                                    value={item.unitPrice === undefined ? '' : item.unitPrice}
                                    onChange={(e) => {
                                      const newItems = [...field.value];
                                      const value = e.target.value;
                                      const unitPrice = value === '' ? undefined : Number(value);
                                      if (unitPrice !== undefined && !isNaN(unitPrice) && unitPrice >= 0) {
                                        newItems[index].unitPrice = unitPrice;
                                        newItems[index].totalPrice = (newItems[index].quantity || 0) * unitPrice;
                                      } else if (value === '') {
                                        newItems[index].unitPrice = undefined;
                                        newItems[index].totalPrice = 0;
                                      }
                                      field.onChange(newItems);
                                      updateItemTotal(index);
                                    }}
                                  />
                                </div>
                              </div>

                              {itemTypes[index] === 'dimension' && (
                                <div className='grid grid-cols-2 gap-3'>
                                  <div>
                                    <Label className='text-sm'>Height</Label>
                                    <Input
                                      type='number'
                                      min={0}
                                      placeholder='Height'
                                      value={item.height || ''}
                                      onChange={(e) => {
                                        const newItems = [...field.value];
                                        const height = Number(e.target.value);
                                        newItems[index].height = isNaN(height) ? undefined : height;
                                        field.onChange(newItems);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label className='text-sm'>Width</Label>
                                    <Input
                                      type='number'
                                      min={0}
                                      placeholder='Width'
                                      value={item.width || ''}
                                      onChange={(e) => {
                                        const newItems = [...field.value];
                                        const width = Number(e.target.value);
                                        newItems[index].width = isNaN(width) ? undefined : width;
                                        field.onChange(newItems);
                                      }}
                                    />
                                  </div>
                                </div>
                              )}

                              <div className='flex justify-between items-center pt-2 border-t'>
                                <Label className='font-semibold'>Total</Label>
                                <span className='text-lg font-bold text-green-600'>
                                  {((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {/* Desktop view - grid layout */}
                            <div className='hidden lg:grid lg:grid-cols-8 xl:grid-cols-9 items-center gap-4'>
                              <div>
                                <Select
                                  instanceId={`product-select-${index}`}
                                  options={getAvailableProducts(index).map((product) => ({
                                    value: product.id.toString(),
                                    label: product.name
                                  }))}
                                  onChange={(newValue) => {
                                    const newItems = [...field.value];
                                    newItems[index].productId = newValue?.value || '';
                                    newItems[index].unitOfMeasureId = '';
                                    field.onChange(newItems);
                                    if (newValue?.value) {
                                      fetchUnitsOfMeasure(newValue.value);
                                    }
                                  }}
                                  value={products
                                    .map((p) => ({
                                      value: p.id.toString(),
                                      label: p.name
                                    }))
                                    .find((p) => p.value === item.productId)}
                                  placeholder='Search product'
                                  isSearchable
                                  isOptionDisabled={(option) => isProductSelected(option.value, index)}
                                  styles={isDark ? darkStyles : {}}
                                />
                              </div>

                              <div>
                                <Select
                                  instanceId={`uom-select-${index}`}
                                  options={
                                    Array.isArray(unitsOfMeasure[item.productId])
                                      ? unitsOfMeasure[item.productId].map(
                                          (uom) => ({
                                            value: uom.id.toString(),
                                            label: uom.name
                                          })
                                        )
                                      : []
                                  }
                                  onChange={(newValue) => {
                                    const newItems = [...field.value];
                                    newItems[index].unitOfMeasureId = newValue?.value || '';
                                    field.onChange(newItems);
                                  }}
                                  value={
                                    Array.isArray(unitsOfMeasure[item.productId])
                                      ? unitsOfMeasure[item.productId]
                                          .map((uom) => ({
                                            value: uom.id.toString(),
                                            label: uom.name
                                          }))
                                          ?.find(
                                            (u) => u.value === item.unitOfMeasureId
                                          )
                                      : undefined
                                  }
                                  placeholder={
                                    loadingUOM[item.productId]
                                      ? 'Loading units...'
                                      : 'Select unit'
                                  }
                                  isSearchable
                                  isDisabled={
                                    !item.productId ||
                                    loadingUOM[item.productId] ||
                                    (Array.isArray(unitsOfMeasure[item.productId]) &&
                                      unitsOfMeasure[item.productId].length === 1)
                                  }
                                  isLoading={loadingUOM[item.productId]}
                                  styles={isDark ? darkStyles : {}}
                                  noOptionsMessage={() => 'No units available'}
                                />
                              </div>

                              <div>
                                <div className='flex items-center space-x-2'>
                                  <Checkbox
                                    id={`dimension-${index}`}
                                    checked={itemTypes[index] === 'dimension'}
                                    onCheckedChange={(checked) => {
                                      setItemTypes(prev => ({
                                        ...prev,
                                        [index]: checked ? 'dimension' : 'quantity'
                                      }));
                                      if (!checked) {
                                        const newItems = [...field.value];
                                        newItems[index].height = undefined;
                                        newItems[index].width = undefined;
                                        field.onChange(newItems);
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`dimension-${index}`}>
                                    Dim
                                  </Label>
                                </div>
                              </div>

                              <div>
                                <Input
                                  type='number'
                                  placeholder='Qty'
                                  value={item.quantity === undefined ? '' : item.quantity}
                                  onChange={(e) => {
                                    const newItems = [...field.value];
                                    const value = e.target.value;
                                    const quantity = value === '' ? undefined : Number(value);
                                    if (quantity !== undefined && !isNaN(quantity) && quantity >= 0) {
                                      newItems[index].quantity = quantity;
                                      newItems[index].totalPrice = (quantity || 0) * (newItems[index].unitPrice || 0);
                                    } else if (value === '') {
                                      newItems[index].quantity = undefined;
                                      newItems[index].totalPrice = 0;
                                    }
                                    field.onChange(newItems);
                                    updateItemTotal(index);
                                  }}
                                />
                              </div>

                              <div>
                                <Input
                                  type='number'
                                  min={0}
                                  placeholder='Height'
                                  value={item.height || ''}
                                  disabled={itemTypes[index] !== 'dimension'}
                                  className={itemTypes[index] !== 'dimension' ? 'opacity-50' : ''}
                                  onChange={(e) => {
                                    const newItems = [...field.value];
                                    const height = Number(e.target.value);
                                    newItems[index].height = isNaN(height) ? undefined : height;
                                    field.onChange(newItems);
                                  }}
                                />
                              </div>

                              <div>
                                <Input
                                  type='number'
                                  min={0}
                                  placeholder='Width'
                                  value={item.width || ''}
                                  disabled={itemTypes[index] !== 'dimension'}
                                  className={itemTypes[index] !== 'dimension' ? 'opacity-50' : ''}
                                  onChange={(e) => {
                                    const newItems = [...field.value];
                                    const width = Number(e.target.value);
                                    newItems[index].width = isNaN(width) ? undefined : width;
                                    field.onChange(newItems);
                                  }}
                                />
                              </div>

                              <div>
                                <Input
                                  type='number'
                                  placeholder='Price'
                                  value={item.unitPrice === undefined ? '' : item.unitPrice}
                                  onChange={(e) => {
                                    const newItems = [...field.value];
                                    const value = e.target.value;
                                    const unitPrice = value === '' ? undefined : Number(value);
                                    if (unitPrice !== undefined && !isNaN(unitPrice) && unitPrice >= 0) {
                                      newItems[index].unitPrice = unitPrice;
                                      newItems[index].totalPrice = (newItems[index].quantity || 0) * unitPrice;
                                    } else if (value === '') {
                                      newItems[index].unitPrice = undefined;
                                      newItems[index].totalPrice = 0;
                                    }
                                    field.onChange(newItems);
                                    updateItemTotal(index);
                                  }}
                                />
                              </div>

                              <div className='flex items-center justify-center'>
                                <span className='text-sm font-medium'>
                                  {((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                                </span>
                              </div>

                              <div>
                                <Button
                                  type='button'
                                  variant='destructive'
                                  size='sm'
                                  onClick={() => deleteItem(index, field)}
                                >
                                  <IconTrash size={16} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Summary Row - Responsive */}
                        <div className='border-t pt-4 mt-4'>
                          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3'>
                            <div className='text-sm'>
                              Total Products: {totalProducts}
                            </div>
                            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto'>
                              <div className='flex justify-between items-center w-full sm:w-auto'>
                                <span className='font-semibold mr-4'>Grand Total:</span>
                                <span className='text-2xl font-bold text-green-600'>
                                  {grandTotal.toFixed(2)}
                                </span>
                              </div>
                              <Button
                                type='button'
                                onClick={() => {
                                  field.onChange([
                                    ...field.value,
                                    {
                                      productId: '',
                                      unitOfMeasureId: '',
                                      quantity: undefined,
                                      unitPrice: undefined,
                                      totalPrice: 0,
                                      height: undefined,
                                      width: undefined
                                    }
                                  ]);
                                }}
                                className='w-full sm:w-auto'
                              >
                                <IconPlus size={16} className='mr-2' />
                                Add Item
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
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
                      <Input placeholder='Enter notes (optional)' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex justify-end gap-2'>
                <Button type='submit' disabled={isLoading}>
                  {isEdit ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Modal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title='Create New Supplier'
        description={''}
      >
        <CreateSupplierModal
          closeModal={() => setShowSupplierModal(false)}
          onSuccess={handleSupplierCreated}
        />
      </Modal>
    </>
  );
}