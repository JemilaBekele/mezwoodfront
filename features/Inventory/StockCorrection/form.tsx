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
import { getStores } from '@/service/store';
import { getShops } from '@/service/shop';
import { getUnitOfMeasuresByProductId } from '@/service/Product';
import { useCallback, useEffect, useState, useRef } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { getAvailableProductsBySource } from '@/service/productBatchService';
import { IUnitOfMeasure } from '@/models/UnitOfMeasure';
import { IStockCorrection } from '@/models/StockCorrection';
import {
  createStockCorrection,
  updateStockCorrection
} from '@/service/StockCorrection';
import { TransferEntityType } from '@/models/transfer';

// Define types for form data
interface FormItemType {
  productId: string;
  unitOfMeasureId: string;
  quantity: number | string;
  height?: number;
  width?: number;
  variantId?: string;
}

interface FormDataType {
  storeId: string;
  shopId: string;
  reason: 'PURCHASE_ERROR' | 'TRANSFER_ERROR' | 'EXPIRED' | 'DAMAGED' | 'MANUAL_ADJUSTMENT';
  reference: string;
  notes: string;
  items: FormItemType[];
}

interface StockCorrectionFormProps {
  initialData: IStockCorrection | null;
  isEdit?: boolean;
}

interface StoreStockItem {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;
  status: string;
  unitOfMeasureId: string;
  createdAt: string;
  updatedAt: string;
  store: {
    id: string;
    name: string;
    branchId: string;
  };
  product: {
    id: string;
    productCode: string;
    name: string;
    generic: string | null;
    description: string | null;
    sellPrice: number | null;
    imageUrl: string;
    isActive: boolean;
    warningQuantity: number;
    category: any;
    colour: {
      id: string;
      name: string;
    } | null;
    unitOfMeasure: IUnitOfMeasure;
  };
  unitOfMeasure: IUnitOfMeasure;
  availableQuantity: number;
  conversionFactor: number;
  variants?: Array<{
    id: string;
    height: number;
    width: number;
    quantity: number;
    area: number;
  }>;
  stockType: 'dimension' | 'quantity';
  hasVariants: boolean;
}

// Helper function to format product display with color
const formatProductLabel = (product: any): string => {
  const productName = product.name || 'Unknown Product';
  const colourName = product.colour?.name;
  
  if (colourName) {
    return `${productName} - ${colourName}`;
  }
  return productName;
};

// Helper function to format variant label
const formatVariantLabel = (variant: any): string => {
  return `${variant.height} x ${variant.width} (${variant.quantity} available)`;
};

export default function StockCorrectionForm({
  initialData,
  isEdit = false
}: StockCorrectionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [storeStockItems, setStoreStockItems] = useState<StoreStockItem[]>([]);
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<{
    [key: string]: IUnitOfMeasure[];
  }>({});
  const [isMounted, setIsMounted] = useState(false);
  const [loadingUOM, setLoadingUOM] = useState<{ [key: string]: boolean }>({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  
  const hasFetchedProductsRef = useRef(false);
  const lastLocationRef = useRef<string>('');
  
  const router = useRouter();

  // Initialize form
  const form = useForm<FormDataType>({
    defaultValues: {
      storeId: initialData?.storeId || '',
      shopId: initialData?.shopId || '',
      reason: initialData?.reason || 'MANUAL_ADJUSTMENT',
      reference: initialData?.reference || '',
      notes: initialData?.notes || '',
      items: initialData?.items?.map((item: any) => ({
        productId: item.productId.toString(),
        unitOfMeasureId: item.unitOfMeasureId.toString(),
        quantity: Number(item.quantity),
        height: item.height,
        width: item.width,
        variantId: item.variantId
      })) || [{ productId: '', unitOfMeasureId: '', quantity: 1 }]
    }
  });

  const locationType = form.watch('storeId') ? 'store' : 'shop';
  const locationId = form.watch('storeId') || form.watch('shopId');
  const items = form.watch('items');

  // Create a stable location identifier
  const currentLocation = `${locationType}-${locationId}`;

  // Get unique products from storeStockItems
  const getUniqueProducts = (): StoreStockItem[] => {
    const seenProductIds = new Set<string>();
    return storeStockItems.filter((item) => {
      if (!seenProductIds.has(item.product.id)) {
        seenProductIds.add(item.product.id);
        return true;
      }
      return false;
    });
  };

  // Get variants for a specific product
  // const getVariantsForProduct = (productId: string): StoreStockItem['variants'] => {
  //   const productItem = storeStockItems.find(item => item.product.id === productId);
  //   return productItem?.variants || [];
  // };

  // Check if product has variants
  const productHasVariants = (productId: string): boolean => {
    const productItem = storeStockItems.find(item => item.product.id === productId);
    return productItem?.hasVariants || false;
  };

  // Helper function to calculate available quantity in selected unit
  const calculateAvailableQuantity = (
    storeStockItem: any,
    selectedUnitOfMeasureId: string,
    variantId?: string
  ) => {
    if (!storeStockItem || !selectedUnitOfMeasureId) return 0;

    // For variant-based items, get quantity from specific variant
    if (storeStockItem.hasVariants && variantId) {
      const variant = storeStockItem.variants?.find((v: { id: string; }) => v.id === variantId);
      return variant?.quantity || 0;
    }

    const baseQuantity = storeStockItem.quantity;
    const baseConversion = storeStockItem.unitOfMeasure?.conversionFactor || 1;
    const selectedUnit = unitsOfMeasure[storeStockItem.product.id]?.find(
      (unit: IUnitOfMeasure) => unit.id === selectedUnitOfMeasureId
    );

    if (!selectedUnit) return baseQuantity;
    return (baseQuantity * baseConversion) / 1;
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch stores and shops
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storesData, shopsData] = await Promise.all([
          getStores(),
          getShops()
        ]);
        setStores(storesData);
        setShops(shopsData);
      } catch  {
        toast.error('Failed to load stores or shops');
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

          if (Array.isArray(uomData)) {
            setUnitsOfMeasure((prev) => ({ ...prev, [productId]: uomData }));
          } else {
            setUnitsOfMeasure((prev) => ({
              ...prev,
              [productId]: uomData ? [uomData] : []
            }));
          }
        } catch  {
          toast.error('Failed to load units of measure');
          setUnitsOfMeasure((prev) => ({ ...prev, [productId]: [] }));
        } finally {
          setLoadingUOM((prev) => ({ ...prev, [productId]: false }));
        }
      }
    },
    [unitsOfMeasure, loadingUOM]
  );

  // Fetch products from location
  const fetchProductsFromLocation = useCallback(async () => {
    if (!locationId) {
      setStoreStockItems([]);
      hasFetchedProductsRef.current = false;
      lastLocationRef.current = '';
      setInitialSyncDone(false);
      return;
    }

    if (currentLocation === lastLocationRef.current && hasFetchedProductsRef.current) {
      return;
    }

    setLoadingProducts(true);
    hasFetchedProductsRef.current = true;
    lastLocationRef.current = currentLocation;

    try {
      const entityType = locationType === 'store' ? TransferEntityType.STORE : TransferEntityType.SHOP;
      const stockData = await getAvailableProductsBySource(entityType, locationId);
      setStoreStockItems(stockData);
    } catch {
      toast.error('Failed to load products from location');
      setStoreStockItems([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [currentLocation, locationType, locationId]);

  // Debounced fetch effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProductsFromLocation();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [fetchProductsFromLocation]);

  // Sync form items with loaded variants for edit mode
  useEffect(() => {
    if (isEdit && storeStockItems.length > 0 && items.length > 0 && !initialSyncDone) {
      const updatedItems = items.map((item) => {
        if (!item.productId) return item;

        const stockItem = storeStockItems.find(
          (stock) => stock.product.id.toString() === item.productId
        );

        if (stockItem?.hasVariants && item.height && item.width) {
          const matchingVariant = stockItem.variants?.find(
            (v) => 
              Math.abs(v.height - (item.height || 0)) < 0.01 && 
              Math.abs(v.width - (item.width || 0)) < 0.01
          );

          if (matchingVariant && (!item.variantId || item.variantId !== matchingVariant.id)) {
            return {
              ...item,
              variantId: matchingVariant.id
            };
          }
        }
        
        return item;
      });

      const hasChanges = updatedItems.some((item, index) => 
        item.variantId !== items[index].variantId
      );

      if (hasChanges) {
        form.setValue('items', updatedItems);
      }
      
      setInitialSyncDone(true);
    }
  }, [isEdit, storeStockItems, items, form, initialSyncDone]);

  // Load units for initial items
  useEffect(() => {
    if (isEdit && initialData) {
      const loadInitialUnits = async () => {
        for (const item of initialData.items) {
          const productId = item.productId.toString();
          await fetchUnitsOfMeasure(productId);
        }
      };
      loadInitialUnits();
    }
  }, [isEdit, initialData, fetchUnitsOfMeasure]);

  // Clear variant selection when product changes
  const handleProductChange = (index: number, productId: string) => {
    const newItems = [...items];
    newItems[index].productId = productId;
    newItems[index].unitOfMeasureId = '';
    newItems[index].quantity = 1;
    newItems[index].height = undefined;
    newItems[index].width = undefined;
    newItems[index].variantId = undefined;
    form.setValue('items', newItems);

    if (productId) {
      fetchUnitsOfMeasure(productId);
    }
  };

  // Handle variant selection
  const handleVariantChange = (index: number, variant: any) => {
    const newItems = [...items];
    newItems[index].height = variant.height;
    newItems[index].width = variant.width;
    newItems[index].variantId = variant.id;
    newItems[index].quantity = 1;
    form.setValue('items', newItems);
    form.trigger(`items.${index}.quantity`);
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

  const validateForm = (data: FormDataType) => {
    const errors: any = {};

    if (!data.storeId && !data.shopId) {
      errors.storeId = 'Either store or shop must be selected';
    }

    if (!data.items || data.items.length === 0) {
      errors.items = 'At least one item is required';
    } else {
      data.items.forEach((item, index) => {
        if (!item.productId) {
          errors.items = errors.items || {};
          errors.items[index] = errors.items[index] || {};
          errors.items[index].productId = 'Product is required';
        }
        if (!item.unitOfMeasureId) {
          errors.items = errors.items || {};
          errors.items[index] = errors.items[index] || {};
          errors.items[index].unitOfMeasureId = 'Unit of measure is required';
        }

        // Check if variant is required
        const hasVariants = productHasVariants(item.productId);
        if (hasVariants && (!item.height || !item.width || !item.variantId)) {
          errors.items = errors.items || {};
          errors.items[index] = errors.items[index] || {};
          errors.items[index].variantId = 'Variant selection is required';
        }

        if (item.quantity === '' || item.quantity === null || item.quantity === undefined) {
          errors.items = errors.items || {};
          errors.items[index] = errors.items[index] || {};
          errors.items[index].quantity = 'Quantity is required';
        } else if (typeof item.quantity === 'string') {
          const num = parseFloat(item.quantity);
          if (isNaN(num)) {
            errors.items = errors.items || {};
            errors.items[index] = errors.items[index] || {};
            errors.items[index].quantity = 'Quantity must be a valid number';
          }
        }
      });
    }

    return errors;
  };

  const onSubmit = async (data: FormDataType) => {
    const errors = validateForm(data);
    
    if (Object.keys(errors).length > 0) {
      Object.keys(errors).forEach((key) => {
        if (key === 'items') {
          Object.keys(errors.items).forEach((itemIndex) => {
            Object.keys(errors.items[itemIndex]).forEach((field) => {
              form.setError(`items.${itemIndex}.${field}` as any, {
                type: 'manual',
                message: errors.items[itemIndex][field]
              });
            });
          });
        } else {
          form.setError(key as any, {
            type: 'manual',
            message: errors[key]
          });
        }
      });
      return;
    }

    setIsLoading(true);
    try {
      const validItems = data.items.filter((item) => {
        if (!item.productId || !item.unitOfMeasureId) return false;
        
        const hasVariants = productHasVariants(item.productId);
        if (hasVariants && (!item.height || !item.width || !item.variantId)) {
          return false;
        }
        
        const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
        return quantity !== 0;
      });

      if (validItems.length === 0) {
        toast.error('Please add at least one valid item with non-zero quantity');
        setIsLoading(false);
        return;
      }

      const payload = {
        ...data,
        items: validItems.map((item) => ({
          productId: item.productId.toString(),
          unitOfMeasureId: item.unitOfMeasureId,
          quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
          ...(item.height && { height: Number(item.height) }),
          ...(item.width && { width: Number(item.width) }),
          ...(item.variantId && { variantId: item.variantId })
        }))
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

  if (!isMounted) {
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
                name='storeId'
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Store (Optional)</FormLabel>
                    <ShadcnSelect
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value) {
                          form.setValue('shopId', '');
                        }
                        form.setValue('items', [
                          {
                            productId: '',
                            unitOfMeasureId: '',
                            quantity: 1
                          }
                        ]);
                        setStoreStockItems([]);
                        setUnitsOfMeasure({});
                        setInitialSyncDone(false);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select store' />
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
                name='shopId'
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Shop (Optional)</FormLabel>
                    <ShadcnSelect
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value) {
                          form.setValue('storeId', '');
                        }
                        form.setValue('items', [
                          {
                            productId: '',
                            unitOfMeasureId: '',
                            quantity: 1
                          }
                        ]);
                        setStoreStockItems([]);
                        setUnitsOfMeasure({});
                        setInitialSyncDone(false);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select shop' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {shops.map((shop) => (
                          <SelectItem key={shop.id} value={shop.id.toString()}>
                            {shop.name}
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
                        <SelectItem value='PURCHASE_ERROR'>
                          Purchase Error
                        </SelectItem>
                        <SelectItem value='TRANSFER_ERROR'>
                          Transfer Error
                        </SelectItem>
                        <SelectItem value='EXPIRED'>Expired</SelectItem>
                        <SelectItem value='DAMAGED'>Damaged</SelectItem>
                        <SelectItem value='MANUAL_ADJUSTMENT'>
                          Manual Adjustment
                        </SelectItem>
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

            <FormField
              control={form.control}
              name='items'
              render={({ field, fieldState }) => {
                const itemsError = fieldState.error as any;
                
                return (
                  <FormItem>
                    <FormLabel>Items</FormLabel>
                    <FormControl>
                      <div className='space-y-4'>
                        <div className='grid grid-cols-7 gap-4 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                          <div className='col-span-2'>Product</div>
                          <div>Unit</div>
                          <div>Dimensions</div>
                          <div>Quantity</div>
                          <div>Available</div>
                          <div>Action</div>
                        </div>

                        {field.value.map((item, index) => {
                          const storeStockItem = storeStockItems.find(
                            (stock) => stock.product.id.toString() === item.productId
                          );

                          const hasVariants = storeStockItem?.hasVariants || false;
                          const variants = storeStockItem?.variants || [];
                          
                          const availableInSelectedUnit = hasVariants && item.variantId
                            ? variants.find(v => v.id === item.variantId)?.quantity || 0
                            : storeStockItem && item.unitOfMeasureId
                              ? calculateAvailableQuantity(
                                  storeStockItem,
                                  item.unitOfMeasureId
                                )
                              : storeStockItem?.quantity || 0;

                          const uniqueProducts = getUniqueProducts();
                          const productOptions = uniqueProducts.map((storeStockItem) => ({
                            value: storeStockItem.product.id.toString(),
                            label: formatProductLabel(storeStockItem.product),
                            data: storeStockItem
                          }));

                          const variantOptions = variants.map((variant) => ({
                            value: variant.id,
                            label: formatVariantLabel(variant),
                            data: variant
                          }));

                          // Find selected variant value
                          let selectedVariantValue = null;
                          if (item.variantId) {
                            selectedVariantValue = variantOptions.find(
                              (v) => v.value === item.variantId
                            );
                          } else if (item.height && item.width && !item.variantId) {
                            selectedVariantValue = variantOptions.find(
                              (v) => 
                                Math.abs(v.data.height - (item.height || 0)) < 0.01 && 
                                Math.abs(v.data.width - (item.width || 0)) < 0.01
                            );
                          }

                          const itemError = itemsError?.[index];

                          return (
                            <div
                              key={index}
                              className='grid grid-cols-7 items-center gap-4'
                            >
                              {/* Product Select */}
                              <div className='col-span-2'>
                                <Select
                                  instanceId={`product-select-${index}`}
                                  options={productOptions}
                                  onChange={(newValue: any) => {
                                    handleProductChange(index, newValue?.value || '');
                                  }}
                                  value={
                                    productOptions.find(
                                      (p) => p.value === item.productId
                                    ) || null
                                  }
                                  placeholder={
                                    loadingProducts
                                      ? 'Loading products...'
                                      : 'Search product'
                                  }
                                  isSearchable
                                  isDisabled={loadingProducts}
                                  styles={isDark ? darkStyles : {}}
                                />
                                {itemError?.productId && (
                                  <p className='text-sm font-medium text-destructive mt-1'>
                                    {itemError.productId.message}
                                  </p>
                                )}
                              </div>

                              {/* Unit Select */}
                              <div>
                                <Select
                                  instanceId={`unit-select-${index}`}
                                  options={
                                    unitsOfMeasure[item.productId]?.map(
                                      (unit) => ({
                                        value: unit.id.toString(),
                                        label: `${unit.name}`
                                      })
                                    ) || []
                                  }
                                  onChange={(newValue) => {
                                    const newItems = [...field.value];
                                    newItems[index].unitOfMeasureId =
                                      newValue?.value || '';
                                    field.onChange(newItems);
                                  }}
                                  value={
                                    unitsOfMeasure[item.productId]
                                      ?.map((u) => ({
                                        value: u.id.toString(),
                                        label: `${u.name} `
                                      }))
                                      .find(
                                        (u) => u.value === item.unitOfMeasureId
                                      ) ||
                                    (item.unitOfMeasureId
                                      ? {
                                          value: item.unitOfMeasureId,
                                          label: 'Loading...'
                                        }
                                      : null)
                                  }
                                  placeholder='Search unit'
                                  isSearchable
                                  isDisabled={!item.productId}
                                  styles={isDark ? darkStyles : {}}
                                />
                                {itemError?.unitOfMeasureId && (
                                  <p className='text-sm font-medium text-destructive mt-1'>
                                    {itemError.unitOfMeasureId.message}
                                  </p>
                                )}
                              </div>

                              {/* Variant/Dimensions Select */}
                              <div>
                                {hasVariants ? (
                                  <Select
                                    instanceId={`variant-select-${index}`}
                                    options={variantOptions}
                                    onChange={(newValue: any) => {
                                      handleVariantChange(index, newValue?.data);
                                    }}
                                    value={selectedVariantValue}
                                    placeholder={'Select dimensions'}
                                    isSearchable
                                    isDisabled={loadingProducts || !item.productId}
                                    isLoading={loadingProducts}
                                    styles={isDark ? darkStyles : {}}
                                  />
                                ) : (
                                  <div className='text-muted-foreground text-sm'>
                                    {item.productId ? 'Standard item' : '—'}
                                  </div>
                                )}
                                {itemError?.variantId && (
                                  <p className='text-sm font-medium text-destructive mt-1'>
                                    {itemError.variantId.message}
                                  </p>
                                )}
                              </div>

                              {/* Quantity Input */}
                              <div>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.quantity`}
                                  render={({ field: quantityField, fieldState: quantityFieldState }) => (
                                    <div>
                                      <Input
                                        type='text'
                                        inputMode='decimal'
                                        placeholder='Qty'
                                        value={quantityField.value.toString()}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          const validPattern = /^-?\d*\.?\d*$/;
                                          
                                          if (validPattern.test(value)) {
                                            quantityField.onChange(value);
                                          }
                                        }}
                                        onBlur={(e) => {
                                          const value = e.target.value;
                                          if (value === '' || value === '-' || value === '.') {
                                            quantityField.onChange('0');
                                          } else if (value.endsWith('.')) {
                                            quantityField.onChange(value.slice(0, -1));
                                          }
                                        }}
                                        disabled={loadingProducts || (hasVariants && !item.variantId)}
                                      />
                                      <div className='mt-1 text-xs text-gray-500'>
                                        {(() => {
                                          const numValue = parseFloat(quantityField.value.toString());
                                          if (isNaN(numValue)) {
                                            return 'Enter valid number';
                                          }
                                          return numValue < 0 ? 'Subtraction' : numValue > 0 ? 'Addition' : 'Zero adjustment';
                                        })()}
                                      </div>
                                      {quantityFieldState.error && (
                                        <p className='text-sm font-medium text-destructive mt-1'>
                                          {quantityFieldState.error.message}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                />
                              </div>

                              {/* Available Quantity */}
                              <div className='text-muted-foreground text-sm'>
                                {loadingProducts ? (
                                  <div className='flex items-center gap-1'>
                                    <div className='h-3 w-3 animate-spin rounded-full border-b-2 border-gray-400'></div>
                                    <span>Loading...</span>
                                  </div>
                                ) : availableInSelectedUnit > 0 ? (
                                  `${Math.floor(availableInSelectedUnit)} available`
                                ) : hasVariants && item.productId && !item.variantId ? (
                                  'Select variant'
                                ) : (
                                  'Out of stock'
                                )}
                              </div>

                              {/* Delete Button */}
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
                                {
                                  productId: '',
                                  unitOfMeasureId: '',
                                  quantity: 1
                                }
                              ]);
                            }}
                            disabled={loadingProducts}
                          >
                            Add Item
                          </Button>
                        </div>
                      </div>
                    </FormControl>
                    {fieldState.error && typeof fieldState.error === 'object' && 'message' in fieldState.error && (
                      <p className='text-sm font-medium text-destructive'>
                        {fieldState.error.message as string}
                      </p>
                    )}
                  </FormItem>
                );
              }}
            />

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
              <Button type='submit' disabled={isLoading || loadingProducts}>
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