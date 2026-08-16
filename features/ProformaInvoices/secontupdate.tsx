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
import { useForm, useFieldArray } from 'react-hook-form';
import { updateProformaInvoiceseco } from '@/service/ProformaInvoice';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { IProformaInvoice, IProformaInvoiceItem, IProformaItemMaterial } from '@/models/ProformaInvoice';
import { Textarea } from '@/components/ui/textarea';
import Select from 'react-select';
import { ArrowLeft, Upload, Download, Image as ImageIcon, Package, Eye } from 'lucide-react';
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
    if (value.name && typeof value.name === 'string') return value.name;
    if (value.id && typeof value.id === 'string') return value.id;
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
  const [attachments, setAttachments] = useState<File[]>([]);
  const [itemImages, setItemImages] = useState<Map<number, ImageFileWithPreview[]>>(new Map());
  const [isFetchingItems, setIsFetchingItems] = useState(false);
  const [priceAutoFilled, setPriceAutoFilled] = useState<Map<number, boolean>>(new Map());
  const [isStore, setIsStore] = useState<boolean>(initialData?.store || false);
  const [selectedItemIds, setSelectedItemIds] = useState<Map<number, string>>(new Map());
  const [sizeAutoFilled, setSizeAutoFilled] = useState<Map<number, boolean>>(new Map());

  const [categories, setCategories] = useState<IProductCategory[]>([]);
  const [sizes, setSizes] = useState<ISize[]>([]);
  const [types, setTypes] = useState<IProductType[]>([]);
  const [filteredItems, setFilteredItems] = useState<Map<number, any[]>>(new Map());
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const [selectedMaterialImage, setSelectedMaterialImage] = useState<string | null>(null);
  const [showMaterialImageModal, setShowMaterialImageModal] = useState(false);
  const [materialImageMap, setMaterialImageMap] = useState<Map<string, string>>(new Map());

  const [hierarchicalSelections, setHierarchicalSelections] = useState<Map<number, HierarchicalSelection>>(new Map());
  
  // Check if we're in edit mode
  const isEditMode = !!initialData?.id;
  
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
        const description = safeString(item.description);
        const size = safeString(item.size);
        
        return {
          id: item.id || '',
          invoiceId: item.invoiceId || '',
          itemId: item.itemId || '',
          categoryId: item.categoryId || '',
          description: description,
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
      }) || [],
      attachments: []
    }),
    [initialData]
  );

  const form = useForm<ProformaInvoiceFormValues>({
    defaultValues,
    mode: 'onChange',
  });

  const { fields: itemFields } = useFieldArray({
    control: form.control,
    name: 'items'
  });

  const getMaterialImage = useCallback(async (materialId: string) => {
    if (!materialId) return;
    
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

  useEffect(() => {
    if (initialData?.items && initialData.items.length > 0) {
      const newItemImages = new Map<number, ImageFileWithPreview[]>();
      
      initialData.items.forEach((item, index) => {
        if (item.images && item.images.length > 0) {
          const imagePreviews = item.images
            .map((img: any) => {
              const normalizedUrl = normalizeImagePath(img.imageUrl);
              if (!normalizedUrl) {
                return null;
              }
              return {
                preview: normalizedUrl,
                isExisting: true,
                existingUrl: img.imageUrl,
                id: img.id
              } as ImageFileWithPreview;
            })
            .filter((img): img is ImageFileWithPreview => img !== null);
          
          if (imagePreviews.length > 0) {
            newItemImages.set(index, imagePreviews);
          }
        }
      });
      
      setItemImages(newItemImages);
    }
  }, [initialData]);

  useEffect(() => {
    if (initialData?.items && initialData.items.length > 0 && items.length > 0) {
      const newHierarchicalSelections = new Map<number, HierarchicalSelection>();
      
      initialData.items.forEach((item, index) => {
        let fullItem = item.item;
        
        if (!fullItem && item.itemId) {
          fullItem = items.find(i => i.id === item.itemId);
        }
        
        if (fullItem) {
          newHierarchicalSelections.set(index, {
            categoryId: fullItem.categoryId || '',
            sizeId: fullItem.sizeId || '',
            typeId: fullItem.typeId || '',
            selectedItem: fullItem
          });
          
          setSelectedItemIds(prev => {
            const newMap = new Map(prev);
            newMap.set(index, fullItem.id);
            return newMap;
          });
          
          if (fullItem.price && fullItem.price > 0) {
            setPriceAutoFilled(prev => {
              const newMap = new Map(prev);
              newMap.set(index, true);
              return newMap;
            });
          }

          if (fullItem.size) {
            setSizeAutoFilled(prev => {
              const newMap = new Map(prev);
              newMap.set(index, true);
              return newMap;
            });
          }
        }
      });
      
      setHierarchicalSelections(newHierarchicalSelections);
    }
  }, [initialData, items, form]);

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

  const fetchMultipleMaterialImages = useCallback(async (materialIds: string[]) => {
    if (!materialIds.length) return;
    
    const newIds = materialIds.filter(id => !materialImageMap.has(id));
    if (!newIds.length) return;
    
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
      ...materials.map((material) => {
        const details: string[] = [];

        if (material.color?.trim()) {
          details.push(material.color);
        }

        if (material.size?.trim()) {
          details.push(material.size);
        }

        if (material.plainMDF) {
          details.push('Plain MDF');
        } else if (material.laminatedMDF) {
          details.push('Laminated MDF');
        } else if (material.wood) {
          details.push('Wood');
        } else if (material.metal) {
          details.push('Metal');
        } else if (material.accessory) {
          details.push('Accessory');
        } else if (material.other) {
          details.push('Other');
        }

        return {
          value: material.id,
          label: details.length
            ? `${material.name} (${details.join(' - ')})`
            : material.name,
        };
      }),
    ],
    [materials]
  );

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

  const handleCategoryChange = (itemIndex: number, categoryId: string) => {
    if (isEditMode) {
      toast.info('Category cannot be changed in edit mode');
      return;
    }
    
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

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
        sizeId: '',
        typeId: '',
        selectedItem: null
      });
      return newMap;
    });

    form.setValue(`items.${itemIndex}.description`, '');
    form.setValue(`items.${itemIndex}.unitPrice`, 0);
    form.setValue(`items.${itemIndex}.size`, '');
    form.setValue(`items.${itemIndex}.itemId`, '');
    
    setSelectedItemIds(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemIndex);
      return newMap;
    });
    
    setPriceAutoFilled(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemIndex);
      return newMap;
    });

    setSizeAutoFilled(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemIndex);
      return newMap;
    });
  };

  const handleSizeChange = (itemIndex: number, sizeId: string) => {
    if (isEditMode) {
      toast.info('Size cannot be changed in edit mode');
      return;
    }
    
    if (sizeAutoFilled.get(itemIndex)) {
      toast.info('Size is auto-filled from selected item. Clear the item to change size.');
      return;
    }

    const size = sizes.find(s => s.id === sizeId);
    if (!size) return;

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
        typeId: '',
        selectedItem: null
      });
      return newMap;
    });

    form.setValue(`items.${itemIndex}.size`, size.name);
    form.setValue(`items.${itemIndex}.description`, '');
    form.setValue(`items.${itemIndex}.unitPrice`, 0);
    form.setValue(`items.${itemIndex}.itemId`, '');
    
    setSelectedItemIds(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemIndex);
      return newMap;
    });
    
    setPriceAutoFilled(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemIndex);
      return newMap;
    });

    setSizeAutoFilled(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemIndex);
      return newMap;
    });
  };

  const handleTypeChange = (itemIndex: number, typeId: string) => {
    if (isEditMode) {
      toast.info('Type cannot be changed in edit mode');
      return;
    }
    
    const type = types.find(t => t.id === typeId);
    if (!type) return;

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
        selectedItem: null
      });
      return newMap;
    });

    form.setValue(`items.${itemIndex}.description`, '');
    form.setValue(`items.${itemIndex}.unitPrice`, 0);
    form.setValue(`items.${itemIndex}.itemId`, '');
    
    setSelectedItemIds(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemIndex);
      return newMap;
    });
    
    setPriceAutoFilled(prev => {
      const newMap = new Map(prev);
      newMap.delete(itemIndex);
      return newMap;
    });
  };

  const handleItemSelect = (itemIndex: number, selectedItem: any) => {
    if (isEditMode) {
      toast.info('Product selection cannot be changed in edit mode');
      return;
    }
    
    const currentSelection = getCurrentSelection(itemIndex);
    
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
    const itemName = safeString(selectedItem.name);
    form.setValue(`items.${itemIndex}.description`, itemName);
    
    if (selectedItem.size) {
      const sizeValue = safeString(selectedItem.size);
      form.setValue(`items.${itemIndex}.size`, sizeValue);
      setSizeAutoFilled(prev => {
        const newMap = new Map(prev);
        newMap.set(itemIndex, true);
        return newMap;
      });
      toast.success(`Size "${sizeValue}" auto-filled from item`);
    }
    
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
    
    if (selectedItem.itemMaterials && selectedItem.itemMaterials.length > 0) {
      const materialIds = selectedItem.itemMaterials.map((im: any) => im.materialId);
      fetchMultipleMaterialImages(materialIds);
      
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
    if (isEditMode) {
      toast.info('Images cannot be added in edit mode');
      return;
    }
    
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
    if (isEditMode) {
      toast.info('Images cannot be removed in edit mode');
      return;
    }
    
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

  const addMaterialToItem = (itemIndex: number) => {
    if (isEditMode) {
      toast.info('Materials cannot be added in edit mode');
      return;
    }
    
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
    if (isEditMode) {
      toast.info('Materials cannot be removed in edit mode');
      return;
    }
    
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
    if (isEditMode) {
      toast.info('Materials cannot be modified in edit mode');
      return;
    }
    
    const currentItems = form.getValues('items');
    const item = currentItems[itemIndex];
    
    if (item && item.materials) {
      const updatedMaterials = [...item.materials];
      updatedMaterials[materialIndex] = {
        ...updatedMaterials[materialIndex],
        [field]: value
      };
      
      form.setValue(`items.${itemIndex}.materials`, updatedMaterials);
      
      if (field === 'materialId' && value) {
        getMaterialImage(value);
      }
    }
  };

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

  // Update the onSubmit function - only update, no create
  const onSubmit = async (data: ProformaInvoiceFormValues) => {
    if (!initialData?.id) {
      toast.error('Cannot create new invoice. This form is for editing only.');
      return;
    }
    
    try {
      setIsLoading(true);

      const formData = new FormData();
      
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

      const itemsWithData = data.items.map((item, index) => {
        const itemImagesData = itemImages.get(index) || [];
        const selectedItemId = selectedItemIds.get(index);
        const selection = hierarchicalSelections.get(index);
        
        const categoryId = selection?.categoryId || '';
        
        const existingImages = itemImagesData
          .filter(img => img.isExisting && img.existingUrl)
          .map(img => ({
            id: img.id || '',
            itemId: item.id || '',
            imageUrl: img.existingUrl!,
            createdAt: new Date().toISOString()
          }));
        
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

      // Only update, never create
      await updateProformaInvoiceseco(initialData.id, formData);
      toast.success('Proforma Invoice updated successfully');
      
      router.push('/dashboard/ProformaInvoice/my');
      router.refresh();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error?.message || 'Error updating proforma invoice');
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

  useEffect(() => {
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

  return (
    <>
    <div className="mx-auto w-full space-y-4">
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
              {isEditMode ? 'Update the invoice details below' : 'View invoice details'}
            </p>
          
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" onKeyDown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    }} >
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
                    if (isEditMode) {
                      toast.info('Store status cannot be changed in edit mode');
                      return;
                    }
                    setIsStore(checked as boolean);
                    if (checked) {
                      form.setValue('customerId', '');
                    }
                  }}
                  disabled={isEditMode}
                />
                <label
                  htmlFor="store-checkbox"
                  className={`cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isEditMode ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                          onCheckedChange={(checked) => {
                            if (isEditMode) {
                              toast.info('VAT setting cannot be changed in edit mode');
                              return;
                            }
                            handleVatAppliedChange(checked as boolean);
                          }}
                          disabled={isEditMode}
                        />
                      </FormControl>
                      <div className="space-y-0.5 leading-none">
                        <FormLabel className={`text-sm ${isEditMode ? 'opacity-70' : ''}`}>Apply 15% VAT</FormLabel>
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
                          onChange={(e) => {
                            if (isEditMode) {
                              toast.info('Date cannot be changed in edit mode');
                              return;
                            }
                            field.onChange(e.target.value);
                          }}
                          disabled={isEditMode}
                          className={isEditMode ? 'opacity-70' : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold">Line Items</CardTitle>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {itemFields.length}
                  </Badge>
                </div>
                {isEditMode && (
                  <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    Edit Mode
                  </Badge>
                )}
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
                      className={`rounded-xl border bg-card shadow-sm overflow-visible ${isEditMode ? 'border-blue-200 dark:border-blue-800' : ''}`}
                    >
                      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                            {itemIndex + 1}
                          </span>
                          {isEditMode && (
                            <Badge variant="secondary" className="text-[10px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              Editable Fields
                            </Badge>
                          )}
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
                        </div>
                      </div>

                      <div className="space-y-4 p-4 overflow-visible">
                        <div className="overflow-visible">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">Product Selection (Read-Only in Edit Mode)</p>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-4 overflow-visible">
                            <div className="overflow-visible">
                              <FormLabel className="text-xs flex items-center gap-1">
                                Category <span className="text-red-500">*</span>
                              </FormLabel>
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
                                styles={getSelectStyles()}
                                isClearable
                                isDisabled={true}
                                menuPortalTarget={document.body}
                              />
                            </div>

                            <div className="overflow-visible">
                              <FormLabel className="text-xs">Size</FormLabel>
                              <Select
                                options={sizes
                                  .filter(size => !currentSelection.categoryId || size.categoryId === currentSelection.categoryId)
                                  .map(size => ({
                                    value: size.id,
                                    label: size.name
                                  }))}
                                value={sizes.find(s => s.id === currentSelection.sizeId) ? {
                                  value: currentSelection.sizeId,
                                  label: sizes.find(s => s.id === currentSelection.sizeId)?.name || ''
                                } : null}
                                onChange={(option: any) => handleSizeChange(itemIndex, option?.value || '')}
                                placeholder={currentSelection.categoryId ? "Select size (optional)" : "Select category first"}
                                isSearchable
                                isDisabled={true}
                                styles={getSelectStyles()}
                                isClearable
                                menuPortalTarget={document.body}
                              />
                            </div>

                            <div className="overflow-visible">
                              <FormLabel className="text-xs">Type</FormLabel>
                              <Select
                                options={types
                                  .filter(type => !currentSelection.sizeId || type.sizeId === currentSelection.sizeId)
                                  .map(type => ({
                                    value: type.id,
                                    label: type.name
                                  }))}
                                value={types.find(t => t.id === currentSelection.typeId) ? {
                                  value: currentSelection.typeId,
                                  label: types.find(t => t.id === currentSelection.typeId)?.name || ''
                                } : null}
                                onChange={(option: any) => handleTypeChange(itemIndex, option?.value || '')}
                                placeholder={currentSelection.sizeId ? "Select type (optional)" : "Select size first"}
                                isSearchable
                                isDisabled={true}
                                styles={getSelectStyles()}
                                isClearable
                                menuPortalTarget={document.body}
                              />
                            </div>

                            <div className="overflow-visible">
                              <FormLabel className="text-xs">Product</FormLabel>
                              <Select
                                options={availableItems.map((item: any) => ({
                                  value: item.id,
                                  label: `${item.name}${item.color ? ` - ${item.color}` : ''}`,
                                  item: item
                                }))}
                                value={availableItems.find((item: any) => item.id === currentSelection.selectedItem?.id) ? {
                                  value: currentSelection.selectedItem?.id || '',
                                  label: safeString(currentSelection.selectedItem?.name)
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
                                      ? "No items available" 
                                      : "Select item (optional)"
                                }
                                isSearchable
                                isLoading={isFetchingItems}
                                isDisabled={true}
                                styles={getSelectStyles()}
                                noOptionsMessage={() => 
                                  currentSelection.categoryId 
                                    ? "No items available for these filters" 
                                    : "Select a category first"
                                }
                                isClearable
                                menuPortalTarget={document.body}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
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
                                      if (isEditMode) {
                                        toast.info('Quantity cannot be changed in edit mode');
                                        return;
                                      }
                                      field.onChange(parseInt(e.target.value) || 1);
                                      calculateItemAmount(itemIndex);
                                    }}
                                    disabled={true}
                                    className="opacity-70 bg-muted"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${itemIndex}.size`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs flex items-center gap-1">
                                  Size
                                  {isEditMode && (
                                    <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                      Editable
                                    </Badge>
                                  )}
                                  {isSizeAutoFilled && !isEditMode && (
                                    <Badge variant="secondary" className="ml-1 text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                      Locked
                                    </Badge>
                                  )}
                                </FormLabel>
                                <FormControl>
                                  {!isEditMode && isSizeAutoFilled ? (
                                    <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground opacity-75 cursor-not-allowed">
                                      {safeString(field.value) || 'Auto-filled'}
                                    </div>
                                  ) : (
                                    <Input
                                      type="text"
                                      placeholder={isEditMode ? "Edit size" : "Enter size"}
                                      {...field}
                                      value={safeString(field.value)}
                                      onChange={(e) => {
                                        if (isEditMode) {
                                          field.onChange(e.target.value);
                                          // Recalculate when size changes (though size doesn't affect amount)
                                        } else {
                                          field.onChange(e.target.value);
                                        }
                                      }}
                                      className={`${isEditMode ? 'border-green-300 focus-visible:ring-green-500' : ''} ${field.value ? "border-blue-300 focus-visible:ring-blue-500" : ""}`}
                                      disabled={!isEditMode && isSizeAutoFilled}
                                    />
                                  )}
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${itemIndex}.unitPrice`}
                            rules={{
                              required: 'Unit price is required',
                              validate: (value) => value > 0 || 'Unit price must be greater than 0'
                            }}
                            render={({ field, fieldState }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2 text-xs">
                                  Unit Price <span className="text-red-500">*</span>
                                  {isEditMode && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    >
                                      Editable
                                    </Badge>
                                  )}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={
                                      field.value
                                        ? Number(field.value).toLocaleString("en-US", {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 2,
                                          })
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/,/g, "");
                                      const value = parseFloat(raw) || 0;
                                      field.onChange(value);
                                      calculateItemAmount(itemIndex);
                                      if (priceAutoFilled.get(itemIndex)) {
                                        setPriceAutoFilled((prev) => {
                                          const newMap = new Map(prev);
                                          newMap.delete(itemIndex);
                                          return newMap;
                                        });
                                      }
                                    }}
                                    className={`${
                                      isEditMode ? 'border-yellow-300 focus-visible:ring-yellow-500' : ''
                                    } ${
                                      priceAutoFilled.get(itemIndex)
                                        ? "border-green-300 focus-visible:ring-green-500"
                                        : ""
                                    } ${
                                      fieldState.error ? "border-red-500 focus-visible:ring-red-500" : ""
                                    }`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

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

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                                  {isEditMode && (
                                    <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                      Editable
                                    </Badge>
                                  )}
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Item description"
                                    {...field}
                                    rows={2}
                                    className={`${
                                      fieldState.error ? "border-red-500 focus-visible:ring-red-500" : ""
                                    } ${isEditMode ? 'border-green-300 focus-visible:ring-green-500' : ''}`}
                                    onChange={(e) => {
                                      field.onChange(e);
                                    }}
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
                                <FormLabel className="text-xs flex items-center gap-1">
                                  Additional Description
                                  {isEditMode && (
                                    <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                      Editable
                                    </Badge>
                                  )}
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Extra details about the item"
                                    {...field}
                                    rows={2}
                                    className={isEditMode ? 'border-green-300 focus-visible:ring-green-500' : ''}
                                    onChange={(e) => {
                                      field.onChange(e);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Materials - Read Only in Edit Mode */}
                        <div className="mt-3 border-t pt-3 overflow-visible">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-semibold flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5 text-muted-foreground" />
                              Materials
                              {isEditMode && (
                                <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                  Read Only
                                </Badge>
                              )}
                            </p>
                          </div>

                          {(form.watch(`items.${itemIndex}.materials`)?.length || 0) > 0 ? (
                            <div className="space-y-3 overflow-visible">
                              {form.watch(`items.${itemIndex}.materials`)?.map((material, materialIndex) => {
                                const materialImage = material.materialId ? materialImageMap.get(material.materialId) : null;
                                
                                return (
                                  <div key={materialIndex} className={`grid grid-cols-1 gap-3 rounded border p-3 md:grid-cols-12 overflow-visible ${isEditMode ? 'bg-muted/20 border-blue-200 dark:border-blue-800' : ''}`}>
                                    <div className="md:col-span-4 overflow-visible">
                                      <FormLabel className="text-xs">Material</FormLabel>
                                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground opacity-75 cursor-not-allowed">
                                        {materials.find(m => m.id === material.materialId)?.name || 'Unknown material'}
                                      </div>
                                    </div>

                                    <div className="md:col-span-2">
                                      <FormLabel className="text-xs">Quantity</FormLabel>
                                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground opacity-75 cursor-not-allowed">
                                        {material.quantity}
                                      </div>
                                    </div>

                                    <div className="md:col-span-3">
                                      <FormLabel className="text-xs">Note</FormLabel>
                                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground opacity-75 cursor-not-allowed">
                                        {material.note || 'No note'}
                                      </div>
                                    </div>

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
                                        <div className="w-12 h-12 rounded-lg border border-dashed bg-muted/20 flex items-center justify-center text-muted-foreground animate-pulse">
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
                            <p className="rounded-lg border border-dashed py-4 text-center text-xs text-muted-foreground">
                              No materials
                            </p>
                          )}
                        </div>

                        {/* Images - Read Only in Edit Mode */}
                        <div className="mt-3 border-t pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold flex items-center gap-1.5">
                              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              Images
                              {isEditMode && (
                                <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                  Read Only
                                </Badge>
                              )}
                              {(itemImages.get(itemIndex)?.length || 0) > 0 && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1">
                                  {itemImages.get(itemIndex)?.length}
                                </Badge>
                              )}
                            </p>
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

     

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/ProformaInvoice')}
            >
              {isEditMode ? 'Back' : 'Cancel'}
            </Button>
            {isEditMode && (
              <Button
                type="submit"
                disabled={isLoading}
                size="sm"
                className="min-w-30 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {isLoading ? 'Saving...' : 'Update Invoice'}
              </Button>
            )}
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
    </>
  );
}