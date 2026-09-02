/* eslint-disable @next/next/no-img-element */
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
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { createProformaInvoice, updateProformaInvoiceseco } from '@/service/ProformaInvoice';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { IAttachment, IProformaInvoice, IProformaInvoiceItem } from '@/models/ProformaInvoice';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Trash2, Download, Image as ImageIcon, Package, Eye, RefreshCw, X, Check, AlertCircle, CheckSquare } from 'lucide-react';
import { getCustomer } from '@/service/customer';
import { getMaterials } from '@/service/material';
import { getAllItemsimple } from '@/service/item';
import { normalizeImagePath } from '@/lib/norm';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { getCategories, getSizes, getTypes } from '@/service/productConfiguration';
import { IProductCategory, IProductType, ISize } from '@/models/productConfiguration';
import { Modal } from '@/components/ui/modal';
import CreateCustomerModal from './customer';
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



const formatDecimal = (value: number | undefined, decimals: number = 2): string => {
    if (value === undefined || value === null) return '';
    return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};
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

interface ImageFileWithPreview {
  file?: File;
  preview: string;
  isExisting: boolean;
  existingUrl?: string;
  id?: string;
}

// Helper function to safely extract string from possible object
const safeString = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    // If it has a 'name' property, use that
    if (value.name && typeof value.name === 'string') return value.name;
    // If it has a 'id' property, use that as fallback
    if (value.id && typeof value.id === 'string') return value.id;
    // Otherwise convert to string or return empty
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return String(value);
};

export default function ProformaInvoiceForm({
  initialData,
  pageTitle
}: ProformaInvoiceFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [itemImages, setItemImages] = useState<Map<number, ImageFileWithPreview[]>>(new Map());
  const [isFetchingItems, setIsFetchingItems] = useState(false);
  const [priceAutoFilled, setPriceAutoFilled] = useState<Map<number, boolean>>(new Map());
  const [isStore, setIsStore] = useState<boolean>(initialData?.store || false);
  const [selectedItemIds, setSelectedItemIds] = useState<Map<number, string>>(new Map());
  // Track which items have auto-filled size (to disable manual size input)
  const [sizeAutoFilled, setSizeAutoFilled] = useState<Map<number, boolean>>(new Map());
// Add this state near your other state declarations
const [existingAttachments, setExistingAttachments] = useState<IAttachment[]>([]);
const [attachmentsToDelete, setAttachmentsToDelete] = useState<string[]>([]);
const [newAttachments, setNewAttachments] = useState<File[]>([]);
  // Hierarchical data states
  const [categories, setCategories] = useState<IProductCategory[]>([]);
  const [sizes, setSizes] = useState<ISize[]>([]);
  const [types, setTypes] = useState<IProductType[]>([]);
  const [filteredItems, setFilteredItems] = useState<Map<number, any[]>>(new Map());
  const [showCustomerModal, setShowCustomerModal] = useState(false);
const [showConfirmationModal, setShowConfirmationModal] = useState(false);
const [confirmationData, setConfirmationData] = useState<ProformaInvoiceFormValues | null>(null);

  const [selectedMaterialImage, setSelectedMaterialImage] = useState<string | null>(null);
const [showMaterialImageModal, setShowMaterialImageModal] = useState(false);
const [materialImageMap, setMaterialImageMap] = useState<Map<string, string>>(new Map());

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
      items: initialData?.items?.map((item) => {
        // Safely extract description and size as strings
        const description = safeString(item.description);
        const size = safeString(item.size);
        
        return {
          id: item.id || '',
          invoiceId: item.invoiceId || '',
          itemId: item.itemId || '',
                    categoryId: item.categoryId || '',
          description: description,
          itemname: item.itemname || '',
          size: size,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          amount: item.amount || 0,
          additionalDescription: item.additionalDescription || '',
          materials: item.proformaItemMaterials?.map((material) => ({
            ...material,
            id: material.id || '',
            itemId: material.itemId || '',
            materialId: material.materialId || '',
            quantity: material.quantity || 1,
            note: material.note || '',
          })) || [],
          images: item.images || []
        };
      }) || [
        {
          id: '',
          invoiceId: '',
          itemId: '',
          categoryId: '',
          itemname: '',
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

// Update the resolver to validate materials
const form = useForm<ProformaInvoiceFormValues>({
  defaultValues,
  mode: 'onChange',
  resolver: async (data) => {
    const errors: any = {};
    
    // Validate each item
    if (data.items && data.items.length > 0) {
      data.items.forEach((item, index) => {
        // Get the categoryId from hierarchical selections
        const selection = hierarchicalSelections.get(index);
        const categoryId = selection?.categoryId || '';
        
        // Category is mandatory
        if (!categoryId || categoryId === '') {
          if (!errors.items) errors.items = [];
          errors.items[index] = {
            ...errors.items[index],
            categoryId: {
              type: 'required',
              message: 'Category is required'
            }
          };
        }
        
        // Description is required
        if (!item.description || item.description.trim() === '') {
          if (!errors.items) errors.items = [];
          errors.items[index] = {
            ...errors.items[index],
            description: {
              type: 'required',
              message: 'Description is required'
            }
          };
        }
        
        // Unit Price is required (must be > 0)
        if (!item.unitPrice || item.unitPrice <= 0) {
          if (!errors.items) errors.items = [];
          errors.items[index] = {
            ...errors.items[index],
            unitPrice: {
              type: 'required',
              message: 'Unit price must be greater than 0'
            }
          };
        }
        
        // ✅ At least one material is required
        const materials = item.materials || [];
        const hasValidMaterial = materials.some(m => m.materialId && m.materialId !== '');
        
        if (!hasValidMaterial) {
          if (!errors.items) errors.items = [];
          errors.items[index] = {
            ...errors.items[index],
            materials: {
              type: 'required',
              message: 'At least one material is required'
            }
          };
        }
      });
    }
    
    return {
      values: data,
      errors: errors
    };
  }
});

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: 'items'
  });
const getMaterialImage = useCallback(async (materialId: string) => {
  if (!materialId) return;
  
  // Check if we already have the image in cache
  if (materialImageMap.has(materialId)) {
    return;
  }
  
  try {
    const material = materials.find(m => m.id === materialId);
    if (material?.imageUrl) {
      const normalizedUrl = normalizeImagePath(material.imageUrl);
      if (normalizedUrl) {
        setMaterialImageMap(prev => {
          const newMap = new Map(prev);
          newMap.set(materialId, normalizedUrl);
          return newMap;
        });
      }
    }
  } catch (error) {
    console.error('Failed to load material image:', error);
  }
}, [materials, materialImageMap]);
const calculateTotals = useCallback(() => {
    const itemsList = form.getValues('items');
    // Use toFixed(2) to maintain 2 decimal precision
    const subtotal = parseFloat(
        itemsList.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)
    );

    const vatApplied = form.getValues('vatApplied');
    const vatPercent = parseFloat((form.getValues('vatPercent') || 15).toString());

    const vat = vatApplied ? parseFloat((subtotal * (vatPercent / 100)).toFixed(2)) : 0;
    const total = parseFloat((subtotal + vat).toFixed(2));

    form.setValue('subtotal', subtotal);
    form.setValue('vat', vat);
    form.setValue('total', total);

    if (vatApplied) {
        form.setValue('vatPercent', 15);
    }
}, [form]);
const calculateItemAmount = useCallback((index: number) => {
    const quantity = form.getValues(`items.${index}.quantity`) || 0;
    const unitPrice = form.getValues(`items.${index}.unitPrice`) || 0;
    // Round to 2 decimal places
    const amount = parseFloat((quantity * unitPrice).toFixed(2));
    form.setValue(`items.${index}.amount`, amount);
    calculateTotals();
}, [calculateTotals, form]);


// Initialize hierarchical selections from existing items when editing
useEffect(() => {
  // Check if we have both the items data and the hierarchical data loaded
  if (initialData?.items && initialData.items.length > 0 && items.length > 0 && categories.length > 0) {
    const newHierarchicalSelections = new Map<number, HierarchicalSelection>();
    
    initialData.items.forEach((item, index) => {
      let fullItem = item.item;
      
      if (!fullItem && item.itemId) {
        fullItem = items.find(i => i.id === item.itemId);
      }
      
      // Get category ID from the item data (not from fullItem)
      // The item data should have categoryId directly
      const categoryId = item.categoryId || fullItem?.categoryId || '';
      
      // Get size from the item data
      const sizeId = fullItem?.sizeId || '';
      
      // Get type from the item data
      const typeId = fullItem?.typeId || '';
      
      if (categoryId) {
        newHierarchicalSelections.set(index, {
          categoryId: categoryId,
          sizeId: sizeId,
          typeId: typeId,
          selectedItem: fullItem || null
        });
        
        if (fullItem) {
          setSelectedItemIds(prev => {
            const newMap = new Map(prev);
            newMap.set(index, fullItem.id);
            return newMap;
          });
          
          // Set description from the item
          const itemName = safeString(fullItem.name);
          form.setValue(`items.${index}.description`, itemName);
          
          // Set size from the item
          if (fullItem.size) {
            const sizeValue = safeString(fullItem.size);
            form.setValue(`items.${index}.size`, sizeValue);
            setSizeAutoFilled(prev => {
              const newMap = new Map(prev);
              newMap.set(index, true);
              return newMap;
            });
          }
          
          // Set price
          if (fullItem.price && fullItem.price > 0) {
            form.setValue(`items.${index}.unitPrice`, fullItem.price);
            setPriceAutoFilled(prev => {
              const newMap = new Map(prev);
              newMap.set(index, true);
              return newMap;
            });
            calculateItemAmount(index);
          }
        }
      } else {
        // If no category, check if we have it from the selection
        // But the category should be in the item data
        console.warn('No category found for item', index);
      }
    });
    
    setHierarchicalSelections(newHierarchicalSelections);
  }
}, [initialData, items, categories, form, calculateItemAmount]); // Add categories to dependencies

// Initialize item images from existing data
useEffect(() => {
  if (initialData?.items) {
    const newItemImages = new Map<number, ImageFileWithPreview[]>();
    
    initialData.items.forEach((item, index) => {
      if (item.images && item.images.length > 0) {
        const existingImages: ImageFileWithPreview[] = item.images.map(img => ({
          preview: normalizeImagePath(img.imageUrl) || img.imageUrl,
          isExisting: true,
          existingUrl: img.imageUrl,
          id: img.id
        }));
        newItemImages.set(index, existingImages);
      }
    });
    
    setItemImages(newItemImages);
  }
}, [initialData]);
  // Fetch data on mount
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
// Add this right after your getMaterialImage function
const fetchMultipleMaterialImages = useCallback(async (materialIds: string[]) => {
  if (!materialIds.length) return;
  
  // Only fetch images we don't have yet
  const newIds = materialIds.filter(id => !materialImageMap.has(id));
  if (!newIds.length) return;
  
  // Get images for all materials
  newIds.forEach(materialId => {
    const material = materials.find(m => m.id === materialId);
    if (material?.imageUrl) {
      const normalizedUrl = normalizeImagePath(material.imageUrl);
      if (normalizedUrl) {
        setMaterialImageMap(prev => {
          const newMap = new Map(prev);
          newMap.set(materialId, normalizedUrl);
          return newMap;
        });
      }
    }
  });
}, [materials, materialImageMap]);
  const refreshItems = async () => {
    await fetchItems();
    toast.success('Items refreshed');
  };






// Add this useEffect after your other useEffects
useEffect(() => {
  if (initialData?.attachments && initialData.attachments.length > 0) {
    setExistingAttachments(initialData.attachments);
  }
}, [initialData]);

  // Filter items based on selected category, size, and type
  useEffect(() => {
    if (items.length > 0) {
      const newFilteredItems = new Map<number, any[]>();
      hierarchicalSelections.forEach((selection, itemIndex) => {
        const { categoryId, sizeId, typeId } = selection;
        
        if (categoryId) {
          let filtered = items;
          filtered = filtered.filter(item => item.categoryId === categoryId);
          
          if (sizeId) {
            filtered = filtered.filter(item => item.sizeId === sizeId);
          }
          
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

 


// Add this function to handle material image click
const handleMaterialImageClick = (imageUrl: string | null) => {
  if (imageUrl) {
    setSelectedMaterialImage(imageUrl);
    setShowMaterialImageModal(true);
  }
};


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount);
  };


  const selectedCustomerId = form.watch('customerId');
  const watchedItems = form.watch('items') || [];

  // Validation status helpers for readiness checklist
  const hasCustomer = isStore || Boolean(selectedCustomerId);
  const hasItems = watchedItems.length > 0;
  const allItemsHaveCategory = watchedItems.every((item, idx) => {
    const sel = hierarchicalSelections.get(idx);
    return Boolean(sel?.categoryId);
  });
  const allItemsHaveMaterials = watchedItems.every(item => 
    item.materials && item.materials.some(m => m.materialId && m.materialId !== '')
  );
  const handleFormSubmit = (data: ProformaInvoiceFormValues) => {
  // Show confirmation modal
  setConfirmationData(data);
  setShowConfirmationModal(true);
};

// Actual submission after confirmation
const confirmAndSubmit = async () => {
  if (!confirmationData) return;
  
  try {
    await onSubmit(confirmationData);
    // Close the modal after successful submission
    setShowConfirmationModal(false);
    setConfirmationData(null);
  } catch (error) {
    // Keep modal open on error so user can retry
    console.error('Submission failed:', error);
  }
};
// Complete onSubmit function
const onSubmit = async (data: ProformaInvoiceFormValues) => {
 
  
  try {
    setIsLoading(true);

    const formData = new FormData();
    
    // Store flag
    formData.append('store', isStore.toString());
    
    // Add all non-item fields
    Object.entries(data).forEach(([key, value]) => {
       if (key !== 'items' && key !== 'attachments' && key !== 'store') {
        if (value !== undefined && value !== null) {
          // ✅ Skip VAT fields when VAT is not applied
          if (key === 'vat' || key === 'vatPercent' || key === 'vatApplied') {
            // Only include VAT fields if VAT is actually applied
            if (data.vatApplied === true) {
              if (value instanceof Date) {
                formData.append(key, value.toISOString());
              } else {
                formData.append(key, value.toString());
              }
            }
            // Skip these fields when VAT is not applied
          } else {
            // Include all other fields normally
            if (value instanceof Date) {
              formData.append(key, value.toISOString());
            } else {
              formData.append(key, value.toString());
            }
          }
        
       }
      }
    });

    // ✅ FIX: Prepare items WITH itemIndex and include image data
    const itemsWithData = data.items.map((item, index) => {
      const itemImagesData = itemImages.get(index) || [];
      const selectedItemId = selectedItemIds.get(index);
      const selection = hierarchicalSelections.get(index);
      const categoryId = selection?.categoryId || '';
      
      // Process existing images
      const existingImages = itemImagesData
        .filter(img => img.isExisting && img.existingUrl)
        .map(img => ({
          id: img.id || '',
          itemId: item.id || '',
          imageUrl: img.existingUrl!,
          createdAt: new Date().toISOString()
        }));
      
      // Process new images (these will be uploaded as files)
      const newImages = itemImagesData
        .filter(img => !img.isExisting && img.file)
        .map(img => ({
          id: '',
          itemId: item.id || '',
          imageUrl: img.file!.name,
          createdAt: new Date().toISOString()
        }));
      
      return {
        ...item,
        itemId: selectedItemId || item.itemId || '',
        categoryId: categoryId,
        itemIndex: index, // ✅ CRITICAL: Include itemIndex for backend to match files
        materials: item.materials?.map(material => ({
          materialId: material.materialId,
          quantity: material.quantity,
          note: material.note || ''
        })) || [],
        images: [...existingImages, ...newImages]
      };
    });

    // ✅ Send items as JSON string
    formData.append('items', JSON.stringify(itemsWithData));

    // ✅ FIX: Append images with the correct field name format
    // The backend expects: items[${itemIndex}].images[${imageIndex}]
    itemImages.forEach((images, itemIndex) => {
      images.forEach((img, imgIndex) => {
        if (!img.isExisting && img.file) {
          // ✅ Use the EXACT format the backend expects
          formData.append(`items[${itemIndex}].images[${imgIndex}]`, img.file);
        }
      });
    });

    // ✅ Handle attachments to delete
    if (attachmentsToDelete.length > 0) {
      formData.append('attachmentsToDelete', JSON.stringify(attachmentsToDelete));
    }

    // ✅ Add NEW attachments
    newAttachments.forEach((file) => {
      formData.append('attachments', file);
    });

    // ✅ Send to backend
    if (initialData?.id) {
      await updateProformaInvoiceseco(initialData.id, formData);
      toast.success('Proforma Invoice updated successfully');
    } else {
      await createProformaInvoice(formData);
      toast.success('Proforma Invoice created successfully');
    }
    
    router.push('/dashboard/ProformaInvoice/my');
    router.refresh();
  } catch (error: any) {
    console.error('Submit error:', error);
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

  // Updated dark styles with higher z-index and proper menu positioning
  const darkStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      color: '#f9fafb',
      zIndex: 1,
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: '#1f2937',
      color: '#f9fafb',
      zIndex: 9999,
      position: 'relative',
    }),
    menuList: (base: any) => ({
      ...base,
      backgroundColor: '#1f2937',
      color: '#f9fafb',
      maxHeight: '200px',
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#374151' : '#1f2937',
      color: '#f9fafb',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#4b5563',
      },
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
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: '#9ca3af',
    }),
    indicatorSeparator: (base: any) => ({
      ...base,
      backgroundColor: '#374151',
    }),
  };
const getItemColor = (index: number) => {
  const colors = [
    'border-l-4 border-l-red-500 bg-red-50/20 dark:bg-red-950/10',
    'border-l-4 border-l-orange-500 bg-orange-50/20 dark:bg-orange-950/10',
    'border-l-4 border-l-yellow-500 bg-yellow-50/20 dark:bg-yellow-950/10',
    'border-l-4 border-l-green-500 bg-green-50/20 dark:bg-green-950/10',
    'border-l-4 border-l-blue-500 bg-blue-50/20 dark:bg-blue-950/10',
    'border-l-4 border-l-purple-500 bg-purple-50/20 dark:bg-purple-950/10',
  ];
  return colors[index % colors.length];
};

const getHeaderColor = (index: number) => {
  const colors = [
    'bg-red-100/50 dark:bg-red-950/40 border-red-200/50 dark:border-red-800/30',
    'bg-orange-100/50 dark:bg-orange-950/40 border-orange-200/50 dark:border-orange-800/30',
    'bg-yellow-100/50 dark:bg-yellow-950/40 border-yellow-200/50 dark:border-yellow-800/30',
    'bg-green-100/50 dark:bg-green-950/40 border-green-200/50 dark:border-green-800/30',
    'bg-blue-100/50 dark:bg-blue-950/40 border-blue-200/50 dark:border-blue-800/30',
    'bg-purple-100/50 dark:bg-purple-950/40 border-purple-200/50 dark:border-purple-800/30',
  ];
  return colors[index % colors.length];
};
  // Light mode styles with higher z-index
  const lightStyles = {
    menu: (base: any) => ({
      ...base,
      zIndex: 9999,
      position: 'relative',
    }),
    menuList: (base: any) => ({
      ...base,
      maxHeight: '200px',
    }),
    control: (base: any) => ({
      ...base,
      zIndex: 1,
    }),
    option: (base: any, state: any) => ({
      ...base,
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#e5e7eb',
      },
    }),
  };

  // Combine styles based on theme
  const getSelectStyles = () => {
    const base = isDark ? darkStyles : lightStyles;
    return {
      ...base,
      menuPortal: (base: any) => ({
        ...base,
        zIndex: 9999,
      }),
    };
  };

  const getFilteredItemsForRow = (itemIndex: number) => {
    return filteredItems.get(itemIndex) || [];
  };

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
// Add this after your other useEffect hooks
useEffect(() => {
  // When materials change, fetch their images
  const subscription = form.watch((value, { name }) => {
    if (name?.startsWith('items.') && name?.includes('.materials')) {
      const allItems = form.getValues('items');
      const materialIds: string[] = [];
      allItems?.forEach(item => {
        item.materials?.forEach(material => {
          if (material.materialId && !materialImageMap.has(material.materialId)) {
            materialIds.push(material.materialId);
          }
        });
      });
      if (materialIds.length > 0) {
        fetchMultipleMaterialImages(materialIds);
      }
    }
  });
  
  return () => subscription.unsubscribe();
}, [form, fetchMultipleMaterialImages, materialImageMap]);

// Add this useEffect after your other useEffects
useEffect(() => {
  const handleGlobalPaste = async (e: ClipboardEvent) => {
    // Only handle if we're focused on a form input or the page
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    
    const items = e.clipboardData?.items;
    if (!items) return;
    
    // Find the first active item row or the last one
    const activeItemIndex = itemFields.length > 0 ? itemFields.length - 1 : 0;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            continue;
          }
          
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const newImage: ImageFileWithPreview = {
              file: file,
              preview: result,
              isExisting: false
            };
            
            setItemImages(prev => {
              const newMap = new Map(prev);
              const currentImages = newMap.get(activeItemIndex) || [];
              newMap.set(activeItemIndex, [...currentImages, newImage]);
              return newMap;
            });
            
            toast.success('Image pasted successfully');
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };
  
  document.addEventListener('paste', handleGlobalPaste);
  return () => document.removeEventListener('paste', handleGlobalPaste);
}, [itemFields.length]);
// Confirmation Modal Component

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  data 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  data: ProformaInvoiceFormValues | null;
}) => {
  if (!data) return null;
  
  const totalItems = data.items?.length || 0;
  const subtotal = data.subtotal || 0;
  const vat = data.vat || 0;
  const total = data.total || 0;
  const vatApplied = data.vatApplied || false;
  const vatPercent = data.vatPercent || 15;

  // Build grouped materials summary
  const getMaterialsSummary = () => {
    const materialMap = new Map();
    
    data.items?.forEach((item) => {
      if (item.materials && item.materials.length > 0) {
        item.materials.forEach((material) => {
          if (!material.materialId) return;
          
          // Get material name from the materials list
          const materialObj = materials.find(m => m.id === material.materialId);
          const key = `${material.materialId}-${material.materialId}`;
          
          if (!materialMap.has(key)) {
            materialMap.set(key, {
              materialId: material.materialId,
              name: materialObj?.name || 'Unknown Material',
              color: materialObj?.color || '-',
              size: materialObj?.size || '-',
              totalQuantity: 0,
              totalAdditional: 0,
              notes: [],
              items: new Set()
            });
          }
          
          const entry = materialMap.get(key);
          entry.totalQuantity += (material.quantity || 1);
          if (material.additionalQuantity) {
            entry.totalAdditional += material.additionalQuantity;
          }
          if (material.note) {
            entry.notes.push(material.note);
          }
          
          const itemName = item.itemname || item.description || 'Unnamed Item';
          const itemSize = item.size || '';
          const itemIdentifier = itemSize ? `${itemName} (${itemSize})` : itemName;
          entry.items.add(itemIdentifier);
        });
      }
    });
    
    return Array.from(materialMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  };

  const materialsSummary = getMaterialsSummary();
  const hasMaterials = materialsSummary.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Proforma Invoice"
      description="Please review all items before creating the invoice"
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
        {/* Customer Info */}
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {data.store ? 'Stock Invoice' : 'Customer'}
          </p>
          <p className="text-sm font-medium">
            {data.store ? 'Store Invoice (No Customer)' : customers.find(c => c.id === data.customerId)?.name || 'No customer selected'}
          </p>
        </div>

        {/* Items Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Items ({totalItems})
            </p>
          </div>

          {/* Table Header - Sticky */}
          <div className="sticky top-0 z-10 grid grid-cols-12 gap-2 rounded-t-lg bg-muted/30 px-3 py-2 text-xs font-semibold text-muted-foreground">
            <div className="col-span-5">Item</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Unit Price</div>
            <div className="col-span-3 text-right">Amount</div>
          </div>

          {/* Items List with overflow */}
          <div className="space-y-2 max-h-[30vh] overflow-y-auto overflow-x-hidden pr-1">
            {data.items?.map((item, index) => {
              const selection = hierarchicalSelections.get(index);
              const categoryName = selection?.categoryId 
                ? categories.find(c => c.id === selection.categoryId)?.name 
                : 'No category';
              const itemName = item.itemname || item.description || `Item ${index + 1}`;
              
              return (
                <div 
                  key={index}
                  className={`grid grid-cols-12 gap-2 rounded-lg border p-3 transition-colors ${getItemColor(index)}`}
                >
                  <div className="col-span-5 min-w-0">
                    <p className="text-sm font-medium truncate">{itemName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {categoryName}
                      {item.size && ` • Size: ${item.size}`}
                    </p>
                    {item.additionalDescription && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.additionalDescription}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    <Badge variant="secondary" className="text-xs font-mono">
                      {item.quantity || 0}
                    </Badge>
                  </div>
                  <div className="col-span-2 flex items-center justify-end text-sm font-mono">
                    {formatCurrency(item.unitPrice || 0)}
                  </div>
                  <div className="col-span-3 flex items-center justify-end text-sm font-bold">
                    {formatCurrency(item.amount || 0)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Items count badge */}
          <div className="flex justify-end">
            <Badge variant="outline" className="text-xs">
              Total: {totalItems} item{totalItems > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Materials Summary Section */}
        {hasMaterials && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Package className="h-3.5 w-3.5" />
                Materials Summary ({materialsSummary.length} types)
              </p>
            </div>
            
            <div className="rounded-lg border bg-muted/10 overflow-hidden">
              {/* Material Table Header */}
              <div className="grid grid-cols-12 gap-2 bg-muted/30 px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="col-span-4">Material</div>
                <div className="col-span-2">Color</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-2 text-right">Total Qty</div>
              </div>
              
              {/* Material Items */}
              <div className="max-h-[20vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {materialsSummary.map((material, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 px-3 py-2 hover:bg-muted/20 transition-colors text-xs">
                    <div className="col-span-4 font-medium truncate">
                      {material.name}
                    </div>
                    <div className="col-span-2 text-muted-foreground">
                      {material.color !== '-' && (
                        <span className="flex items-center gap-1.5">
                          <span 
                            className="inline-block w-2.5 h-2.5 rounded-full border border-slate-200" 
                            style={{ backgroundColor: material.color.toLowerCase() }}
                          />
                          {material.color}
                        </span>
                      )}
                      {material.color === '-' && <span className="text-slate-400">-</span>}
                    </div>
                    <div className="col-span-2 font-mono text-muted-foreground">
                      {material.size}
                    </div>
                    <div className="col-span-2 text-right font-mono font-semibold">
                      {material.totalQuantity}
                      {material.totalAdditional > 0 && (
                        <span className="text-[10px] text-muted-foreground ml-1">
                          +{material.totalAdditional}
                        </span>
                      )}
                    </div>
               
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No materials warning */}
        {!hasMaterials && data.items?.some(item => item.materials && item.materials.length > 0) === false && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-center">
            <p className="text-xs text-amber-800 flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              No materials have been specified for any item.
            </p>
          </div>
        )}

        {/* Totals Summary - Sticky at bottom of scroll */}
        <div className="sticky bottom-0 rounded-lg border bg-card p-4 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
          </div>
          
          {vatApplied && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">VAT ({vatPercent}%)</span>
              <span className="font-mono font-medium">{formatCurrency(vat)}</span>
            </div>
          )}
          
          <div className="border-t pt-2 flex items-center justify-between text-base font-bold">
            <span>Total</span>
            <span className="font-mono text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Validation Status */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${
            data.customerId || data.store 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {data.customerId || data.store ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
            <span>{data.store ? 'Stock Invoice' : 'Customer Selected'}</span>
          </div>
          
          <div className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${
            data.items?.every(item => item.materials?.some(m => m.materialId)) 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            {data.items?.every(item => item.materials?.some(m => m.materialId)) ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            <span>All items have materials</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t sticky bottom-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 py-3 -mx-1 px-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Go Back
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="min-w-32"
          >
            {isLoading ? (
              <>Saving...</>
            ) : (
              <>Confirm & Create</>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
return (
    <>
    <div className="mx-auto w-full space-y-4">
      {/* Header */}
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
   <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4" onKeyDown={(e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
  }
}}>
          {/* Invoice Details */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4">
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

          {/* Line Items */}
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
                  Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-visible">
              <div className="space-y-4 overflow-visible">
                {itemFields.map((field, itemIndex) => {
                  const currentSelection = getCurrentSelection(itemIndex);
                  const availableItems = getFilteredItemsForRow(itemIndex);
                  const isSizeAutoFilled = sizeAutoFilled.get(itemIndex) || false;

                  return (
                  <div
  key={field.id}
  className={`rounded-xl border shadow-sm overflow-visible ${getItemColor(itemIndex)}`}
>
                      {/* Item Header Bar */}
<div className={`flex items-center justify-between border-b px-4 py-2.5 ${getHeaderColor(itemIndex)}`}>                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                            {itemIndex + 1}
                          </span>
                          {currentSelection.categoryId && (
                            <Badge variant="outline" className="text-[10px]">
                              Category: {categories.find(c => c.id === currentSelection.categoryId)?.name || 'Selected'}
                            </Badge>
                          )}
                          {currentSelection.selectedItem && (
                            <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Item: {safeString(currentSelection.selectedItem.name)}
                            </Badge>
                          )}
                          {isSizeAutoFilled && (
                            <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              Size Auto-filled
                            </Badge>
                          )}
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

                      <div className="space-y-4 p-4 overflow-visible">
                        {/* Product Selector - READ ONLY */}
                        <div className="overflow-visible">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">Product Selection</p>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-4 overflow-visible">
                            {/* Category - READ ONLY */}
                            <div className="overflow-visible">
                              <FormLabel className="text-xs flex items-center gap-1">
                                Category <span className="text-red-500">*</span>
                              </FormLabel>
                              <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground opacity-75 cursor-not-allowed">
                                {currentSelection.categoryId ? 
                                  categories.find(c => c.id === currentSelection.categoryId)?.name || 'Selected' 
                                  : 'No category selected'}
                              </div>
                            </div>

                            {/* Size - READ ONLY */}
                            <div className="overflow-visible">
                              <FormLabel className="text-xs">Size</FormLabel>
                              <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground opacity-75 cursor-not-allowed">
                                {currentSelection.sizeId ? 
                                  sizes.find(s => s.id === currentSelection.sizeId)?.name || 'Selected' 
                                  : 'No size selected'}
                              </div>
                            </div>

                            {/* Type - READ ONLY */}
                            <div className="overflow-visible">
                              <FormLabel className="text-xs">Type</FormLabel>
                              <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground opacity-75 cursor-not-allowed">
                                {currentSelection.typeId ? 
                                  types.find(t => t.id === currentSelection.typeId)?.name || 'Selected' 
                                  : 'No type selected'}
                              </div>
                            </div>

                            {/* Item - READ ONLY */}
                            <div className="overflow-visible">
                              <FormLabel className="text-xs">Product</FormLabel>
                              <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground opacity-75 cursor-not-allowed">
                                {currentSelection.selectedItem ? 
                                  safeString(currentSelection.selectedItem.name) 
                                  : 'No item selected'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pricing Row - Only Unit Price and Item Name editable */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                          <FormField
                            control={form.control}
                            name={`items.${itemIndex}.itemname`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs flex items-center gap-1">
                                  Item name
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="text"
                                    placeholder="Item name"
                                    {...field}
                                    className="border-blue-200 focus-visible:ring-blue-500"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Quantity - READ ONLY */}
                          <FormField
                            control={form.control}
                            name={`items.${itemIndex}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Qty</FormLabel>
                                <FormControl>
                                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground opacity-75 cursor-not-allowed">
                                    {field.value || 1}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Size - READ ONLY */}
                          <FormField
                            control={form.control}
                            name={`items.${itemIndex}.size`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  Size
                                  {isSizeAutoFilled && (
                                    <Badge variant="secondary" className="ml-1 text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                      Auto
                                    </Badge>
                                  )}
                                </FormLabel>
                                <FormControl>
                                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground opacity-75 cursor-not-allowed">
                                    {field.value || '-'}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Unit Price - EDITABLE */}
                          <Controller
                            control={form.control}
                            name={`items.${itemIndex}.unitPrice`}
                            defaultValue={0}
                            rules={{
                              required: 'Unit price is required',
                              validate: (value) => {
                                if (value <= 0) return 'Unit price must be greater than 0';
                                if (value > 999999999.99) return 'Unit price is too large (max: 999,999,999.99)';
                                return true;
                              }
                            }}
                            render={({ field, fieldState }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2 text-xs">
                                  Unit Price <span className="text-red-500">*</span>
                                  {priceAutoFilled.get(itemIndex) && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    >
                                      Auto
                                    </Badge>
                                  )}
                                </FormLabel>
                                <FormControl>
                                  <div>
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      step="0.01"
                                      min="0"
                                      max="999999999.99"
                                      placeholder="0.00"
                                      value={field.value ?? ''}
                                      onChange={(e) => {
                                        const value = e.target.value;

                                        if (value === '') {
                                          field.onChange(0);
                                          calculateItemAmount(itemIndex);
                                          return;
                                        }

                                        const numericValue = parseFloat(value);

                                        if (isNaN(numericValue)) return;

                                        if (numericValue > 999999999.99) {
                                          toast.error('Maximum unit price is 999,999,999.99');
                                          return;
                                        }

                                        field.onChange(numericValue);
                                        calculateItemAmount(itemIndex);

                                        if (priceAutoFilled.get(itemIndex)) {
                                          setPriceAutoFilled((prev) => {
                                            const newMap = new Map(prev);
                                            newMap.delete(itemIndex);
                                            return newMap;
                                          });
                                        }
                                      }}
                                      onBlur={() => {
                                        const currentValue = Number(field.value || 0);

                                        if (currentValue > 0) {
                                          field.onChange(Number(currentValue.toFixed(2)));
                                        }
                                      }}
                                      className={`h-10 font-mono ${
                                        priceAutoFilled.get(itemIndex)
                                          ? 'border-green-300 focus-visible:ring-green-500'
                                          : ''
                                      } ${
                                        fieldState.error
                                          ? 'border-red-500 focus-visible:ring-red-500'
                                          : ''
                                      }`}
                                    />

                                    <p className="mt-1 text-xs text-muted-foreground">
                                      Format:{' '}
                                      <span className="font-mono">
                                        {Number(field.value || 0).toLocaleString('en-US', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                      </span>
                                    </p>
                                  </div>
                                </FormControl>
                                <FormMessage />
                                {field.value > 999999 && (
                                  <p className="text-[10px] text-amber-500 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Large number: {formatDecimal(field.value, 2)}
                                  </p>
                                )}
                              </FormItem>
                            )}
                          />

                          {/* Amount - READ ONLY */}
                          <FormField
                            control={form.control}
                            name={`items.${itemIndex}.amount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Amount</FormLabel>
                                <FormControl>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={field.value ? formatDecimal(field.value, 2) : ""}
                                    readOnly
                                    className="bg-muted/50 font-semibold cursor-not-allowed"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Descriptions - Both Editable */}
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {/* Description - EDITABLE */}
                          <FormField
                            control={form.control}
                            name={`items.${itemIndex}.description`}
                            rules={{
                              required: 'Description is required',
                              validate: (value) => value.trim() !== '' || 'Description is required'
                            }}
                            render={({ field, fieldState }) => (
                              <FormItem>
                                <FormLabel className="text-xs flex items-center gap-1">
                                  Description <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Item description"
                                    {...field}
                                    rows={2}
                                    className={`${
                                      fieldState.error ? "border-red-500 focus-visible:ring-red-500" : ""
                                    }`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Additional Description - EDITABLE */}
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

                        {/* Materials - READ ONLY */}
                        <div className="mt-3 border-t pt-3 overflow-visible">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-semibold flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5 text-muted-foreground" />
                              Materials <span className="text-red-500">*</span>
                            </p>
                            <Badge variant="secondary" className="text-[10px]">
                              {form.watch(`items.${itemIndex}.materials`)?.length || 0} materials
                            </Badge>
                          </div>

                          {form.formState.errors?.items?.[itemIndex]?.materials && (
                            <p className="text-xs text-red-500 mb-2">
                              {form.formState.errors.items[itemIndex].materials.message as string}
                            </p>
                          )}

                          {(form.watch(`items.${itemIndex}.materials`)?.length || 0) > 0 ? (
                            <div className="space-y-3 overflow-visible">
                              {form.watch(`items.${itemIndex}.materials`)?.map((material, materialIndex) => {
                                const materialImage = material.materialId ? materialImageMap.get(material.materialId) : null;
                                
                                return (
                                  <div key={materialIndex} className="grid grid-cols-1 gap-3 rounded border p-3 md:grid-cols-12 overflow-visible bg-muted/10">
                                    <div className="md:col-span-4 overflow-visible">
                                      <FormLabel className="text-xs">Material</FormLabel>
                                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground opacity-75 cursor-not-allowed">
                                        {material.materialId ? (
                                          materials.find(m => m.id === material.materialId)?.name || 'Unknown Material'
                                        ) : (
                                          <span className="text-muted-foreground">No material selected</span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="md:col-span-2">
                                      <FormLabel className="text-xs">Quantity</FormLabel>
                                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground opacity-75 cursor-not-allowed">
                                        {material.quantity || 1}
                                      </div>
                                    </div>

                                    <div className="md:col-span-3">
                                      <FormLabel className="text-xs">Note</FormLabel>
                                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground opacity-75 cursor-not-allowed truncate">
                                        {material.note || <span className="text-muted-foreground">No note</span>}
                                      </div>
                                    </div>

                                    {/* Material Image Preview */}
                                    <div className="md:col-span-2 flex items-end justify-center">
                                      {material.materialId && materialImageMap.has(material.materialId) ? (
                                        <div 
                                          className="relative w-12 h-12 rounded-lg border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
                                          onClick={() => handleMaterialImageClick(materialImageMap.get(material.materialId)!)}
                                        >
                                          <img
                                            src={materialImageMap.get(material.materialId)!}
                                            alt="Material"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                            }}
                                          />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                            <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </div>
                                        </div>
                                      ) : material.materialId ? (
                                        <div className="w-12 h-12 rounded-lg border border-dashed bg-muted/20 flex items-center justify-center text-muted-foreground">
                                          <ImageIcon className="h-4 w-4" />
                                        </div>
                                      ) : (
                                        <div className="w-12 h-12 rounded-lg border border-dashed bg-muted/20 flex items-center justify-center text-muted-foreground">
                                          <ImageIcon className="h-4 w-4" />
                                        </div>
                                      )}
                                    </div>

                                 
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="rounded-lg border border-dashed py-4 text-center text-xs text-muted-foreground bg-muted/10">
                              No materials assigned
                            </p>
                          )}
                        </div>

                        {/* Images - READ ONLY */}
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
                          </div>

                          {/* Image grid display - READ ONLY */}
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
                                    
                                    {image.isExisting && (
                                      <div className="absolute top-1 left-1">
                                        <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                          Existing
                                        </Badge>
                                      </div>
                                    )}
                                    
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

          {/* Summary */}
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

          {/* Attachments - READ ONLY */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold">Attachments</CardTitle>
                {(existingAttachments.length + newAttachments.length) > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {existingAttachments.length + newAttachments.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              {/* Existing Attachments - READ ONLY */}
              {existingAttachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Attachments</p>
                  {existingAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5 hover:bg-muted/20 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {attachment.fileUrl.split('/').pop() || 'Attachment'}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-primary shrink-0"
                          onClick={() => window.open(attachment.fileUrl, '_blank')}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-slate-500" />
                Readiness Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 text-xs">
              
              <div className={`flex items-center justify-between p-2 rounded-lg border ${hasCustomer ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                <span className="font-medium">{isStore ? 'Stock Invoice Selected' : 'Customer Account Assigned'}</span>
                {hasCustomer ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </div>

              <div className={`flex items-center justify-between p-2 rounded-lg border ${hasItems ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                <span className="font-medium">{watchedItems.length} Product Line(s) Added</span>
                {hasItems ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </div>

              <div className={`flex items-center justify-between p-2 rounded-lg border ${allItemsHaveCategory ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                <span className="font-medium">Categories Selected</span>
                {allItemsHaveCategory ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              </div>

              <div className={`flex items-center justify-between p-2 rounded-lg border ${allItemsHaveMaterials ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                <span className="font-medium">Materials Specified</span>
                {allItemsHaveMaterials ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              </div>

            </CardContent>
          </Card>

          {/* Submit */}
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
              className="min-w-30"
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
      title='Create New Customer'
      description={''}
    >
      <CreateCustomerModal
        closeModal={() => setShowCustomerModal(false)}
        onSuccess={handleCustomerCreated}
      />
    </Modal>
    {/* Material Image Modal */}
    <Modal
      isOpen={showMaterialImageModal}
      onClose={() => setShowMaterialImageModal(false)}
      title="Material Image"
      description="View the selected material image"
    >
      <div className="flex items-center justify-center p-4">
        {selectedMaterialImage && (
          <div className="relative max-w-2xl max-h-[80vh] rounded-lg overflow-hidden">
            <img
              src={selectedMaterialImage}
              alt="Material"
              className="w-full h-auto object-contain max-h-[70vh]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-image.png';
              }}
            />
          </div>
        )}
      </div>
    </Modal>
    {/* Confirmation Modal */}
    <ConfirmationModal
      isOpen={showConfirmationModal}
      onClose={() => setShowConfirmationModal(false)}
      onConfirm={confirmAndSubmit}
      data={confirmationData}
    />
    </>
  );
}