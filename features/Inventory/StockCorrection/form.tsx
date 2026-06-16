/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
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
import { useEffect, useState, useCallback, useRef } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { IStockCorrection, StockCorrectionReason } from '@/models/StockCorrection';
import {
  createStockCorrection,
  updateStockCorrection
} from '@/service/StockCorrection';
import { getStoresAll } from '@/service/store';
import { getShowroomsAll } from '@/service/showroom';
import { getProducts } from '@/service/transfer';

// Define types for form data
interface FormItemType {
  productId: string;
  quantity: number | string;
  availableStock?: number;
  stockLoading?: boolean;
  stockError?: string;
}

interface FormDataType {
  reason: StockCorrectionReason | string;
  reference: string;
  notes: string;
  locationType: 'STORE' | 'SHOWROOM';
  storeId?: string;
  showroomId?: string;
  productType: 'items' | 'materials';
  items: FormItemType[];
}

interface StockCorrectionFormProps {
  initialData: IStockCorrection | null;
  isEdit?: boolean;
}

interface AvailableProduct {
  id: string;
  name: string;
  color?: string;
  size?: string;
  price?: number;
  imageUrl?: string;
  stockQuantity: number;
  // For items
  category?: string;
  type?: string;
  // For materials
  materialType?: string;
  unitOfMeasure?: string;
  plainMDF?: boolean;
  laminatedMDF?: boolean;
  wood?: boolean;
  metal?: boolean;
  accessory?: boolean;
  other?: boolean;
}

// Reason options for the select dropdown
const reasonOptions = [
  { value: 'PURCHASE_ERROR', label: 'Purchase Error' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'MANUAL_ADJUSTMENT', label: 'Manual Adjustment' }
];

export default function StockCorrectionForm({
  initialData,
  isEdit = false
}: StockCorrectionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  
  const hasFetchedProductsRef = useRef(false);
  const lastLocationRef = useRef<string>('');
  
  const router = useRouter();

  // Initialize form
  const form = useForm<FormDataType>({
    defaultValues: {
      reason: initialData?.reason || 'MANUAL_ADJUSTMENT',
      reference: initialData?.reference || '',
      notes: initialData?.notes || '',
      locationType: initialData?.storeId ? 'STORE' : 'SHOWROOM',
      storeId: initialData?.storeId || '',
      showroomId: initialData?.showroomId || '',
      productType: initialData?.items?.[0]?.materialId ? 'materials' : 'items',
      items: initialData?.items?.map((item) => ({
        productId: item.materialId?.toString() || item.itemId?.toString() || '',
        quantity: Number(item.quantity),
        availableStock: 0
      })) || [{ productId: '', quantity: 1, availableStock: 0 }]
    }
  });

  const locationType = form.watch('locationType');
  const storeId = form.watch('storeId');
  const showroomId = form.watch('showroomId');
  const productType = form.watch('productType');
  const watchedItems = form.watch('items');

  const currentLocation = `${locationType}-${productType}-${locationType === 'STORE' ? storeId : showroomId}`;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch stores and showrooms
  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const [storesData, showroomsData] = await Promise.all([
          getStoresAll(),
          getShowroomsAll(),
        ]);
        setStores(storesData);
        setShowrooms(showroomsData);
      } catch {
        toast.error('Failed to load stores or showrooms');
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  // Fetch products from location using the getProducts API
  const fetchProductsFromLocation = useCallback(async () => {
    // Don't fetch if no location is selected
    if (
      (locationType === 'STORE' && !storeId) ||
      (locationType === 'SHOWROOM' && !showroomId)
    ) {
      setAvailableProducts([]);
      hasFetchedProductsRef.current = false;
      lastLocationRef.current = '';
      return;
    }

    // Skip if we've already fetched for this location
    if (currentLocation === lastLocationRef.current && hasFetchedProductsRef.current) {
      return;
    }

    console.log(`Fetching ${productType} for location: ${currentLocation}`);
    
    setLoadingProducts(true);
    hasFetchedProductsRef.current = true;
    lastLocationRef.current = currentLocation;

    try {
      const locationId = locationType === 'STORE' ? storeId : showroomId;
      if (!locationId) return;

      const source = locationType === 'STORE' ? 'store' : 'showroom';
      
      // Use the getProducts API
      const response = await getProducts({
        type: productType,
        source: source,
        id: locationId
      });

      // Extract products from response
      const products = response.products || response.data || response;
      
      // Map products to AvailableProduct format
      const mappedProducts = products.map((product: any) => ({
        id: product.id,
        name: product.name,
        color: product.color,
        size: product.size,
        price: product.price,
        imageUrl: product.imageUrl,
        stockQuantity: product.stockQuantity || product.stock?.totalQuantity || 0,
        // For items
        category: product.category?.name,
        type: product.type?.name,
        // For materials
        materialType: product.materialType?.name,
        unitOfMeasure: product.unitOfMeasure?.name,
        plainMDF: product.plainMDF,
        laminatedMDF: product.laminatedMDF,
        wood: product.wood,
        metal: product.metal,
        accessory: product.accessory,
        other: product.other
      }));

      setAvailableProducts(mappedProducts);
      
      // Update available stock for selected items
      const currentItems = form.getValues('items');
      const updatedItems = currentItems.map((item) => {
        const product = mappedProducts.find((p: { id: string; }) => p.id === item.productId);
        if (product) {
          return {
            ...item,
            availableStock: product.stockQuantity,
            stockError: undefined
          };
        }
        return item;
      });
      form.setValue('items', updatedItems);
      
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products from location');
      setAvailableProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [currentLocation, locationType, storeId, showroomId, productType, form]);

  // Debounced fetch effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProductsFromLocation();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [fetchProductsFromLocation]);

  // Validate quantity when it changes
  useEffect(() => {
    const validateQuantities = () => {
      if (!watchedItems) return;

      watchedItems.forEach((item, index) => {
        if (!item.productId) return;
        
        const quantity = parseFloat(item.quantity.toString());
        const availableStock = item.availableStock || 0;
        
        if (!isNaN(quantity) && quantity < 0 && Math.abs(quantity) > availableStock) {
          form.setError(`items.${index}.quantity` as any, {
            type: 'manual',
            message: `Cannot subtract ${Math.abs(quantity)}. Only ${availableStock} available.`
          });
        } else {
          form.clearErrors(`items.${index}.quantity` as any);
        }
      });
    };

    validateQuantities();
  }, [watchedItems, form]);

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

  const onSubmit: SubmitHandler<FormDataType> = async (data) => {
    // Validate location
    if (data.locationType === 'STORE' && !data.storeId) {
      toast.error('Store is required');
      return;
    }

    if (data.locationType === 'SHOWROOM' && !data.showroomId) {
      toast.error('Showroom is required');
      return;
    }

    // Filter out incomplete items
    const validItems = data.items.filter(
      (item) => item.productId && parseFloat(item.quantity.toString()) !== 0
    );
    
    if (validItems.length === 0) {
      toast.error('Please add at least one valid item');
      return;
    }

    // Validate all negative quantities have sufficient stock
    for (const item of validItems) {
      const quantity = parseFloat(item.quantity.toString());
      const availableStock = item.availableStock || 0;
      
      if (quantity < 0 && Math.abs(quantity) > availableStock) {
        toast.error(`Insufficient stock for ${availableProducts.find(p => p.id === item.productId)?.name}. Only ${availableStock} available.`);
        return;
      }
    }

    setIsLoading(true);
    try {
      // Transform items based on product type
      const transformedItems = validItems.map((item) => ({
        [data.productType === 'items' ? 'itemId' : 'materialId']: item.productId,
        quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity
      }));

      const payload = {
        reason: data.reason as StockCorrectionReason,
        reference: data.reference?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        storeId: data.locationType === 'STORE' ? data.storeId : undefined,
        showroomId: data.locationType === 'SHOWROOM' ? data.showroomId : undefined,
        ismaterial: data.productType === 'materials',
        items: transformedItems
      };

      if (isEdit && initialData?.id) {
        await updateStockCorrection(initialData.id, payload);
        toast.success('Stock correction updated successfully');
      } else {
        await createStockCorrection(payload);
        toast.success('Stock correction created successfully');
      }

      router.push('/dashboard/StockCorrection');
      router.refresh();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'An error occurred while saving stock correction.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted || loadingLocations) {
    return (
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
            {isEdit ? 'Edit Stock Correction' : 'Create Stock Correction'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <div className='text-center'>
              <div className='border-primary mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2'></div>
              <div>Loading form...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {isEdit ? 'Edit Stock Correction' : 'Create Stock Correction'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='reason'
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <ShadcnSelect
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select reason' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reasonOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </ShadcnSelect>
                    {fieldState.error && (
                      <p className='text-sm font-medium text-destructive'>
                        {fieldState.error.message}
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='reference'
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Reference (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter reference' {...field} />
                    </FormControl>
                    {fieldState.error && (
                      <p className='text-sm font-medium text-destructive'>
                        {fieldState.error.message}
                      </p>
                    )}
                  </FormItem>
                )}
              />
            </div>

            {/* Product Type Selection */}
            <div className='rounded-lg border p-4'>
              <h3 className='mb-4 text-lg font-semibold'>Step 1: Select Product Type</h3>
              <FormField
                control={form.control}
                name='productType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What do you want to adjust?</FormLabel>
                    <ShadcnSelect
                      value={field.value}
                      onValueChange={(value: 'items' | 'materials') => {
                        field.onChange(value);
                        form.setValue('items', [{ productId: '', quantity: 1, availableStock: 0 }]);
                        setAvailableProducts([]);
                        hasFetchedProductsRef.current = false;
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select product type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='items'>Items (Products)</SelectItem>
                        <SelectItem value='materials'>Materials (Raw Materials)</SelectItem>
                      </SelectContent>
                    </ShadcnSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location Selection */}
            <div className='rounded-lg border p-4'>
              <h3 className='mb-4 text-lg font-semibold'>Step 2: Select Location</h3>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='locationType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Type</FormLabel>
                      <ShadcnSelect
                        value={field.value}
                        onValueChange={(value: 'STORE' | 'SHOWROOM') => {
                          field.onChange(value);
                          if (value === 'STORE') {
                            form.setValue('showroomId', '');
                          } else {
                            form.setValue('storeId', '');
                          }
                          form.setValue('items', [{ productId: '', quantity: 1, availableStock: 0 }]);
                          setAvailableProducts([]);
                          hasFetchedProductsRef.current = false;
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select location type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='STORE'>Store</SelectItem>
                          <SelectItem value='SHOWROOM'>Showroom</SelectItem>
                        </SelectContent>
                      </ShadcnSelect>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {locationType === 'STORE' && (
                  <FormField
                    control={form.control}
                    name='storeId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store</FormLabel>
                        <ShadcnSelect
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('items', [{ productId: '', quantity: 1, availableStock: 0 }]);
                            setAvailableProducts([]);
                            hasFetchedProductsRef.current = false;
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select store' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stores.map((store) => (
                              <SelectItem key={store.id} value={store.id.toString()}>
                                {store.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </ShadcnSelect>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {locationType === 'SHOWROOM' && (
                  <FormField
                    control={form.control}
                    name='showroomId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Showroom</FormLabel>
                        <ShadcnSelect
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('items', [{ productId: '', quantity: 1, availableStock: 0 }]);
                            setAvailableProducts([]);
                            hasFetchedProductsRef.current = false;
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select showroom' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {showrooms.map((showroom) => (
                              <SelectItem key={showroom.id} value={showroom.id.toString()}>
                                {showroom.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </ShadcnSelect>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Items Selection */}
            <div className='rounded-lg border p-4'>
              <h3 className='mb-4 text-lg font-semibold'>Step 3: Select Products to Adjust</h3>
              <FormField
                control={form.control}
                name='items'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className='space-y-4'>
                        <div className='grid grid-cols-5 gap-4 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                          <div className='col-span-2'>Product</div>
                          <div>Quantity (+/-)</div>
                          <div>Available Stock</div>
                          <div>Action</div>
                        </div>

                        {field.value.map((item, index) => {
                          const selectedProduct = availableProducts.find(
                            (p) => p.id === item.productId
                          );

                          const productOptions = availableProducts.map((product) => ({
                            value: product.id,
                            label: `${product.name}${product.color ? ` - ${product.color}` : ''}${product.size ? ` (${product.size})` : ''}`,
                            data: product
                          }));

                          return (
                            <div key={index} className='grid grid-cols-5 items-center gap-4'>
                              <div className='col-span-2'>
                                <Select
                                  instanceId={`product-select-${index}`}
                                  options={productOptions}
                                  onChange={(newValue: any) => {
                                    const newItems = [...field.value];
                                    const selectedProductData = availableProducts.find(p => p.id === newValue?.value);
                                    newItems[index].productId = newValue?.value || '';
                                    newItems[index].quantity = 1;
                                    newItems[index].availableStock = selectedProductData?.stockQuantity || 0;
                                    newItems[index].stockError = undefined;
                                    field.onChange(newItems);
                                  }}
                                  value={
                                    productOptions.find(
                                      (p) => p.value === item.productId
                                    ) || null
                                  }
                                  placeholder={loadingProducts ? "Loading products..." : "Search product"}
                                  isSearchable
                                  isDisabled={loadingProducts || availableProducts.length === 0}
                                  isLoading={loadingProducts}
                                  styles={isDark ? darkStyles : {}}
                                />
                                {selectedProduct && (
                                  <div className='mt-1 text-xs text-gray-500'>
                                    {productType === 'items' ? (
                                      <>
                                        {selectedProduct.category && `Category: ${selectedProduct.category}`}
                                        {selectedProduct.type && ` | Type: ${selectedProduct.type}`}
                                      </>
                                    ) : (
                                      <>
                                        {selectedProduct.materialType && `Type: ${selectedProduct.materialType}`}
                                        {selectedProduct.unitOfMeasure && ` | Unit: ${selectedProduct.unitOfMeasure}`}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div>
                                <Input
                                  type='text'
                                  inputMode='decimal'
                                  placeholder='+/- Qty'
                                  value={item.quantity.toString()}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow numbers, decimal point, and minus sign
                                    const validPattern = /^-?\d*\.?\d*$/;
                                    
                                    if (validPattern.test(value)) {
                                      const newItems = [...field.value];
                                      newItems[index].quantity = value;
                                      field.onChange(newItems);
                                    }
                                  }}
                                  disabled={!item.productId || loadingProducts}
                                  className={form.getFieldState(`items.${index}.quantity` as any).error ? 'border-red-500' : ''}
                                />
                                {form.getFieldState(`items.${index}.quantity` as any).error && (
                                  <p className='text-sm font-medium text-destructive mt-1'>
                                    {form.getFieldState(`items.${index}.quantity` as any).error?.message}
                                  </p>
                                )}
                              </div>

                              <div className='text-sm'>
                                {selectedProduct ? (
                                  <span className={selectedProduct.stockQuantity === 0 ? 'text-red-500' : 'text-green-600'}>
                                    {selectedProduct.stockQuantity} available
                                  </span>
                                ) : (
                                  <span className='text-gray-400'>Select product</span>
                                )}
                              </div>

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
                          );
                        })}

                        <div className='flex justify-end'>
                          <Button
                            type='button'
                            onClick={() => {
                              field.onChange([
                                ...field.value,
                                { productId: '', quantity: 1, availableStock: 0 }
                              ]);
                            }}
                            disabled={loadingProducts || availableProducts.length === 0}
                          >
                            Add Item
                          </Button>
                        </div>

                        {availableProducts.length === 0 && !loadingProducts && (
                          <div className='rounded-lg bg-yellow-50 p-4 text-center text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'>
                            <p>No products available at the selected location.</p>
                            <p className='text-sm mt-1'>Please check that you have selected the correct product type and location.</p>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='notes'
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter notes (optional)' {...field} />
                  </FormControl>
                  {fieldState.error && (
                    <p className='text-sm font-medium text-destructive'>
                      {fieldState.error.message}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2'>
              <Button
                type='submit'
                disabled={isLoading || loadingProducts}
                className='min-w-24'
              >
                {isLoading ? (
                  <div className='flex items-center gap-2'>
                    <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
                    {isEdit ? 'Updating...' : 'Creating...'}
                  </div>
                ) : isEdit ? (
                  'Update Stock Correction'
                ) : (
                  'Create Stock Correction'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}