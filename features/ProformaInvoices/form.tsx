/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Upload, 
  Download, 
  Image as ImageIcon, 
  Package, 
  Eye, 
  RefreshCw, 
  X,
  FileText,
  DollarSign,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  User,
  Calendar,
  Percent,
  Store,
  Layers,
  Wrench,
  Info,
  ShieldCheck,
  Check,
  UserPlus,
  Paperclip,
  CheckSquare,
  AlertCircle
} from 'lucide-react';
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

  // Hierarchical data states
  const [categories, setCategories] = useState<IProductCategory[]>([]);
  const [sizes, setSizes] = useState<ISize[]>([]);
  const [types, setTypes] = useState<IProductType[]>([]);
  const [filteredItems, setFilteredItems] = useState<Map<number, any[]>>(new Map());
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const [selectedMaterialImage, setSelectedMaterialImage] = useState<string | null>(null);
  const [showMaterialImageModal, setShowMaterialImageModal] = useState(false);
  const [materialImageMap, setMaterialImageMap] = useState<Map<string, string>>(new Map());

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
            materialIssues: material.materialIssues || [],
          })) || [],
          images: item.images || []
        };
      }) || [
        {
          id: '',
          invoiceId: '',
          itemId: '',
          categoryId: '',
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
    defaultValues,
    mode: 'onChange',
    resolver: async (data) => {
      const errors: any = {};
      
      if (data.items && data.items.length > 0) {
        data.items.forEach((item, index) => {
          const selection = hierarchicalSelections.get(index);
          const categoryId = selection?.categoryId || '';
          
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
          
          const materialsList = item.materials || [];
          const hasValidMaterial = materialsList.some(m => m.materialId && m.materialId !== '');
          
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

  // Initialize item images from initial data
  useEffect(() => {
    if (initialData?.items && initialData.items.length > 0) {
      const newItemImages = new Map<number, ImageFileWithPreview[]>();
      
      initialData.items.forEach((item, index) => {
        if (item.images && item.images.length > 0) {
          const imagePreviews = item.images
            .map((img: any) => {
              const normalizedUrl = normalizeImagePath(img.imageUrl);
              if (!normalizedUrl) return null;
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

  // Initialize hierarchical selections from existing items when editing
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
          
          const currentMaterials = form.getValues(`items.${index}.materials`);
          if (!currentMaterials?.length) {
            const materialsList = Array.isArray(fullItem.itemMaterials)
              ? fullItem.itemMaterials.map((im: any) => ({
                  id: '',
                  itemId: item.id || '',
                  materialId: im.materialId,
                  quantity: im.quantity ?? 1,
                  note: im.note ?? '',
                  materialIssues: [],
                }))
              : [];

            if (materialsList.length > 0) {
              form.setValue(`items.${index}.materials`, materialsList);
            }
          }
        }
      });
      
      setHierarchicalSelections(newHierarchicalSelections);
    }
  }, [initialData, items, form]);

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

  // Material options
  const materialOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: 'Select a material' },
      ...materials.map((material) => {
        const details: string[] = [];

        if (material.color?.trim()) details.push(material.color);
        if (material.size?.trim()) details.push(material.size);

        if (material.plainMDF) details.push('Plain MDF');
        else if (material.laminatedMDF) details.push('Laminated MDF');
        else if (material.wood) details.push('Wood');
        else if (material.metal) details.push('Metal');
        else if (material.accessory) details.push('Accessory');
        else if (material.other) details.push('Other');

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

  const handleCategoryChange = (itemIndex: number, categoryId: string) => {
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
  };

  const handleTypeChange = (itemIndex: number, typeId: string) => {
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
  };

  const handleItemSelect = (itemIndex: number, item: any) => {
    if (!item) return;

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
        selectedItem: item
      });
      return newMap;
    });

    setSelectedItemIds(prev => {
      const newMap = new Map(prev);
      newMap.set(itemIndex, item.id);
      return newMap;
    });

    form.setValue(`items.${itemIndex}.description`, item.name);
    form.setValue(`items.${itemIndex}.itemId`, item.id);
    
    if (item.size) {
      form.setValue(`items.${itemIndex}.size`, item.size);
      setSizeAutoFilled(prev => {
        const newMap = new Map(prev);
        newMap.set(itemIndex, true);
        return newMap;
      });
    }

    if (item.price && item.price > 0) {
      form.setValue(`items.${itemIndex}.unitPrice`, item.price);
      setPriceAutoFilled(prev => {
        const newMap = new Map(prev);
        newMap.set(itemIndex, true);
        return newMap;
      });
      calculateItemAmount(itemIndex);
    }

    if (item.itemMaterials && item.itemMaterials.length > 0) {
      const materialsList = item.itemMaterials.map((im: any) => ({
        id: '',
        itemId: item.id,
        materialId: im.materialId,
        quantity: im.quantity || 1,
        note: im.note || '',
        materialIssues: [],
      }));
      form.setValue(`items.${itemIndex}.materials`, materialsList);

      const materialIds = materialsList.map((m: any) => m.materialId).filter(Boolean);
      fetchMultipleMaterialImages(materialIds);
    }
  };

  const calculateItemAmount = (index: number) => {
    const item = form.getValues(`items.${index}`);
    if (item) {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const amount = quantity * unitPrice;
      form.setValue(`items.${index}.amount`, amount);
      calculateTotals();
    }
  };

  const calculateTotals = () => {
    const itemsList = form.getValues('items') || [];
    const subtotal = itemsList.reduce((sum, item) => sum + (item.amount || 0), 0);
    form.setValue('subtotal', subtotal);

    const vatApplied = form.getValues('vatApplied');
    const vat = vatApplied ? subtotal * 0.15 : 0;
    form.setValue('vat', vat);
    form.setValue('total', subtotal + vat);
  };

  const handleVatAppliedChange = (checked: boolean) => {
    form.setValue('vatApplied', checked);
    calculateTotals();
  };

  const addItem = () => {
    appendItem({
      id: '',
      invoiceId: '',
      itemId: '',
      categoryId: '',
      description: '',
      size: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      additionalDescription: '',
      materials: [],
      images: []
    });
  };

  const addMaterialToItem = (itemIndex: number) => {
    const currentMaterials = form.getValues(`items.${itemIndex}.materials`) || [];
    form.setValue(`items.${itemIndex}.materials`, [
      ...currentMaterials,
      {
        id: '',
        itemId: '',
        materialId: '',
        quantity: 1,
        note: '',
        materialIssues: [],
      }
    ]);
  };

  const updateMaterialInItem = (itemIndex: number, materialIndex: number, field: string, value: any) => {
    form.setValue(`items.${itemIndex}.materials.${materialIndex}.${field}` as any, value);
    
    if (field === 'materialId' && value) {
      fetchMultipleMaterialImages([value]);
    }
  };

  const removeMaterialFromItem = (itemIndex: number, materialIndex: number) => {
    const currentMaterials = form.getValues(`items.${itemIndex}.materials`) || [];
    form.setValue(
      `items.${itemIndex}.materials`,
      currentMaterials.filter((_, idx) => idx !== materialIndex)
    );
  };

  const handleAddItemImage = (itemIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: ImageFileWithPreview[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      isExisting: false
    }));

    setItemImages(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemIndex) || [];
      newMap.set(itemIndex, [...existing, ...newImages]);
      return newMap;
    });

    e.target.value = '';
  };

  const removeItemImage = (itemIndex: number, imageIndex: number) => {
    setItemImages(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemIndex) || [];
      const imageToRemove = existing[imageIndex];
      
      if (!imageToRemove.isExisting && imageToRemove.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      
      newMap.set(itemIndex, existing.filter((_, idx) => idx !== imageIndex));
      return newMap;
    });
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
      e.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleMaterialImageClick = (imageUrl: string) => {
    setSelectedMaterialImage(imageUrl);
    setShowMaterialImageModal(true);
  };

  const onSubmit = async (data: ProformaInvoiceFormValues) => {
    if (!initialData?.id) {
      const confirmed = window.confirm("Are you sure you want to create this Proforma Invoice?");
      if (!confirmed) return;
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

      if (initialData?.id) {
        await updateProformaInvoice(initialData.id, formData);
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
      '&:active': { backgroundColor: '#4b5563' },
    }),
    singleValue: (base: any) => ({ ...base, color: '#f9fafb' }),
    input: (base: any) => ({ ...base, color: '#f9fafb' }),
    placeholder: (base: any) => ({ ...base, color: '#9ca3af' }),
    dropdownIndicator: (base: any) => ({ ...base, color: '#9ca3af' }),
    indicatorSeparator: (base: any) => ({ ...base, backgroundColor: '#374151' }),
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
    control: (base: any) => ({ ...base, zIndex: 1 }),
    option: (base: any, state: any) => ({
      ...base,
      cursor: 'pointer',
      '&:active': { backgroundColor: '#e5e7eb' },
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

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 'ETB 0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount);
  };

  const selectedCustomerId = form.watch('customerId');
  const watchedItems = form.watch('items') || [];
  const watchedSubtotal = form.watch('subtotal') || 0;
  const watchedVat = form.watch('vat') || 0;
  const watchedTotal = form.watch('total') || 0;

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

  return (
    <>
      <Form {...form}>
        <form 
          id="proforma-form"
          onSubmit={form.handleSubmit(onSubmit)} 
          className="space-y-6" 
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
        >
          {/* Sticky Navigation & Primary Header Action Bar */}
          <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md border-b border-slate-200 py-4 px-4 md:px-8 mb-6 rounded-b-xl shadow-xs">
            <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-xs"
                  onClick={() => router.push('/dashboard/ProformaInvoice')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
                    <span className="cursor-pointer hover:text-slate-800" onClick={() => router.push('/dashboard/ProformaInvoice')}>Proforma Invoices</span>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800">{initialData ? 'Edit Invoice' : 'Create New Invoice'}</span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                    {pageTitle}
                  </h1>
                </div>
              </div>

              {/* Action Buttons Group Pinned at Top Header */}
              <div className="flex items-center space-x-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={refreshItems}
                  disabled={isFetchingItems}
                  className="h-9 rounded-lg border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-xs"
                >
                  <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isFetchingItems ? 'animate-spin' : ''}`} />
                  Refresh Catalog
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/ProformaInvoice')}
                  className="h-9 rounded-lg border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isLoading}
                  size="sm"
                  className="h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 shadow-xs"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving...
                    </span>
                  ) : (
                    <span>{initialData ? 'Update Invoice' : 'Create Invoice'}</span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* 2-Column Responsive Workspace Grid */}
          <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start px-4 md:px-8 pb-12">
            
            {/* Left Primary Workspace (8 Cols on Desktop) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Client & Invoice Setup Card */}
              <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-500" />
                      Client & Account Setup
                    </CardTitle>
                    <Badge variant="outline" className="font-mono text-[11px] border-slate-300 bg-white">
                      Section 1 of 3
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  
                  {/* Stock vs Client Invoice Mode Switcher */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-lg ${isStore ? 'bg-blue-100 text-blue-800' : 'bg-slate-900 text-white'}`}>
                        {isStore ? <Store className="h-5 w-5" /> : <User className="h-5 w-5" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          {isStore ? 'Store / Stock Checkout Mode' : 'Customer Account Invoice'}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {isStore ? 'Bypasses customer requirement for direct inventory sales' : 'Generates invoice tied to a customer ledger account'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="store-checkbox"
                        checked={isStore}
                        onCheckedChange={(checked) => {
                          setIsStore(checked as boolean);
                          if (checked) form.setValue('customerId', '');
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <label htmlFor="store-checkbox" className="cursor-pointer text-xs font-semibold text-slate-800">
                        Stock Sales
                      </label>
                    </div>
                  </div>

                  {/* Customer Select with Inline Create Customer Trigger */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className="space-y-1.5">
                      <CustomerSelect
                        isStore={isStore}
                        form={form}
                        control={form.control}
                        isDark={isDark}
                      />
                      {!isStore && (
                        <div className="pt-1 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Can&apos;t find customer?</span>
                          <button
                            type="button"
                            onClick={() => setShowCustomerModal(true)}
                            className="font-semibold text-blue-700 hover:text-blue-800 hover:underline flex items-center gap-1"
                          >
                            <UserPlus className="h-3 w-3" /> Create New Customer
                          </button>
                        </div>
                      )}
                    </div>

                    <FormField
                      name="amountDate"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" /> Invoice Issue Date
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="h-10 rounded-lg border-slate-300 text-xs font-mono"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>
                </CardContent>
              </Card>

              {/* Line Items Builder Studio */}
              <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-slate-50/60 px-6 py-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-500" />
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Line Items & Materials Spec Studio
                    </CardTitle>
                    <Badge variant="outline" className="font-mono text-xs border-slate-300 bg-white">
                      {itemFields.length} Line{itemFields.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    onClick={addItem}
                    className="h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 shadow-xs"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Product Line
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-6 overflow-visible">
                  
                  {itemFields.map((field, itemIndex) => {
                    const currentSelection = getCurrentSelection(itemIndex);
                    const availableItems = getFilteredItemsForRow(itemIndex);
                    const isSizeAutoFilled = sizeAutoFilled.get(itemIndex) || false;

                    return (
                      <div
                        key={field.id}
                        className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-visible space-y-4"
                      >
                        {/* Line Item Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3 rounded-t-xl">
                          <div className="flex items-center space-x-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                              {itemIndex + 1}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              Item #{itemIndex + 1}
                            </span>
                            {currentSelection.categoryId && (
                              <Badge variant="outline" className="text-[10px] border-slate-300 font-mono">
                                {categories.find(c => c.id === currentSelection.categoryId)?.name || 'Category'}
                              </Badge>
                            )}
                            {currentSelection.selectedItem && (
                              <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-medium border-0">
                                {safeString(currentSelection.selectedItem.name)}
                              </Badge>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(itemIndex)}
                            disabled={itemFields.length <= 1}
                            className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Remove Item
                          </Button>
                        </div>

                        <div className="p-5 space-y-5 overflow-visible">
                          
                          {/* Hierarchical Selection Matrix */}
                          <div className="space-y-2 overflow-visible">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hierarchical Catalog Selection</p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 overflow-visible">
                              
                              {/* Category */}
                              <div className="overflow-visible">
                                <FormLabel className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                  Category <span className="text-rose-500">*</span>
                                </FormLabel>
                                <Select
                                  options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                                  value={categories.find(cat => cat.id === currentSelection.categoryId) ? {
                                    value: currentSelection.categoryId,
                                    label: categories.find(cat => cat.id === currentSelection.categoryId)?.name || ''
                                  } : null}
                                  onChange={(option: any) => handleCategoryChange(itemIndex, option?.value || '')}
                                  placeholder="Select category"
                                  isSearchable
                                  styles={getSelectStyles()}
                                  isClearable
                                  menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                                />
                              </div>

                              {/* Size */}
                              <div className="overflow-visible">
                                <FormLabel className="text-xs font-semibold text-slate-700">Size Filter</FormLabel>
                                <Select
                                  options={sizes
                                    .filter(size => !currentSelection.categoryId || size.categoryId === currentSelection.categoryId)
                                    .map(size => ({ value: size.id, label: size.name }))}
                                  value={sizes.find(s => s.id === currentSelection.sizeId) ? {
                                    value: currentSelection.sizeId,
                                    label: sizes.find(s => s.id === currentSelection.sizeId)?.name || ''
                                  } : null}
                                  onChange={(option: any) => handleSizeChange(itemIndex, option?.value || '')}
                                  placeholder={currentSelection.categoryId ? "Select size" : "Category required"}
                                  isSearchable
                                  isDisabled={!currentSelection.categoryId}
                                  styles={getSelectStyles()}
                                  isClearable
                                  menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                                />
                              </div>

                              {/* Type */}
                              <div className="overflow-visible">
                                <FormLabel className="text-xs font-semibold text-slate-700">Type Filter</FormLabel>
                                <Select
                                  options={types
                                    .filter(type => !currentSelection.sizeId || type.sizeId === currentSelection.sizeId)
                                    .map(type => ({ value: type.id, label: type.name }))}
                                  value={types.find(t => t.id === currentSelection.typeId) ? {
                                    value: currentSelection.typeId,
                                    label: types.find(t => t.id === currentSelection.typeId)?.name || ''
                                  } : null}
                                  onChange={(option: any) => handleTypeChange(itemIndex, option?.value || '')}
                                  placeholder={currentSelection.sizeId ? "Select type" : "Size required"}
                                  isSearchable
                                  isDisabled={!currentSelection.sizeId}
                                  styles={getSelectStyles()}
                                  isClearable
                                  menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                                />
                              </div>

                              {/* Product Item */}
                              <div className="overflow-visible">
                                <FormLabel className="text-xs font-semibold text-slate-700">Catalog Product</FormLabel>
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
                                    if (option?.item) handleItemSelect(itemIndex, option.item);
                                  }}
                                  placeholder={!currentSelection.categoryId ? "Category required" : availableItems.length === 0 ? "No items" : "Select product"}
                                  isSearchable
                                  isLoading={isFetchingItems}
                                  isDisabled={!currentSelection.categoryId}
                                  styles={getSelectStyles()}
                                  isClearable
                                  menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                                />
                              </div>

                            </div>
                          </div>

                          {/* Pricing & Quantity Row */}
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            
                            <FormField
                              control={form.control}
                              name={`items.${itemIndex}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-semibold text-slate-700">Quantity</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(parseInt(e.target.value) || 1);
                                        calculateItemAmount(itemIndex);
                                      }}
                                      className="h-9 rounded-lg border-slate-300 font-mono text-xs font-bold"
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
                                  <FormLabel className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                    <span>Dimensions</span>
                                    {isSizeAutoFilled && (
                                      <Badge variant="outline" className="text-[9px] border-blue-300 bg-blue-50 text-blue-700">
                                        Locked
                                      </Badge>
                                    )}
                                  </FormLabel>
                                  <FormControl>
                                    {isSizeAutoFilled ? (
                                      <div className="flex h-9 w-full items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-mono text-slate-700">
                                        {field.value || 'Auto-filled'}
                                      </div>
                                    ) : (
                                      <Input
                                        type="text"
                                        placeholder="Size spec"
                                        {...field}
                                        value={typeof field.value === 'string' ? field.value : ''}
                                        className="h-9 rounded-lg border-slate-300 text-xs font-mono"
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
                                validate: (value) => value > 0 || 'Price must be greater than 0'
                              }}
                              render={({ field, fieldState }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                    <span>Unit Price <span className="text-rose-500">*</span></span>
                                    {priceAutoFilled.get(itemIndex) && (
                                      <Badge className="bg-emerald-100 text-emerald-800 text-[9px] font-medium border-0">
                                        Auto
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
                                      className={`h-9 rounded-lg border-slate-300 font-mono text-xs ${
                                        fieldState.error ? "border-rose-500 focus:ring-rose-500" : ""
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
                                  <FormLabel className="text-xs font-semibold text-slate-700">Line Amount</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="text"
                                      value={formatCurrency(field.value)}
                                      readOnly
                                      className="h-9 rounded-lg border-slate-200 bg-slate-50 font-mono text-xs font-bold text-slate-900"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                          </div>

                          {/* Description Textareas */}
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name={`items.${itemIndex}.description`}
                              rules={{ required: 'Description is required' }}
                              render={({ field, fieldState }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-semibold text-slate-700">
                                    Primary Description <span className="text-rose-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Product description..."
                                      {...field}
                                      rows={2}
                                      className={`rounded-lg border-slate-300 text-xs ${fieldState.error ? 'border-rose-500' : ''}`}
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
                                  <FormLabel className="text-xs font-semibold text-slate-700">Additional Specs / Notes</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Extra details..."
                                      {...field}
                                      rows={2}
                                      className="rounded-lg border-slate-300 text-xs"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Materials Sub-Card */}
                          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 overflow-visible">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5 text-slate-500" />
                                Required Materials <span className="text-rose-500">*</span>
                              </span>
                              <div className="flex items-center space-x-2">
                                <Button type="button" variant="ghost" size="sm" onClick={refreshMaterials} className="h-7 text-[11px] text-slate-600">
                                  Refresh
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => addMaterialToItem(itemIndex)} className="h-7 text-[11px] border-slate-300 bg-white">
                                  <Plus className="h-3 w-3 mr-1" /> Add Material
                                </Button>
                              </div>
                            </div>

                            {(form.watch(`items.${itemIndex}.materials`)?.length || 0) > 0 ? (
                              <div className="space-y-2 text-xs overflow-visible">
                                {form.watch(`items.${itemIndex}.materials`)?.map((material, materialIndex) => (
                                  <div key={materialIndex} className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center bg-white p-3 rounded-lg border border-slate-200 shadow-2xs overflow-visible">
                                    
                                    <div className="md:col-span-5 overflow-visible">
                                      <Select
                                        options={materialOptions}
                                        value={materialOptions.find(opt => opt.value === material.materialId) || null}
                                        onChange={(opt) => updateMaterialInItem(itemIndex, materialIndex, 'materialId', opt?.value || '')}
                                        placeholder="Select material"
                                        isSearchable
                                        styles={getSelectStyles()}
                                        menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                                      />
                                    </div>

                                    <div className="md:col-span-2">
                                      <Input
                                        type="number"
                                        min="1"
                                        value={material.quantity}
                                        onChange={(e) => updateMaterialInItem(itemIndex, materialIndex, 'quantity', parseInt(e.target.value) || 1)}
                                        placeholder="Qty"
                                        className="h-9 rounded-lg border-slate-300 font-mono text-xs"
                                      />
                                    </div>

                                    <div className="md:col-span-3">
                                      <Input
                                        value={material.note || ''}
                                        onChange={(e) => updateMaterialInItem(itemIndex, materialIndex, 'note', e.target.value)}
                                        placeholder="Note"
                                        className="h-9 rounded-lg border-slate-300 text-xs"
                                      />
                                    </div>

                                    <div className="md:col-span-1 flex justify-center">
                                      {material.materialId && materialImageMap.has(material.materialId) ? (
                                        <div 
                                          className="relative h-8 w-8 rounded border border-slate-200 overflow-hidden cursor-pointer hover:opacity-80"
                                          onClick={() => handleMaterialImageClick(materialImageMap.get(material.materialId)!)}
                                        >
                                          <img
                                            src={materialImageMap.get(material.materialId)!}
                                            alt="Material"
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      ) : (
                                        <div className="h-8 w-8 rounded border border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                                          <ImageIcon className="h-3.5 w-3.5" />
                                        </div>
                                      )}
                                    </div>

                                    <div className="md:col-span-1 flex justify-end">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeMaterialFromItem(itemIndex, materialIndex)}
                                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>

                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic text-center py-2 border border-dashed border-slate-200 rounded-lg bg-white">
                                No materials assigned — select an item above to auto-fill or click Add Material.
                              </p>
                            )}
                          </div>

                          {/* Product Photos */}
                          <div className="pt-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                                Product Photos
                              </span>
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => handleAddItemImage(itemIndex, e)}
                                  className="hidden"
                                />
                                <Button type="button" variant="outline" size="sm" asChild className="h-7 text-[11px] border-slate-300 bg-white">
                                  <span><Upload className="h-3 w-3 mr-1" /> Add Photos</span>
                                </Button>
                              </label>
                            </div>

                            {(itemImages.get(itemIndex)?.length || 0) > 0 && (
                              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                {itemImages.get(itemIndex)?.map((image, imageIndex) => (
                                  <div key={imageIndex} className="relative group aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                                    <img
                                      src={image.preview}
                                      alt="Product"
                                      className="w-full h-full object-cover"
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-0"
                                      onClick={() => removeItemImage(itemIndex, imageIndex)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}

                </CardContent>
              </Card>

              {/* Supporting Attachments Card */}
              <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-slate-500" />
                    Supporting Document Attachments ({attachments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-5 transition-all hover:bg-slate-50 hover:border-slate-300">
                    <input
                      type="file"
                      id="attachments"
                      multiple
                      onChange={handleAttachmentChange}
                      className="hidden"
                    />
                    <Upload className="h-5 w-5 text-slate-400 mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700">Upload PDF contracts or spec reference files</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Click to browse local files</span>
                  </label>

                  {attachments.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                          <span className="font-medium truncate max-w-[180px] text-slate-800">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            className="h-6 w-6 p-0 text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Right Sticky Sidebar (4 Cols on Desktop) */}
            <div className="lg:col-span-4 sticky top-24 space-y-6">
              
              {/* Financial Calculation Card */}
              <Card className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-slate-900 text-white px-5 py-4">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                      Financial Summary
                    </span>
                    <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px]">
                      ETB Currency
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  
                  {/* Math Items List */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Subtotal Amount:</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(watchedSubtotal)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="vat-toggle-sidebar"
                          checked={form.watch('vatApplied')}
                          onCheckedChange={handleVatAppliedChange}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        <label htmlFor="vat-toggle-sidebar" className="cursor-pointer text-xs font-medium text-slate-700">
                          15% VAT Tax
                        </label>
                      </div>
                      <span className="font-mono font-bold text-slate-800">{formatCurrency(watchedVat)}</span>
                    </div>
                  </div>

                  {/* Grand Total Banner */}
                  <div className="p-4 rounded-xl bg-slate-900 text-white shadow-xs space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Grand Total Invoice</p>
                    <p className="text-2xl font-black font-mono tracking-tight text-emerald-400">
                      {formatCurrency(watchedTotal)}
                    </p>
                  </div>

                </CardContent>
              </Card>

              {/* Live Readiness Checklist Card */}
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

              {/* Sidebar Primary Submit Buttons */}
              <div className="space-y-2.5">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md uppercase tracking-wider"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" /> Saving Invoice...
                    </span>
                  ) : (
                    <span>{initialData ? 'Update Proforma Invoice' : 'Create Proforma Invoice'}</span>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/ProformaInvoice')}
                  className="w-full h-9 rounded-xl border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel & Exit
                </Button>
              </div>

            </div>

          </div>
        </form>
      </Form>

      {/* Customer Creation Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Create New Customer Profile"
        description=""
      >
        <CreateCustomerModal
          closeModal={() => setShowCustomerModal(false)}
          onSuccess={handleCustomerCreated}
        />
      </Modal>

      {/* Material Image Preview Modal */}
      <Modal
        isOpen={showMaterialImageModal}
        onClose={() => setShowMaterialImageModal(false)}
        title="Material Spec Image"
        description=""
      >
        <div className="flex items-center justify-center p-4">
          {selectedMaterialImage && (
            <div className="relative max-w-xl max-h-[70vh] rounded-lg overflow-hidden border border-slate-200">
              <img
                src={selectedMaterialImage}
                alt="Material"
                className="w-full h-auto object-contain"
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