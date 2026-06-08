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
import { useForm, useFieldArray } from 'react-hook-form';
import { createProduct, updateProduct } from '@/service/Product';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { IProduct } from '@/models/Product';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { IUnitOfMeasure } from '@/models/UnitOfMeasure';
import Select from 'react-select';
import { Modal } from '@/components/ui/modal';
import { getUnitsOfMeasure } from '@/service/UnitOfMeasure';
import UnitOfMeasureForm from '../UnitOfMeasure/form';
import { RefreshCw, Plus, Trash2, Ruler } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { IShop } from '@/models/shop';
import { IColour } from '@/models/Category';
import { ICurtainType } from '@/models/curtainType';
import { getCategoryById } from '@/service/Category';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ProductFormValues {
  productCode: string;
  name: string;
  description?: string;
  
  // Curtain-specific fields
  fabricName?: string;
  thickCurtain?: boolean;
  thinCurtain?: boolean;
  pullsCurtain?: boolean;
  poleCurtain?: boolean;
  bracketsCurtain?: boolean;
  shatterVertical?: boolean;
  // Relationships
  categoryId: string;
  colourId?: string | null;
  unitOfMeasureId: string;
  
  // Pricing
  sellPrice?: number;
  pricePerMeter: boolean;
  warningQuantity?: number;
  
  // Media
  imageUrl: string;
  
  // Status
  isActive: boolean;
  
  // Additional prices
  additionalPrices: {
    label: string;
    price: number;
    shopId?: string;
  }[];
}

interface SelectOption {
  value: string;
  label: string;
}

interface ProductFormProps {
  initialData: IProduct | null;
  pageTitle: string;
  categories?: { id: string; name: string }[];
  unitsOfMeasure?: IUnitOfMeasure[];
  shops?: IShop[];
  colours?: IColour[];
  curtainTypes?: ICurtainType[];
}

export default function ProductForm({
  initialData,
  pageTitle,
  categories = [],
  unitsOfMeasure: initialUnits = [],
  shops: initialShops = [],
  colours: initialColours = [],
  curtainTypes: initialCurtainTypes = []
}: ProductFormProps) {
  const router = useRouter();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isRefreshingUnits, setIsRefreshingUnits] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<IUnitOfMeasure[]>(
    initialUnits || []
  );
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isCurtainCategory, setIsCurtainCategory] = useState(false);
  const [showAdditionalPrices, setShowAdditionalPrices] = useState(false);

  // Use data directly from props
  const shops = initialShops;
  const colours = initialColours;
  const curtainTypes = initialCurtainTypes;

  const defaultValues = useMemo<ProductFormValues>(
    () => ({
      productCode: initialData?.productCode || '',
      name: initialData?.name || '',
      description: initialData?.description || '',
      
      // Curtain-specific fields
      fabricName: initialData?.fabricName || '',
      thickCurtain: initialData?.thickCurtain || false,
      thinCurtain: initialData?.thinCurtain || false,
      pullsCurtain: initialData?.pullsCurtain || false,
      poleCurtain: initialData?.poleCurtain || false,
      bracketsCurtain: initialData?.bracketsCurtain || false,
      shatterVertical: initialData?.shatterVertical || false,

      // Relationships
      categoryId: initialData?.categoryId || '',
      colourId: initialData?.colourId || null,
      unitOfMeasureId: initialData?.unitOfMeasureId || '',
      
      // Pricing
      sellPrice: initialData?.sellPrice || undefined,
      pricePerMeter: initialData?.pricePerMeter ?? true,
      warningQuantity: initialData?.warningQuantity || 0,
      
      // Media
      imageUrl: initialData?.imageUrl || '',
      
      // Status
      isActive: initialData?.isActive ?? true,
      
      // Additional prices - start empty array
      additionalPrices: initialData?.additionalPrices?.map((price, index) => ({
        label: price.label || `Label ${index + 1}`,
        price: price.price,
        shopId: price.shopId || ''
      })) || []
    }),
    [initialData]
  );

  const form = useForm<ProductFormValues>({
    defaultValues
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'additionalPrices'
  });

  // Check if there are existing additional prices to show the section
  useEffect(() => {
    if (defaultValues.additionalPrices && defaultValues.additionalPrices.length > 0) {
      setShowAdditionalPrices(true);
    }
  }, [defaultValues.additionalPrices]);

  // Check if selected category is a curtain category
  useEffect(() => {
    const checkCurtainCategory = async () => {
      const categoryId = form.watch('categoryId');
      if (categoryId) {
        try {
          const category = await getCategoryById(categoryId);
          setIsCurtainCategory(category?.name?.toLowerCase().includes('curtain') || false);
          setSelectedCategory(categoryId);
        } catch {
          setIsCurtainCategory(false);
        }
      } else {
        setIsCurtainCategory(false);
        setSelectedCategory('');
      }
    };
    
    checkCurtainCategory();
    
    // Subscribe to categoryId changes
    const subscription = form.watch((value, { name }) => {
      if (name === 'categoryId') {
        checkCurtainCategory();
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Handle image preview
  useEffect(() => {
    if (initialData?.imageUrl) {
      setPreviewImage(initialData.imageUrl);
    } else {
      setPreviewImage(null);
    }
  }, [initialData]);

  const unitOptions: SelectOption[] = useMemo(
    () =>
      (unitsOfMeasure || []).map((unit) => ({
        value: unit.id,
        label: `${unit.name}${unit.symbol ? ` (${unit.symbol})` : ''}`
      })),
    [unitsOfMeasure]
  );

  const shopOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: 'No Shop (Global Price)' },
      ...(shops || []).map((shop) => ({
        value: shop.id,
        label: shop.name
      }))
    ],
    [shops]
  );

  const categoryOptions: SelectOption[] = useMemo(
    () => (categories || []).map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );

  const colourOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: 'None' },
      ...(colours || []).map((colour) => ({
        value: colour.id,
        label: colour.name
      }))
    ],
    [colours]
  );

  const curtainTypeOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: 'None' },
      ...(curtainTypes || []).map((type) => ({
        value: type.id,
        label: type.name
      }))
    ],
    [curtainTypes]
  );

  const refetchUnits = async () => {
    try {
      setIsRefreshingUnits(true);
      const data = await getUnitsOfMeasure();
      setUnitsOfMeasure(data || []);
      toast.success('Units of measure refreshed');
    } catch {
      toast.error('Failed to refresh units');
    } finally {
      setIsRefreshingUnits(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      form.setValue('imageUrl', file.name);
    } else {
      if (initialData?.imageUrl) {
        setPreviewImage(initialData.imageUrl);
      }
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const formData = new FormData();

      // Process boolean values
      const processedData = {
        ...data,
        isActive: Boolean(data.isActive),
        thickCurtain: data.thickCurtain ? Boolean(data.thickCurtain) : false,
        thinCurtain: data.thinCurtain ? Boolean(data.thinCurtain) : false,
        pullsCurtain: data.pullsCurtain ? Boolean(data.pullsCurtain) : false,
        poleCurtain: data.poleCurtain ? Boolean(data.poleCurtain) : false,
        bracketsCurtain: data.bracketsCurtain ? Boolean(data.bracketsCurtain) : false,
        shatterVertical: data.shatterVertical ? Boolean(data.shatterVertical) : false,
        pricePerMeter: Boolean(data.pricePerMeter),
        colourId: data.colourId || null,
        warningQuantity: data.warningQuantity || 0
      };

      const { additionalPrices, ...formValues } = processedData;

      // Filter out additional prices where price is zero or falsy (0, null, undefined, empty string)
      const filteredAdditionalPrices = additionalPrices.filter(price => {
        // Check if price exists and is not zero
        const priceValue = parseFloat(price.price as any);
        return !isNaN(priceValue) && priceValue !== 0;
      });

      // Append main product data
      Object.entries(formValues).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'boolean') {
            formData.append(key, value.toString());
          } else if (typeof value === 'number') {
            formData.append(key, value.toString());
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Append filtered additional prices (skip zero price entries)
      filteredAdditionalPrices.forEach((price, index) => {
        formData.append(`additionalPrices[${index}][label]`, price.label);
        formData.append(
          `additionalPrices[${index}][price]`,
          price.price.toString()
        );
        if (price.shopId) {
          formData.append(`additionalPrices[${index}][shopId]`, price.shopId);
        }
      });

      const imageInput = document.getElementById('image') as HTMLInputElement;
      if (imageInput?.files?.[0]) {
        formData.append('image', imageInput.files[0]);
      }

      setIsUploading(true);

      if (initialData?.id) {
        await updateProduct(initialData.id, formData);
        toast.success('Product updated successfully');
        router.push(`/dashboard/Products`);
      } else {
        const createdProduct = await createProduct(formData);
        toast.success('Product created successfully');
        router.push(
          `/dashboard/Products/ProductBatch?id=${createdProduct.product.id}`
        );
      }
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || 'Error saving product');
    } finally {
      setIsUploading(false);
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

  const addAdditionalPrice = () => {
    const newIndex = fields.length + 1;
    append({
      label: `Price ${newIndex}`,
      price: 0,
      shopId: ''
    });
  };

  const toggleAdditionalPrices = () => {
    if (!showAdditionalPrices) {
      setShowAdditionalPrices(true);
      if (fields.length === 0) {
        append({ label: 'Price 1', price: 0, shopId: '' });
      }
    } else {
      setShowAdditionalPrices(false);
      // Remove all additional prices when hiding
      while (fields.length > 0) {
        remove(0);
      }
    }
  };

  const removeAllAdditionalPrices = () => {
    while (fields.length > 0) {
      remove(0);
    }
    toast.success('All additional prices removed');
  };

  return (
    <>
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle>{pageTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                {/* Left Column */}
                <div className='space-y-4'>
                  <FormField
                    name='productCode'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Code</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g., PRD001' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name='name'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g., Velvet Curtain' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Curtain-specific fields - only show if curtain category */}
                  {isCurtainCategory && (
                    <>
                      <FormField
                        name='fabricName'
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='flex items-center gap-2'>
                              <Ruler className='h-4 w-4' />
                              Fabric Name (Optional)
                            </FormLabel>
                            <FormControl>
                              <Input placeholder='e.g., Velvet, Linen, Silk' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className='flex flex-col gap-4 rounded-lg border p-4'>
                        <div className='flex items-center gap-2'>
                          <Ruler className='h-4 w-4' />
                          <FormLabel>Curtain Type (Optional)</FormLabel>
                        </div>

                        <RadioGroup
                          value={(() => {
                            if (form.watch('thickCurtain')) return 'thick';
                            if (form.watch('thinCurtain')) return 'thin';
                            if (form.watch('pullsCurtain')) return 'belt';
                            if (form.watch('poleCurtain')) return 'rod';
                            if (form.watch('bracketsCurtain')) return 'holder';
                            if (form.watch('shatterVertical')) return 'shutter';
                            return '';
                          })()}
                          onValueChange={(value) => {
                            form.setValue('thickCurtain', false);
                            form.setValue('thinCurtain', false);
                            form.setValue('pullsCurtain', false);
                            form.setValue('poleCurtain', false);
                            form.setValue('bracketsCurtain', false);
                            form.setValue('shatterVertical', false);
                            
                            switch (value) {
                              case 'thick':
                                form.setValue('thickCurtain', true);
                                break;
                              case 'thin':
                                form.setValue('thinCurtain', true);
                                break;
                              case 'belt':
                                form.setValue('pullsCurtain', true);
                                break;
                              case 'rod':
                                form.setValue('poleCurtain', true);
                                break;
                              case 'holder':
                                form.setValue('bracketsCurtain', true);
                                break;
                              case 'shutter':
                                form.setValue('shatterVertical', true);
                                break;
                            }
                          }}
                          className='grid grid-cols-2 gap-4'
                        >
                          <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                            <FormControl>
                              <RadioGroupItem value='thick' />
                            </FormControl>
                            <div className='space-y-1 leading-none'>
                              <FormLabel>Thick Curtain</FormLabel>
                              <div className='text-muted-foreground text-sm'>
                                Heavy, insulated curtains
                              </div>
                            </div>
                          </FormItem>

                          <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                            <FormControl>
                              <RadioGroupItem value='thin' />
                            </FormControl>
                            <div className='space-y-1 leading-none'>
                              <FormLabel>Thin Curtain</FormLabel>
                              <div className='text-muted-foreground text-sm'>
                                Light, sheer curtains
                              </div>
                            </div>
                          </FormItem>

                          <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                            <FormControl>
                              <RadioGroupItem value='belt' />
                            </FormControl>
                            <div className='space-y-1 leading-none'>
                              <FormLabel>Belt Curtain</FormLabel>
                              <div className='text-muted-foreground text-sm'>
                                Curtain operated using a belt-driven mechanism
                              </div>
                            </div>
                          </FormItem>

                          <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                            <FormControl>
                              <RadioGroupItem value='rod' />
                            </FormControl>
                            <div className='space-y-1 leading-none'>
                              <FormLabel>Curtain Rod</FormLabel>
                              <div className='text-muted-foreground text-sm'>
                                Curtain mounted on a rod system
                              </div>
                            </div>
                          </FormItem>

                          <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                            <FormControl>
                              <RadioGroupItem value='holder' />
                            </FormControl>
                            <div className='space-y-1 leading-none'>
                              <FormLabel>Holder Curtain</FormLabel>
                              <div className='text-muted-foreground text-sm'>
                                Curtain supported using holders
                              </div>
                            </div>
                          </FormItem>

                          <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                            <FormControl>
                              <RadioGroupItem value='shutter' />
                            </FormControl>
                            <div className='space-y-1 leading-none'>
                              <FormLabel>Shutter or Vertical</FormLabel>
                              <div className='text-muted-foreground text-sm'>
                                Vertical or shutter-style curtain system
                              </div>
                            </div>
                          </FormItem>
                        </RadioGroup>
                      </div>
                    </>
                  )}
                  
                  <FormField
                    name='description'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='Product description...'
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    name='sellPrice'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Standard Sell Price (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.01'
                            min='0'
                            placeholder='Enter sell price'
                            value={field.value === undefined || field.value === null ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                value === '' ? undefined : parseFloat(value)
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    name='warningQuantity'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warning Quantity (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min='0'
                            placeholder='Enter warning quantity'
                            value={field.value || 0}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === '' ? 0 : parseInt(value));
                            }}
                          />
                        </FormControl>
                        <div className='text-muted-foreground text-sm'>
                          Low stock warning threshold (0 = disabled)
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Right Column */}
                <div className='space-y-4'>
                  <FormField
                    name='categoryId'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <FormControl>
                          <Select
                            options={categoryOptions}
                            onChange={(option) => field.onChange(option?.value)}
                            value={
                              categoryOptions.find(
                                (c) => c.value === field.value
                              ) || null
                            }
                            placeholder='Select a category'
                            styles={isDark ? darkStyles : {}}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    name='unitOfMeasureId'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='flex items-center justify-between'>
                          <span>Unit of Measure *</span>
                          <div className='flex gap-2'>
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={refetchUnits}
                              disabled={isRefreshingUnits}
                              className='h-8 w-8 p-0'
                              title='Refresh units'
                            >
                              <RefreshCw
                                className={`h-4 w-4 ${isRefreshingUnits ? 'animate-spin' : ''}`}
                              />
                            </Button>
                            <Button
                              type='button'
                              variant='link'
                              size='sm'
                              onClick={() => setIsUnitModalOpen(true)}
                            >
                              + Add New
                            </Button>
                          </div>
                        </FormLabel>
                        <FormControl>
                          <Select
                            options={unitOptions}
                            value={
                              unitOptions.find(
                                (option) => option.value === field.value
                              ) || null
                            }
                            onChange={(selectedOption) => {
                              field.onChange(selectedOption?.value || '');
                            }}
                            onBlur={field.onBlur}
                            placeholder='Search or select a unit...'
                            isSearchable
                            isClearable
                            className='react-select-container'
                            classNamePrefix='react-select'
                            styles={isDark ? darkStyles : {}}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    name='colourId'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Colour (Optional)</FormLabel>
                        <FormControl>
                          <Select
                            options={colourOptions}
                            onChange={(option) => 
                              field.onChange(option?.value || null)
                            }
                            value={
                              field.value
                                ? colourOptions.find(
                                    (c) => c.value === field.value
                                  ) || null
                                : colourOptions[0]
                            }
                            placeholder='Select a colour'
                            styles={isDark ? darkStyles : {}}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Price Per Meter Switch */}
                  <FormField
                    control={form.control}
                    name='pricePerMeter'
                    render={({ field }) => (
                      <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                        <div className='space-y-0.5'>
                          <FormLabel>Pricing Method</FormLabel>
                          <div className='text-muted-foreground text-sm'>
                            {field.value
                              ? 'Priced per meter/unit'
                              : 'Fixed price per item'}
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Active Status Switch */}
                  <FormField
                    control={form.control}
                    name='isActive'
                    render={({ field }) => (
                      <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                        <div className='space-y-0.5'>
                          <FormLabel>Product Status</FormLabel>
                          <div className='text-muted-foreground text-sm'>
                            {field.value
                              ? 'Product is active and visible'
                              : 'Product is inactive and hidden'}
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Image Upload Section */}
                  <FormItem>
                    <FormLabel>Product Image</FormLabel>
                    <div className='flex flex-col gap-4'>
                      {previewImage && (
                        <div className='relative h-48 w-full overflow-hidden rounded-md border'>
                          <Image
                            src={previewImage}
                            alt='Product preview'
                            fill
                            className='object-contain'
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <Input
                        id='image'
                        type='file'
                        accept='image/*'
                        onChange={handleImageChange}
                      />
                      {initialData?.imageUrl && !previewImage && (
                        <p className='text-muted-foreground text-sm'>
                          Current image: {initialData.imageUrl}
                        </p>
                      )}
                    </div>
                    <FormMessage>
                      {form.formState.errors.imageUrl?.message}
                    </FormMessage>
                  </FormItem>
                </div>
              </div>

              {/* Additional Prices Section - Hidden by default */}
              <div className='border-t pt-6'>
                <div className='flex gap-2 mb-4'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={toggleAdditionalPrices}
                  >
                    {showAdditionalPrices ? 'Hide Additional Prices' : 'Show Additional Prices'}
                  </Button>
                  
                  {showAdditionalPrices && fields.length > 0 && (
                    <Button
                      type='button'
                      variant='destructive'
                      onClick={removeAllAdditionalPrices}
                    >
                      <Trash2 className='h-4 w-4 mr-2' />
                      Remove All
                    </Button>
                  )}
                </div>

                {showAdditionalPrices && (
                  <>
                    <div className='mb-4 flex items-center justify-between'>
                      <CardTitle className='text-lg'>Additional Prices</CardTitle>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={addAdditionalPrice}
                        className='flex items-center gap-2'
                      >
                        <Plus className='h-4 w-4' />
                        Add Price
                      </Button>
                    </div>

                    {fields.length === 0 ? (
                      <div className='text-center py-8 text-muted-foreground'>
                        No additional prices added. Click &quot;Add Price&quot; to create one.
                      </div>
                    ) : (
                      <div className='space-y-4'>
                        {fields.map((field, index) => (
                          <div
                            key={field.id}
                            className='grid grid-cols-1 items-end gap-4 rounded-lg border p-4 md:grid-cols-12'
                          >
                            {/* Label Input */}
                            <div className='md:col-span-3'>
                              <FormField
                                control={form.control}
                                name={`additionalPrices.${index}.label`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Price Label</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder='e.g., Wholesale, Retail, Member'
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Price Input */}
                            <div className='md:col-span-3'>
                              <FormField
                                control={form.control}
                                name={`additionalPrices.${index}.price`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Price Amount</FormLabel>
                                    <FormControl>
                                      <Input
                                        type='number'
                                        step='0.01'
                                        min='0'
                                        placeholder='0.00'
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Shop Select */}
                            <div className='md:col-span-4'>
                              <FormField
                                control={form.control}
                                name={`additionalPrices.${index}.shopId`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Shop (Optional)</FormLabel>
                                    <FormControl>
                                      <Select
                                        options={shopOptions}
                                        value={
                                          shopOptions.find(
                                            (option) => option.value === field.value
                                          ) || shopOptions[0]
                                        }
                                        onChange={(selectedOption) => {
                                          field.onChange(selectedOption?.value || '');
                                        }}
                                        placeholder='Select shop...'
                                        styles={isDark ? darkStyles : {}}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Remove Button */}
                            <div className='md:col-span-2'>
                              <Button
                                type='button'
                                variant='destructive'
                                size='sm'
                                onClick={() => remove(index)}
                                className='w-full'
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className='flex justify-end'>
                <Button
                  type='submit'
                  className='w-full md:w-auto'
                  disabled={isUploading}
                >
                  {isUploading
                    ? 'Uploading...'
                    : initialData
                      ? 'Update Product'
                      : 'Create Product'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Modal
        title='Add Unit of Measure'
        description='Create a new unit of measure'
        isOpen={isUnitModalOpen}
        onClose={() => {
          setIsUnitModalOpen(false);
          refetchUnits();
        }}
        size='md'
      >
        <UnitOfMeasureForm
          initialData={null}
          closeModal={() => setIsUnitModalOpen(false)}
        />
      </Modal>
    </>
  );
}