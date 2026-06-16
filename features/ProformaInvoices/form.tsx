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
import { createProformaInvoice, updateProformaInvoice } from '@/service/ProformaInvoice';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { IProformaInvoice, IProformaInvoiceItem, IProformaItemMaterial } from '@/models/ProformaInvoice';
import { Textarea } from '@/components/ui/textarea';
import Select from 'react-select';
import { ArrowLeft, Plus, Trash2, Upload, Download, Image as ImageIcon, Package, Eye, RefreshCw, X } from 'lucide-react';
import { getCustomer } from '@/service/customer';
import { getMaterials } from '@/service/material';
import { getAllItemsimple } from '@/service/item';
import { normalizeImagePath } from '@/lib/norm';
import MaterialModal from '../material/modal';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { getCategories, getSizes, getTypes } from '@/service/productConfiguration';
import { IProductCategory, IProductType, ISize } from '@/models/productConfiguration';
import { Modal } from '@/components/ui/modal';
import CreateCustomerModal from './customer';
import { IconPlus } from '@tabler/icons-react';
import { CustomerSelect } from './customermodal';

interface ProformaInvoiceFormValues {
  customerId: string;
  subtotal: number;
  vat: number;
  vatPercent: number | null;
  vatApplied: boolean;
  total: number;
  amountDate?: Date | string;
  items: IProformaInvoiceItem[];
  attachments?: File[];
  store?: boolean;
}

interface SelectOption {
  value: string;
  label: string;
}

interface ProformaInvoiceFormProps {
  initialData: IProformaInvoice | null;
  pageTitle: string;
}

// Type for the hierarchical selection state
interface HierarchicalSelection {
  categoryId: string;
  sizeId: string;
  typeId: string;
  selectedItem: any | null;
}

export default function ProformaInvoiceForm({
  initialData,
  pageTitle
}: ProformaInvoiceFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [itemImages, setItemImages] = useState<Map<number, ImageFileWithPreview[]>>(new Map());
  const [isFetchingItems, setIsFetchingItems] = useState(false);
  const [priceAutoFilled, setPriceAutoFilled] = useState<Map<number, boolean>>(new Map());
  const [isStore, setIsStore] = useState<boolean>(initialData?.store || false);
  const [selectedItemIds, setSelectedItemIds] = useState<Map<number, string>>(new Map());

  // Hierarchical data states - use objects/maps for per-row filtering
  const [categories, setCategories] = useState<IProductCategory[]>([]);
  const [sizes, setSizes] = useState<ISize[]>([]);
  const [types, setTypes] = useState<IProductType[]>([]);
  const [filteredSizes, setFilteredSizes] = useState<Map<number, ISize[]>>(new Map());
  const [filteredTypes, setFilteredTypes] = useState<Map<number, IProductType[]>>(new Map());
  const [filteredItems, setFilteredItems] = useState<Map<number, any[]>>(new Map());
    const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Track hierarchical selection per item row
  const [hierarchicalSelections, setHierarchicalSelections] = useState<Map<number, HierarchicalSelection>>(new Map());
  
  const defaultValues = useMemo<ProformaInvoiceFormValues>(
    () => ({
      customerId: initialData?.customerId || '',
      subtotal: initialData?.subtotal || 0,
      vat: initialData?.vat || 0,
      vatPercent: 15,
      vatApplied: initialData?.vat ? true : false,
      total: initialData?.total || 0,
      amountDate: initialData?.amountDate || new Date(),
      store: initialData?.store || false,
      items: initialData?.items?.map((item) => ({
        ...item,
        itemId: item.itemId || '',
        size: item.size || '',
        additionalDescription: item.additionalDescription || '',
        materials: item.proformaItemMaterials?.map((material) => ({
          ...material,
          materialId: material.materialId,
          quantity: material.quantity,
          note: material.note || '',
        })) || [],
        images: item.images || []
      })) || [
        {
          id: '',
          invoiceId: '',
          itemId: '',
          description: '',
          size: '',
          quantity: 1,
          unitPrice: 0,
          amount: 0,
          additionalDescription: '',
          materials: [],
          images: []
        }
      ],
      attachments: []
    }),
    [initialData]
  );

  const form = useForm<ProformaInvoiceFormValues>({
    defaultValues
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: 'items'
  });

  interface ImageFileWithPreview {
    file?: File;
    preview: string;
    isExisting?: boolean;
    existingUrl?: string;
  }

  // Initialize item images from initial data
  useEffect(() => {
    if (initialData?.items) {
      const newImagesMap = new Map<number, ImageFileWithPreview[]>();
      
      initialData.items.forEach((item, index) => {
        if (item.images && item.images.length > 0) {
          const images: ImageFileWithPreview[] = item.images.map(img => ({
            preview: normalizeImagePath(img.imageUrl) || img.imageUrl,
            isExisting: true,
            existingUrl: img.imageUrl
          }));
          newImagesMap.set(index, images);
        }
        
        // Store itemId if exists
        if (item.itemId) {
          setSelectedItemIds(prev => {
            const newMap = new Map(prev);
            newMap.set(index, item.itemId!);
            return newMap;
          });
        }
      });
      
      setItemImages(newImagesMap);
    }
  }, [initialData]);

  // Fetch customers, materials, items, categories, sizes, types on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersData, materialsData, categoriesData, sizesData, typesData, itemsData] = await Promise.all([
          getCustomer(),
          getMaterials(),
          getCategories(),
          getSizes(),
          getTypes(),
          getAllItemsimple()
        ]);
        setCustomers(customersData || []);
        setMaterials(materialsData || []);
        setCategories(categoriesData || []);
        setSizes(sizesData || []);
        setTypes(typesData || []);
        setItems(itemsData || []);
      } catch {
        toast.error('Failed to fetch data');
      }
    };
    fetchData();
  }, []);

  const fetchItems = async () => {
    try {
      setIsFetchingItems(true);
      const itemsData = await getAllItemsimple();
      setItems(itemsData || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      toast.error('Failed to fetch items');
    } finally {
      setIsFetchingItems(false);
    }
  };

  const refreshItems = async () => {
    await fetchItems();
    toast.success('Items refreshed');
  };

  const refreshMaterials = async () => {
    try {
      const materialsData = await getMaterials();
      setMaterials(materialsData || []);
      toast.success('Materials refreshed');
    } catch {
      toast.error('Failed to refresh materials');
    }
  };

  // Customer options
  const customerOptions: SelectOption[] = useMemo(
    () =>
      customers.map((customer) => ({
        value: customer.id,
        label: `${customer.name}`
      })),
    [customers]
  );

  // Material options
  const materialOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: 'Select a material' },
      ...materials.map((material) => ({
        value: material.id,
        label: `${material.name} (${material.color} )`
      }))
    ],
    [materials]
  );

  // Filter sizes based on selected category
  useEffect(() => {
    if (sizes.length > 0) {
      const newFilteredSizes = new Map<number, ISize[]>();
      hierarchicalSelections.forEach((selection, itemIndex) => {
        if (selection.categoryId) {
          const filtered = sizes.filter(size => size.categoryId === selection.categoryId);
          newFilteredSizes.set(itemIndex, filtered);
        } else {
          newFilteredSizes.set(itemIndex, []);
        }
      });
      setFilteredSizes(newFilteredSizes);
    }
  }, [sizes, hierarchicalSelections]);

  // Filter types based on selected size
  useEffect(() => {
    if (types.length > 0) {
      const newFilteredTypes = new Map<number, IProductType[]>();
      hierarchicalSelections.forEach((selection, itemIndex) => {
        if (selection.sizeId) {
          const filtered = types.filter(type => type.sizeId === selection.sizeId);
          newFilteredTypes.set(itemIndex, filtered);
        } else {
          newFilteredTypes.set(itemIndex, []);
        }
      });
      setFilteredTypes(newFilteredTypes);
    }
  }, [types, hierarchicalSelections]);

  // Filter items based on selected category, size, AND type
useEffect(() => {
  if (items.length > 0) {
    const newFilteredItems = new Map<number, any[]>();
    hierarchicalSelections.forEach((selection, itemIndex) => {
      const { categoryId, sizeId, typeId } = selection;
      
      // Only filter if we have at least category selected
      if (categoryId) {
        let filtered = items;
        
        // Filter by category (items have categoryId)
        filtered = filtered.filter(item => item.categoryId === categoryId);
        
        // Filter by size if selected
        if (sizeId) {
          filtered = filtered.filter(item => item.sizeId === sizeId);
        }
        
        // Filter by type if selected
        if (typeId) {
          filtered = filtered.filter(item => item.typeId === typeId);
        }
        
        newFilteredItems.set(itemIndex, filtered);
      } else {
        newFilteredItems.set(itemIndex, []);
      }
    });
    setFilteredItems(newFilteredItems);
  }
}, [items, hierarchicalSelections]);

  const handleCategoryChange = (itemIndex: number, categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    // Update hierarchical selection
    setHierarchicalSelections(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemIndex) || {
        categoryId: '',
        sizeId: '',
        typeId: '',
        selectedItem: null
      };
      newMap.set(itemIndex, {
        ...existing,
        categoryId: categoryId,
        sizeId: '', // Reset size
        typeId: '', // Reset type
        selectedItem: null // Reset selected item
      });
      return newMap;
    });

    // Clear related form fields
    form.setValue(`items.${itemIndex}.description`, '');
    form.setValue(`items.${itemIndex}.unitPrice`, 0);
    form.setValue(`items.${itemIndex}.size`, '');
    form.setValue(`items.${itemIndex}.itemId`, '');
    
    // Clear selected item ID
    setSelectedItemIds(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemIndex);
      return newMap;
    });
    
    // Clear price auto-filled flag
    setPriceAutoFilled(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemIndex);
      return newMap;
    });
  };

  const handleSizeChange = (itemIndex: number, sizeId: string) => {
    const size = sizes.find(s => s.id === sizeId);
    if (!size) return;

    // Update hierarchical selection
    setHierarchicalSelections(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemIndex) || {
        categoryId: '',
        sizeId: '',
        typeId: '',
        selectedItem: null
      };
      newMap.set(itemIndex, {
        ...existing,
        sizeId: sizeId,
        typeId: '', // Reset type
        selectedItem: null // Reset selected item
      });
      return newMap;
    });

    // Set size in form
    form.setValue(`items.${itemIndex}.size`, size.name);
    
    // Clear related form fields
    form.setValue(`items.${itemIndex}.description`, '');
    form.setValue(`items.${itemIndex}.unitPrice`, 0);
    form.setValue(`items.${itemIndex}.itemId`, '');
    
    // Clear selected item ID
    setSelectedItemIds(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemIndex);
      return newMap;
    });
    
    // Clear price auto-filled flag
    setPriceAutoFilled(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemIndex);
      return newMap;
    });
  };

  const handleTypeChange = (itemIndex: number, typeId: string) => {
    const type = types.find(t => t.id === typeId);
    if (!type) return;

    // Update hierarchical selection
    setHierarchicalSelections(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemIndex) || {
        categoryId: '',
        sizeId: '',
        typeId: '',
        selectedItem: null
      };
      newMap.set(itemIndex, {
        ...existing,
        typeId: typeId,
        selectedItem: null // Reset selected item
      });
      return newMap;
    });

    // Clear related form fields
    form.setValue(`items.${itemIndex}.description`, '');
    form.setValue(`items.${itemIndex}.unitPrice`, 0);
    form.setValue(`items.${itemIndex}.itemId`, '');
    
    // Clear selected item ID
    setSelectedItemIds(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemIndex);
      return newMap;
    });
    
    // Clear price auto-filled flag
    setPriceAutoFilled(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemIndex);
      return newMap;
    });
  };

const handleItemSelect = (itemIndex: number, selectedItem: any) => {
  const currentSelection = getCurrentSelection(itemIndex);
  
  // Validate that the selected item matches all hierarchical selections
  if (currentSelection.categoryId && selectedItem.categoryId !== currentSelection.categoryId) {
    toast.error('Selected item does not match the selected category');
    return;
  }
  
  if (currentSelection.sizeId && selectedItem.sizeId !== currentSelection.sizeId) {
    toast.error('Selected item does not match the selected size');
    return;
  }
  
  if (currentSelection.typeId && selectedItem.typeId !== currentSelection.typeId) {
    toast.error('Selected item does not match the selected type');
    return;
  }

  // Update hierarchical selection
  setHierarchicalSelections(prev => {
    const newMap = new Map(prev);
    const existing = newMap.get(itemIndex) || {
      categoryId: '',
      sizeId: '',
      typeId: '',
      selectedItem: null
    };
    newMap.set(itemIndex, {
      ...existing,
      selectedItem: selectedItem
    });
    return newMap;
  });

  setSelectedItemIds(prev => {
    const newMap = new Map(prev);
    newMap.set(itemIndex, selectedItem.id);
    return newMap;
  });
  
  form.setValue(`items.${itemIndex}.itemId`, selectedItem.id);
  form.setValue(`items.${itemIndex}.description`, selectedItem.name);
  
  // REMOVE THIS LINE - Don't auto-fill size
  // form.setValue(`items.${itemIndex}.size`, selectedItem.size || '');
  
  // Auto-fill price
  if (selectedItem.price && selectedItem.price > 0) {
    form.setValue(`items.${itemIndex}.unitPrice`, selectedItem.price);
    setPriceAutoFilled(prev => {
      const newMap = new Map(prev);
      newMap.set(itemIndex, true);
      return newMap;
    });
    calculateItemAmount(itemIndex);
    toast.success(`Price ${formatCurrency(selectedItem.price)} applied`);
  }
  
  // Auto-fill image
  if (selectedItem.imageUrl) {
    const normalizedImageUrl = normalizeImagePath(selectedItem.imageUrl);
    if (normalizedImageUrl) {
      const newImage: ImageFileWithPreview = {
        preview: normalizedImageUrl,
        isExisting: true,
        existingUrl: selectedItem.imageUrl
      };
      
      setItemImages(prev => {
        const newMap = new Map(prev);
        const currentImages = newMap.get(itemIndex) || [];
        newMap.set(itemIndex, [...currentImages, newImage]);
        return newMap;
      });
      
      toast.success(`Image from item added`);
    }
  }
  
  // Auto-fill materials
  if (selectedItem.itemMaterials && selectedItem.itemMaterials.length > 0) {
    const materialsList = selectedItem.itemMaterials.map((im: { materialId: any; quantity: any; note: any; }) => ({
      id: '',
      itemId: '',
      materialId: im.materialId,
      quantity: im.quantity,
      note: im.note || ''
    }));
    
    form.setValue(`items.${itemIndex}.materials`, materialsList);
    toast.success(`Added ${materialsList.length} material(s) from item`);
  } else {
    form.setValue(`items.${itemIndex}.materials`, []);
  }
};
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const handleAddItemImage = (itemIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: ImageFileWithPreview[] = [];
      
      Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} size should be less than 5MB`);
          return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          newImages.push({
            file: file,
            preview: result,
            isExisting: false
          });
          
          if (newImages.length === Array.from(files).filter(f => f.type.startsWith('image/')).length) {
            setItemImages(prev => {
              const newMap = new Map(prev);
              const currentImages = newMap.get(itemIndex) || [];
              newMap.set(itemIndex, [...currentImages, ...newImages]);
              return newMap;
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeItemImage = (itemIndex: number, imageIndex: number) => {
    setItemImages(prev => {
      const newMap = new Map(prev);
      const currentImages = newMap.get(itemIndex) || [];
      const updatedImages = currentImages.filter((_, idx) => idx !== imageIndex);
      
      if (updatedImages.length === 0) {
        newMap.delete(itemIndex);
      } else {
        newMap.set(itemIndex, updatedImages);
      }
      
      return newMap;
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateItemAmount = (index: number) => {
    const quantity = form.getValues(`items.${index}.quantity`);
    const unitPrice = form.getValues(`items.${index}.unitPrice`);
    const amount = quantity * unitPrice;
    form.setValue(`items.${index}.amount`, amount);
    calculateTotals();
  };

  const calculateTotals = () => {
    const itemsList = form.getValues('items');
    const subtotal = itemsList.reduce((sum, item) => sum + item.amount, 0);
    
    const vatApplied = form.getValues('vatApplied');
    const vatPercent = form.getValues('vatPercent') || 15;
    
    const vat = vatApplied ? subtotal * (vatPercent / 100) : 0;
    const total = subtotal + vat;

    form.setValue('subtotal', subtotal);
    form.setValue('vat', vat);
    form.setValue('total', total);
    
    if (vatApplied) {
      form.setValue('vatPercent', 15);
    }
  };

  const handleVatAppliedChange = (checked: boolean) => {
    form.setValue('vatApplied', checked);
    
    if (checked) {
      form.setValue('vatPercent', 15);
    } else {
      form.setValue('vatPercent', 0);
    }
    
    calculateTotals();
  };

  const addItem = () => {
    const newIndex = itemFields.length;
    appendItem({
      id: '',
      invoiceId: '',
      itemId: '',
      description: '',
      size: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      additionalDescription: '',
      materials: [],
      images: [],
    });
    
    // Initialize hierarchical selection for the new item
    setHierarchicalSelections(prev => {
      const newMap = new Map(prev);
      newMap.set(newIndex, {
        categoryId: '',
        sizeId: '',
        typeId: '',
        selectedItem: null
      });
      return newMap;
    });
  };

  const addMaterialToItem = (itemIndex: number) => {
    const currentItems = form.getValues('items');
    const item = currentItems[itemIndex];
    
    if (item) {
      const updatedMaterials = [
        ...(item.materials || []),
        {
          id: '',
          itemId: item.id || '',
          materialId: '',
          quantity: 1,
          note: ''
        } as IProformaItemMaterial
      ];
      
      form.setValue(`items.${itemIndex}.materials`, updatedMaterials);
    }
  };

  const removeMaterialFromItem = (itemIndex: number, materialIndex: number) => {
    const currentItems = form.getValues('items');
    const item = currentItems[itemIndex];
    
    if (item && item.materials) {
      const updatedMaterials = item.materials.filter((_, idx) => idx !== materialIndex);
      form.setValue(`items.${itemIndex}.materials`, updatedMaterials);
    }
  };

  const updateMaterialInItem = (
    itemIndex: number, 
    materialIndex: number, 
    field: keyof IProformaItemMaterial, 
    value: any
  ) => {
    const currentItems = form.getValues('items');
    const item = currentItems[itemIndex];
    
    if (item && item.materials) {
      const updatedMaterials = [...item.materials];
      updatedMaterials[materialIndex] = {
        ...updatedMaterials[materialIndex],
        [field]: value
      };
      
      form.setValue(`items.${itemIndex}.materials`, updatedMaterials);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount);
  };

  const onSubmit = async (data: ProformaInvoiceFormValues) => {
    try {
      setIsLoading(true);

      const formData = new FormData();
      
      // Add store field
      formData.append('store', isStore.toString());
      
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'items' && key !== 'attachments' && key !== 'store') {
          if (value !== undefined && value !== null) {
            if (value instanceof Date) {
              formData.append(key, value.toISOString());
            } else {
              formData.append(key, value.toString());
            }
          }
        }
      });

      // Prepare items with materials, images, AND itemId
      const itemsWithData = data.items.map((item, index) => {
        const itemImagesData = itemImages.get(index) || [];
        const selectedItemId = selectedItemIds.get(index);
        
        // Separate existing images and new uploads
        const existingImages = itemImagesData
          .filter(img => img.isExisting && img.existingUrl)
          .map(img => ({
            id: '',
            itemId: item.id || '',
            imageUrl: img.existingUrl!,
            createdAt: new Date().toISOString()
          }));
        
        // For new images, use placeholder - backend will handle the actual upload
        const newImages = itemImagesData
          .filter(img => !img.isExisting && img.file)
          .map(img => ({
            id: '',
            itemId: item.id || '',
            imageUrl: img.file!.name, // Placeholder, backend will use actual file
            createdAt: new Date().toISOString()
          }));
        
        return {
          ...item,
          itemId: selectedItemId || item.itemId || '', // Include the itemId for backend
          itemIndex: index,
          materials: item.materials?.map(material => ({
            materialId: material.materialId,
            quantity: material.quantity,
            note: material.note || ''
          })) || [],
          images: [...existingImages, ...newImages]
        };
      });

      formData.append('items', JSON.stringify(itemsWithData));

      // Append new image files with proper field naming
      itemImages.forEach((images, itemIndex) => {
        images.forEach((img, imgIndex) => {
          if (!img.isExisting && img.file) {
            formData.append(`items[${itemIndex}].images[${imgIndex}]`, img.file);
          }
        });
      });

      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      if (initialData?.id) {
        await updateProformaInvoice(initialData.id, formData);
        toast.success('Proforma Invoice updated successfully');
      } else {
        await createProformaInvoice(formData);
        toast.success('Proforma Invoice created successfully');
      }
      
      router.push('/dashboard/ProformaInvoice');
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || 'Error saving proforma invoice');
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

  // Helper to get filtered items for a specific row
  const getFilteredItemsForRow = (itemIndex: number) => {
    return filteredItems.get(itemIndex) || [];
  };

  // Helper to get filtered sizes for a specific row
  const getFilteredSizesForRow = (itemIndex: number) => {
    return filteredSizes.get(itemIndex) || [];
  };

  // Helper to get filtered types for a specific row
  const getFilteredTypesForRow = (itemIndex: number) => {
    return filteredTypes.get(itemIndex) || [];
  };

  // Helper to get current hierarchical selection for a row
  const getCurrentSelection = useCallback((itemIndex: number): HierarchicalSelection => {
    return hierarchicalSelections.get(itemIndex) || {
      categoryId: '',
      sizeId: '',
      typeId: '',
      selectedItem: null
    };
  }, [hierarchicalSelections]);

const handleCustomerCreated = async () => {
  setShowCustomerModal(false);

  try {
    const customersData = await getCustomer();
    setCustomers(customersData || []);
  } catch {
    toast.error('Failed to refresh customers');
  }
};
// Add a useEffect to suggest size when item is selected
useEffect(() => {
  // For each item field, check if we have a selected item
  itemFields.forEach((field, index) => {
    const currentSelection = getCurrentSelection(index);
    const currentSize = form.getValues(`items.${index}.size`);
    
    // If item is selected and size field is empty, suggest from item
    if (currentSelection.selectedItem?.size && !currentSize) {
      form.setValue(`items.${index}.size`, currentSelection.selectedItem.size);
    }
  });
}, [itemFields, hierarchicalSelections, getCurrentSelection, form]);
  return (
    <>
    <div className="mx-auto w-full space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => router.push('/dashboard/ProformaInvoice')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold tracking-tight">{pageTitle}</h2>
            <p className="text-xs text-muted-foreground">
              {initialData ? 'Update the invoice details below' : 'Fill in the details to create a new proforma invoice'}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refreshItems}
          disabled={isFetchingItems}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetchingItems ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* ════════════════════════════════════════════════════════════
             SECTION 1 — Invoice Details
             ════════════════════════════════════════════════════════════ */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4">
              {/* Stock Invoice toggle */}
              <div className="flex items-center gap-2.5 rounded-md border border-dashed bg-muted/20 px-3 py-2">
                <Checkbox
                  id="store-checkbox"
                  checked={isStore}
                  onCheckedChange={(checked) => {
                    setIsStore(checked as boolean);
                    if (checked) {
                      form.setValue('customerId', '');
                    }
                  }}
                />
                <label
                  htmlFor="store-checkbox"
                  className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Stock Invoice
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    (No customer required)
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Customer Field */}
                <CustomerSelect
                  isStore={isStore}
                  form={form}
                  control={form.control}
                  isDark={isDark}
                />

                <FormField
                  name="vatApplied"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border bg-card px-4 py-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={handleVatAppliedChange}
                        />
                      </FormControl>
                      <div className="space-y-0.5 leading-none">
                        <FormLabel className="text-sm">Apply 15% VAT</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Add 15% VAT to the subtotal
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  name="amountDate"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* ════════════════════════════════════════════════════════════
             SECTION 2 — Line Items
             ════════════════════════════════════════════════════════════ */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold">Line Items</CardTitle>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {itemFields.length}
                  </Badge>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1.5 text-xs h-7">
                  <Plus className="h-3.5 w-3.5" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {itemFields.map((field, itemIndex) => {
                  const currentSelection = getCurrentSelection(itemIndex);
                  const availableSizes = getFilteredSizesForRow(itemIndex);
                  const availableTypes = getFilteredTypesForRow(itemIndex);
                  const availableItems = getFilteredItemsForRow(itemIndex);

                  return (
                    <div
                      key={field.id}
                      className="overflow-hidden rounded-xl border bg-card shadow-sm"
                    >
                      {/* Item Header Bar */}
                      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                            {itemIndex + 1}
                          </span>
                          <span className="text-sm font-medium">
                            {form.watch(`items.${itemIndex}.description`) || 'New Item'}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(itemIndex)}
                          disabled={itemFields.length <= 1}
                          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </Button>
                      </div>

                      <div className="space-y-4 p-4">
                        {/* Product Selector */}
                        <div>
                          <p className="mb-2 text-xs font-medium text-muted-foreground">Product Selection</p>
                          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            <div>
                              <FormLabel className="text-xs">Category</FormLabel>
                              <Select
                                options={categories.map(cat => ({
                                  value: cat.id,
                                  label: cat.name
                                }))}
                                value={categories.find(cat => cat.id === currentSelection.categoryId) ? {
                                  value: currentSelection.categoryId,
                                  label: categories.find(cat => cat.id === currentSelection.categoryId)?.name || ''
                                } : null}
                                onChange={(option: any) => handleCategoryChange(itemIndex, option?.value || '')}
                                placeholder="Select category"
                                isSearchable
                                styles={isDark ? darkStyles : {}}
                              />
                            </div>

                            <div>
                              <FormLabel className="text-xs">Size</FormLabel>
                              <Select
                                options={availableSizes.map((size: { id: any; name: any; }) => ({
                                  value: size.id,
                                  label: size.name
                                }))}
                                value={availableSizes.find((size: { id: string; }) => size.id === currentSelection.sizeId) ? {
                                  value: currentSelection.sizeId,
                                  label: availableSizes.find((size: { id: string; }) => size.id === currentSelection.sizeId)?.name || ''
                                } : null}
                                onChange={(option: any) => handleSizeChange(itemIndex, option?.value || '')}
                                placeholder={currentSelection.categoryId ? "Select size" : "Select category first"}
                                isSearchable
                                isDisabled={!currentSelection.categoryId}
                                styles={isDark ? darkStyles : {}}
                              />
                            </div>

                            <div>
                              <FormLabel className="text-xs">Type</FormLabel>
                              <Select
                                options={availableTypes.map((type: { id: any; name: any; }) => ({
                                  value: type.id,
                                  label: type.name
                                }))}
                                value={availableTypes.find((type: { id: string; }) => type.id === currentSelection.typeId) ? {
                                  value: currentSelection.typeId,
                                  label: availableTypes.find((type: { id: string; }) => type.id === currentSelection.typeId)?.name || ''
                                } : null}
                                onChange={(option: any) => handleTypeChange(itemIndex, option?.value || '')}
                                placeholder={currentSelection.sizeId ? "Select type" : "Select size first"}
                                isSearchable
                                isDisabled={!currentSelection.sizeId}
                                styles={isDark ? darkStyles : {}}
                              />
                            </div>

                         <div>
  <FormLabel className="text-xs">Item</FormLabel>
  <Select
    options={availableItems.map((item: any) => ({
      value: item.id,
      label: `${item.name}${item.color ? ` - ${item.color}` : ''}`,
      item: item
    }))}
    value={availableItems.find((item: any) => item.id === currentSelection.selectedItem?.id) ? {
      value: currentSelection.selectedItem?.id || '',
      label: currentSelection.selectedItem?.name || ''
    } : null}
    onChange={(option: any) => {
      if (option?.item) {
        handleItemSelect(itemIndex, option.item);
      }
    }}
    placeholder={
      !currentSelection.categoryId 
        ? "Select category first" 
        : availableItems.length === 0 
          ? "No items match filters" 
          : "Select item"
    }
    isSearchable
    isLoading={isFetchingItems}
    isDisabled={!currentSelection.categoryId}
    styles={isDark ? darkStyles : {}}
    noOptionsMessage={() => 
      currentSelection.categoryId 
        ? "No items available for these filters" 
        : "Select a category first"
    }
  />
  {availableItems.length > 0 && (
    <p className="text-xs text-muted-foreground mt-1">
      {availableItems.length} item{availableItems.length > 1 ? 's' : ''} available
    </p>
  )}
</div>
                          </div>
                        </div>

                        {/* ── Pricing Row ── */}
                  {/* ── Pricing Row ── */}
<div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
  {/* Quantity */}
  <FormField
    control={form.control}
    name={`items.${itemIndex}.quantity`}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-xs">Qty</FormLabel>
        <FormControl>
          <Input
            type="number"
            min="1"
            placeholder="1"
            {...field}
            onChange={(e) => {
              field.onChange(parseInt(e.target.value) || 1);
              calculateItemAmount(itemIndex);
            }}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />

  {/* Size - NEW EDITABLE FIELD */}
<FormField
  control={form.control}
  name={`items.${itemIndex}.size`}
  render={({ field }) => (
    <FormItem>
      <FormLabel className="text-xs">
        Size
        {field.value && (
          <Badge variant="secondary" className="ml-1 text-[10px]">
            Custom
          </Badge>
        )}
      </FormLabel>
      <FormControl>
        <Input
          type="text"
          placeholder="Enter size (optional)"
          {...field}
          value={typeof field.value === 'string' ? field.value : ''} // Ensure it's a string
          onChange={(e) => {
            field.onChange(e.target.value);
          }}
          className={field.value ? "border-blue-300 focus-visible:ring-blue-500" : ""}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

  {/* Unit Price */}
  <FormField
    control={form.control}
    name={`items.${itemIndex}.unitPrice`}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="flex items-center gap-2 text-xs">
          Unit Price
          {priceAutoFilled.get(itemIndex) && (
            <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Auto
            </Badge>
          )}
        </FormLabel>
        <FormControl>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...field}
            onChange={(e) => {
              field.onChange(parseFloat(e.target.value) || 0);
              calculateItemAmount(itemIndex);
              if (priceAutoFilled.get(itemIndex)) {
                setPriceAutoFilled(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(itemIndex);
                  return newMap;
                });
              }
            }}
            className={priceAutoFilled.get(itemIndex) ? "border-green-300 focus-visible:ring-green-500" : ""}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />

  {/* Amount */}
  <FormField
    control={form.control}
    name={`items.${itemIndex}.amount`}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-xs">Amount</FormLabel>
        <FormControl>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...field}
            readOnly
            className="bg-muted/50 font-semibold"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>

                        {/* ── Descriptions ── */}
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`items.${itemIndex}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Item description"
                                  {...field}
                                  rows={2}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${itemIndex}.additionalDescription`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Additional Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Extra details about the item"
                                  {...field}
                                  rows={2}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        </div>

                      <div className="mt-3 border-t pt-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-semibold flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                            Materials
                          </p>
                          <div className="flex items-center gap-1.5">
                            <Button type="button" variant="ghost" size="sm" onClick={refreshMaterials} className="h-6 text-[10px] px-2">
                              Refresh
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => addMaterialToItem(itemIndex)} className="h-6 gap-1 text-[10px] px-2">
                              <Plus className="h-3 w-3" />
                              Add
                            </Button>
                          </div>
                        </div>

                        {(form.watch(`items.${itemIndex}.materials`)?.length || 0) > 0 ? (
                          <div className="space-y-3">
                            {form.watch(`items.${itemIndex}.materials`)?.map((material, materialIndex) => (
                              <div key={materialIndex} className="grid grid-cols-1 gap-3 rounded border p-3 md:grid-cols-12">
                                <div className="md:col-span-5">
                                  <FormLabel>Material</FormLabel>
                                  <Select
                                    options={materialOptions}
                                    value={materialOptions.find((option: { value: string; }) => option.value === material.materialId)}
                                    onChange={(option) => updateMaterialInItem(itemIndex, materialIndex, 'materialId', option?.value || '')}
                                    placeholder="Select material"
                                    styles={isDark ? darkStyles : {}}
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <FormLabel>Quantity</FormLabel>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={material.quantity}
                                    onChange={(e) => updateMaterialInItem(itemIndex, materialIndex, 'quantity', parseInt(e.target.value) || 1)}
                                    placeholder="Qty"
                                  />
                                </div>

                                <div className="md:col-span-3">
                                  <FormLabel>Note</FormLabel>
                                  <Input
                                    value={material.note || ''}
                                    onChange={(e) => updateMaterialInItem(itemIndex, materialIndex, 'note', e.target.value)}
                                    placeholder="Optional note"
                                  />
                                </div>

                                <div className="md:col-span-2 flex items-end">
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeMaterialFromItem(itemIndex, materialIndex)}
                                    className="w-full"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="rounded-lg border border-dashed py-4 text-center text-xs text-muted-foreground">
                            No materials — select an item above to auto-fill
                          </p>
                        )}
                      </div>

                      <div className="mt-3 border-t pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold flex items-center gap-1.5">
                            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            Images
                            {(itemImages.get(itemIndex)?.length || 0) > 0 && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1">
                                {itemImages.get(itemIndex)?.length}
                              </Badge>
                            )}
                          </p>
                          <div>
                            <input
                              type="file"
                              id={`item-images-${itemIndex}`}
                              accept="image/*"
                              multiple
                              onChange={(e) => handleAddItemImage(itemIndex, e)}
                              className="hidden"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`item-images-${itemIndex}`)?.click()} className="h-6 gap-1 text-[10px] px-2">
                              <Upload className="h-3 w-3" />
                              Upload
                            </Button>
                          </div>
                        </div>

                          {(itemImages.get(itemIndex)?.length || 0) > 0 && (
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                              {itemImages.get(itemIndex)?.map((image, imageIndex) => (
                                <div key={imageIndex} className="relative group">
                                  <div className="relative aspect-square rounded-lg border overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    <img
                                      src={image.preview}
                                      alt={`Item ${itemIndex + 1} image ${imageIndex + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                      }}
                                    />
                                    
                                    {/* Image Info Badge */}
                                    {image.isExisting && (
                                      <div className="absolute top-1 left-1">
                                        <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800">
                                          From Item
                                        </Badge>
                                      </div>
                                    )}
                                    
                                    {/* Remove Button */}
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => removeItemImage(itemIndex, imageIndex)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                    
                                    {/* View Button */}
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="icon"
                                      className="absolute bottom-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => window.open(image.preview, '_blank')}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  
                                  {/* Image Name */}
                                  {!image.isExisting && image.file && (
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                      {image.file.name}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Summary</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Subtotal</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums">
                    {formatCurrency(form.watch('subtotal'))}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    VAT {form.watch('vatApplied') ? '(15%)' : ''}
                  </p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums">
                    {formatCurrency(form.watch('vat'))}
                  </p>
                  {!form.watch('vatApplied') && (
                    <p className="text-[10px] text-muted-foreground">Not applied</p>
                  )}
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Total</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-primary">
                    {formatCurrency(form.watch('total'))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold">Attachments</CardTitle>
                {attachments.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {attachments.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <div
                className="flex cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-dashed bg-muted/20 px-6 py-5 transition-colors hover:border-primary/40 hover:bg-muted/40"
                onClick={() => document.getElementById('attachments')?.click()}
              >
                <input
                  type="file"
                  id="attachments"
                  multiple
                  onChange={handleAttachmentChange}
                  className="hidden"
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Click to upload files</p>
                  <p className="text-xs text-muted-foreground">Attach supporting documents</p>
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeAttachment(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Submit ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/ProformaInvoice')}
            >
              Cancel
            </Button>
             <Button
              type="submit"
              disabled={isLoading}
              size="sm"
              className="min-w-[120px]"
            >
              {isLoading
                ? 'Saving...'
                : initialData
                ? 'Update Invoice'
                : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </Form>
    </div>

    <Modal
      isOpen={showCustomerModal}
      onClose={() => setShowCustomerModal(false)}
      title='Create New Supplier'
      description={''}
    >
      <CreateCustomerModal
        closeModal={() => setShowCustomerModal(false)}
        onSuccess={handleCustomerCreated}
      />
    </Modal>
    </>
  );
}
