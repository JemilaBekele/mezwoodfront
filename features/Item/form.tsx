/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Search, Upload, X, AlertCircle, Image as ImageIcon } from 'lucide-react';

import { IItem, IItemMaterial, IItemImage } from '@/models/item';
import { IMaterial } from '@/models/material';
import { createItem, updateItem } from '@/service/item';
import { getMaterials } from '@/service/material';
import { normalizeImagePath } from '@/lib/norm';
import { IProductCategory, IProductType, ISize } from '@/models/productConfiguration';
import ProductCategoryModal from '../productConfiguration/catagory/formview';
import SizeModal from '../productConfiguration/size/formview';
import ProductTypeModal from '../productConfiguration/type/formview';

interface ItemFormProps {
  initialData: (IItem & { itemMaterials?: (IItemMaterial & { material?: IMaterial })[] }) | null;
  isEdit?: boolean;
  pageTitle?: string;
  categories?: IProductCategory[];
  sizes?: ISize[];
  types?: IProductType[];
}

interface MaterialSelection {
  materialId: string;
  materialName?: string;
  materialColor?: string;
  quantity: number;
  note?: string;
}

interface ImageFileWithPreview {
  file?: File;
  url: string;
  isExisting: boolean;
  id?: string; // For existing images
}

// Validation schema
interface ValidationErrors {
  name?: string;
  price?: string;
  categoryId?: string;
  typeId?: string;
  sizeId?: string;
  materials?: string;
  image?: string;
  color?: string;
}

export default function ItemForm({
  initialData,
  isEdit = false,
  pageTitle = isEdit ? 'Edit Product' : 'Create Product',
  categories: initialCategories = [],
  sizes: initialSizes = [],
  types: initialTypes = [],
}: ItemFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Configuration data (initialized with props from server)
  const [categories] = useState<IProductCategory[]>(initialCategories);
  const [types] = useState<IProductType[]>(initialTypes);
  const [sizes] = useState<ISize[]>(initialSizes);
  const [filteredTypes, setFilteredTypes] = useState<IProductType[]>([]);
  const [filteredSizes, setFilteredSizes] = useState<ISize[]>([]);
  
  // Materials data
  const [materials, setMaterials] = useState<IMaterial[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  
  // Search states
  const [categorySearch, setCategorySearch] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  const [sizeSearch, setSizeSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  
  const [selectOpen, setSelectOpen] = useState({
    category: false,
    type: false,
    size: false,
    material: false
  });
  
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Refs for scrollable areas
  const materialsTableRef = useRef<HTMLDivElement>(null);
  const formContainerRef = useRef<HTMLFormElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Item fields
  const [name, setName] = useState(initialData?.name || '');
  const [price, setPrice] = useState<string>(initialData?.price?.toString() || '');
  const [color, setColor] = useState<string>(initialData?.color || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [typeId, setTypeId] = useState(initialData?.typeId || '');
  const [sizeId, setSizeId] = useState(initialData?.sizeId || '');
  
  // Track if user manually edited the name
  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);
  // Track if user manually edited the color
  const [isColorManuallyEdited, setIsColorManuallyEdited] = useState(false);
  
  // Main image state
  const [mainImageUrl, setMainImageUrl] = useState<string>(initialData?.imageUrl || '');
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>(() => {
    if (initialData?.imageUrl) {
      return normalizeImagePath(initialData.imageUrl) || '';
    }
    return '';
  });
  
  // Additional images state
  const [additionalImages, setAdditionalImages] = useState<ImageFileWithPreview[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  // Material selections
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialSelection[]>([]);
  const [currentMaterial, setCurrentMaterial] = useState<Partial<MaterialSelection>>({
    quantity: 1,
  });

  // Selected colors for product (from materials)
  const [selectedProductColors, setSelectedProductColors] = useState<string[]>([]);

  const [errors, setErrors] = useState<ValidationErrors>({});

  // Get selected category, size, and type objects
  const selectedCategory = categories.find(c => c.id === categoryId);
  const selectedSize = sizes.find(s => s.id === sizeId);
  const selectedType = types.find(t => t.id === typeId);

  // Initialize additional images from initialData
  useEffect(() => {
    if (initialData?.itemImages && initialData.itemImages.length > 0) {
      const existingImages = initialData.itemImages.map(img => ({
        id: img.id,
        url: normalizeImagePath(img.imageUrl) || img.imageUrl,
        isExisting: true,
      }));
      setAdditionalImages(existingImages);
    }
  }, [initialData]);

  // Auto-generate product name based on selections (without color)
  useEffect(() => {
    if (isNameManuallyEdited || (isEdit && initialData?.name && !name)) {
      return;
    }

    const parts: string[] = [];
    
    if (selectedCategory?.name) {
      parts.push(selectedCategory.name);
    }
    
    if (selectedSize?.name) {
      parts.push(selectedSize.name);
    }
    
    if (selectedType?.name) {
      parts.push(selectedType.name);
    }
    
    const generatedName = parts.join(' ');
    
    if (generatedName && generatedName !== name) {
      setName(generatedName);
    }
  }, [selectedCategory, selectedSize, selectedType, isEdit, isNameManuallyEdited, initialData?.name, name]);

  // Update product color when selected colors change (only if not manually edited)
  useEffect(() => {
    if (!isColorManuallyEdited) {
      if (selectedProductColors.length > 0) {
        setColor(selectedProductColors.join(', '));
      } else if (selectedProductColors.length === 0 && color) {
        setColor('');
      }
    }
  }, [selectedProductColors, isColorManuallyEdited, color]);

  // Initialize selected colors from existing color when editing
  useEffect(() => {
    if (isEdit && initialData?.color) {
      const productColors = initialData.color.split(',').map(c => c.trim());
      setSelectedProductColors(productColors);
      setColor(initialData.color);
    }
  }, [isEdit, initialData]);

  // Sync selectedProductColors with material colors when editing (for checkbox matching)
  useEffect(() => {
    if (isEdit && initialData?.color && selectedMaterials.length > 0) {
      const productColors = initialData.color.split(',').map(c => c.trim().toLowerCase());
      
      // Find which materials have colors that match the product colors
      const matchedColors = selectedMaterials
        .map(m => m.materialColor)
        .filter((materialColor): materialColor is string => {
          if (!materialColor) return false;
          const materialColorLower = materialColor.toLowerCase();
          return productColors.some(productColor => 
            materialColorLower === productColor || 
            materialColorLower.includes(productColor) ||
            productColor.includes(materialColorLower)
          );
        });
      
      if (matchedColors.length > 0) {
        setSelectedProductColors(matchedColors);
      }
    }
  }, [isEdit, initialData?.color, selectedMaterials]);

  // Reset manual edit flags when starting a new item
  useEffect(() => {
    if (!isEdit && !initialData?.id) {
      setIsNameManuallyEdited(false);
      setIsColorManuallyEdited(false);
    }
  }, [isEdit, initialData]);

  // Validation functions
  const validateName = (value: string): string | undefined => {
    if (!value.trim()) return 'Product name is required';
    if (value.length < 2) return 'Product name must be at least 2 characters';
    if (value.length > 100) return 'Product name must be less than 100 characters';
    return undefined;
  };

  const validatePrice = (value: string): string | undefined => {
    if (value === '') return undefined;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'Price must be a valid number';
    if (numValue < 0) return 'Price cannot be negative';
    if (numValue > 9999999) return 'Price cannot exceed 9,999,999';
    return undefined;
  };

  const validateCategory = (value: string): string | undefined => {
    if (!value) return 'Category is required';
    return undefined;
  };

  const validateType = (value: string): string | undefined => {
    if (!value) return 'Product type is required';
    return undefined;
  };

  const validateSize = (value: string): string | undefined => {
    if (!value) return 'Size is required';
    return undefined;
  };

  const validateMaterials = (value: MaterialSelection[]): string | undefined => {
    if (value.length === 0) return 'At least one material is required';
    return undefined;
  };

  // Real-time validation
  useEffect(() => {
    if (touched.name) {
      setErrors(prev => ({ ...prev, name: validateName(name) }));
    }
  }, [name, touched.name]);

  useEffect(() => {
    if (touched.price) {
      setErrors(prev => ({ ...prev, price: validatePrice(price) }));
    }
  }, [price, touched.price]);

  useEffect(() => {
    if (touched.categoryId) {
      setErrors(prev => ({ ...prev, categoryId: validateCategory(categoryId) }));
    }
  }, [categoryId, touched.categoryId]);

  useEffect(() => {
    if (touched.typeId) {
      setErrors(prev => ({ ...prev, typeId: validateType(typeId) }));
    }
  }, [typeId, touched.typeId]);

  useEffect(() => {
    if (touched.sizeId) {
      setErrors(prev => ({ ...prev, sizeId: validateSize(sizeId) }));
    }
  }, [sizeId, touched.sizeId]);

  useEffect(() => {
    if (touched.materials) {
      setErrors(prev => ({ ...prev, materials: validateMaterials(selectedMaterials) }));
    }
  }, [selectedMaterials, touched.materials]);

  // Fetch materials only (categories, sizes, types come from props)
  useEffect(() => {
    fetchMaterials();
  }, []);

  // Filter sizes when category changes
  useEffect(() => {
    if (categoryId) {
      const filtered = sizes.filter(size => size.categoryId === categoryId);
      setFilteredSizes(filtered);
      
      if (sizeId) {
        const currentSize = filtered.find(s => s.id === sizeId);
        if (!currentSize) {
          setSizeId('');
        }
      }
    } else {
      setFilteredSizes([]);
      setSizeId('');
      setFilteredTypes([]);
      setTypeId('');
    }
  }, [categoryId, sizes, sizeId]);

  // Filter types based on selected size
  useEffect(() => {
    if (sizeId) {
      const filtered = types.filter(type => type.sizeId === sizeId);
      setFilteredTypes(filtered);
      
      if (typeId) {
        const currentType = filtered.find(t => t.id === typeId);
        if (!currentType) {
          setTypeId('');
        }
      }
    } else {
      setFilteredTypes([]);
      setTypeId('');
    }
  }, [sizeId, types, typeId]);

  const fetchMaterials = async () => {
    setLoadingMaterials(true);
    try {
      const materialsData = await getMaterials();
      setMaterials(materialsData);
    } catch (error: any) {
      toast.error('Failed to load materials');
    } finally {
      setLoadingMaterials(false);
    }
  };

  // Initialize selected materials from initialData when editing AND sync colors
  useEffect(() => {
    if (initialData?.itemMaterials && initialData.itemMaterials.length > 0) {
      const materialsFromInitial = initialData.itemMaterials.map(im => ({
        materialId: im.materialId,
        materialName: im.material?.name,
        materialColor: im.material?.color,
        quantity: im.quantity,
        note: im.note || undefined,
      }));
      setSelectedMaterials(materialsFromInitial);
      
      // Sync the checkbox selections based on saved product color
      if (initialData.color) {
        const savedColors = initialData.color.split(',').map(c => c.trim().toLowerCase());
        const matchedColors = materialsFromInitial
          .filter(m => m.materialColor && savedColors.includes(m.materialColor.toLowerCase()))
          .map(m => m.materialColor as string);
        const uniqueColors = [...new Set(matchedColors)];
        
        if (uniqueColors.length > 0) {
          setSelectedProductColors(uniqueColors);
        } else if (savedColors.length > 0) {
          // If no exact matches, still show the saved colors in the color field
          setSelectedProductColors(savedColors);
        }
      }
    }
  }, [initialData]);

  // Scroll to bottom when new material is added
  useEffect(() => {
    if (selectedMaterials.length > 0 && materialsTableRef.current) {
      materialsTableRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedMaterials.length]);

  const validateForm = () => {
    const nameError = validateName(name);
    const priceError = validatePrice(price);
    const categoryError = validateCategory(categoryId);
    const materialsError = validateMaterials(selectedMaterials);

    const newErrors = {
      name: nameError,
      price: priceError,
      categoryId: categoryError,
      materials: materialsError,
    };

    setErrors(newErrors);
    
    setTouched({
      name: true,
      price: true,
      categoryId: true,
      typeId: true,
      sizeId: true,
      materials: true,
    });

    return !Object.values(newErrors).some(error => error !== undefined);
  };

  // Main image handlers
  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
        return;
      }
      
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      if (mainImagePreview && mainImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(mainImagePreview);
      }

      setMainImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setMainImagePreview(previewUrl);
      setMainImageUrl('');
    }
  };

  const handleRemoveMainImage = () => {
    setMainImageUrl('');
    setMainImageFile(null);
    if (mainImagePreview && mainImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(mainImagePreview);
    }
    setMainImagePreview('');
  };

  // Additional images handlers
  const handleAdditionalImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024;
    const newImages: ImageFileWithPreview[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!validTypes.includes(file.type)) {
        toast.error(`"${file.name}" is not a valid image file`);
        continue;
      }
      if (file.size > maxSize) {
        toast.error(`"${file.name}" exceeds 5MB limit`);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      newImages.push({
        file,
        url: previewUrl,
        isExisting: false,
      });
    }

    if (newImages.length > 0) {
      setAdditionalImages(prev => [...prev, ...newImages]);
      toast.success(`Added ${newImages.length} image(s)`);
    }

    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleRemoveAdditionalImage = (index: number) => {
    const imageToRemove = additionalImages[index];
    
    // If it's an existing image, mark for deletion
    if (imageToRemove.isExisting && imageToRemove.id) {
      setImagesToDelete(prev => [...prev, imageToRemove.id!]);
    }
    
    // Revoke blob URL if it's a new image
    if (!imageToRemove.isExisting && imageToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddMaterial = () => {
    if (!currentMaterial.materialId) {
      toast.error('Please select a material');
      return;
    }

    if (!currentMaterial.quantity || currentMaterial.quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    const exists = selectedMaterials.some(m => m.materialId === currentMaterial.materialId);
    if (exists) {
      toast.error('Material already added');
      return;
    }

    const selectedMaterial = materials.find(m => m.id === currentMaterial.materialId);
    
    setSelectedMaterials([
      ...selectedMaterials,
      {
        materialId: currentMaterial.materialId,
        materialName: selectedMaterial?.name,
        materialColor: selectedMaterial?.color,
        quantity: currentMaterial.quantity,
        note: currentMaterial.note,
      },
    ]);

    setCurrentMaterial({
      quantity: 1,
    });
    setMaterialSearch('');
    
    if (errors.materials) {
      setErrors(prev => ({ ...prev, materials: undefined }));
    }
  };

  const handleRemoveMaterial = (materialId: string) => {
    const removedMaterial = selectedMaterials.find(m => m.materialId === materialId);
    setSelectedMaterials(selectedMaterials.filter(m => m.materialId !== materialId));
    // Also remove this material's color from selected product colors if it was selected
    if (removedMaterial?.materialColor && !isColorManuallyEdited) {
      setSelectedProductColors(prev => prev.filter(c => c !== removedMaterial.materialColor));
    }
  };

  const handleQuantityChange = (materialId: string, quantity: number) => {
    setSelectedMaterials(selectedMaterials.map(m => 
      m.materialId === materialId ? { ...m, quantity } : m
    ));
  };

  const handleColorCheckboxToggle = (colorValue: string) => {
    if (isColorManuallyEdited) {
      toast.info('Manual mode enabled. Click "Reset to Auto" to enable auto-selection.');
      return;
    }
    
    if (selectedProductColors.includes(colorValue)) {
      setSelectedProductColors(prev => prev.filter(c => c !== colorValue));
    } else {
      if (selectedProductColors.length >= 2) {
        toast.warning('Maximum 2 colors allowed for a product');
        return;
      }
      setSelectedProductColors(prev => [...prev, colorValue]);
    }
  };

  const handleColorManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsColorManuallyEdited(true);
    setColor(e.target.value);
    // Clear selected product colors when manually editing
    setSelectedProductColors([]);
  };

  const resetColorToAuto = () => {
    setIsColorManuallyEdited(false);
    // Re-sync selected product colors from materials
    const colors = selectedMaterials
      .map(m => m.materialColor)
      .filter((c): c is string => !!c && c.trim() !== '');
    const uniqueColors = [...new Set(colors)];
    const limitedColors = uniqueColors.slice(0, 2);
    setSelectedProductColors(limitedColors);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsNameManuallyEdited(true);
    setName(e.target.value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setPrice('');
    } else if (/^\d*\.?\d*$/.test(value)) {
      setPrice(value);
    }
  };

  const handleCancel = () => {
    router.push('/items');
    router.refresh();
  };

// In your handleSubmit function, after creating formData
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;

  setIsLoading(true);
  try {
    const priceValue = price === '' ? 0 : parseFloat(price);
    
    // Create FormData
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', priceValue.toString());
    if (color) formData.append('color', color);
    if (categoryId) formData.append('categoryId', categoryId);
    if (typeId) formData.append('typeId', typeId);
    if (sizeId) formData.append('sizeId', sizeId);
    
    // Main image
    if (mainImageFile) {
      formData.append('image', mainImageFile);
    } else if (mainImageUrl === null || mainImageUrl === '') {
      formData.append('imageUrl', 'null');
    }
    
    // Additional images
    const newImageFiles = additionalImages.filter(img => !img.isExisting);
    newImageFiles.forEach((img, index) => {
      if (img.file) {
        console.log(`Adding additional image ${index + 1}:`, img.file.name, img.file.size);
        formData.append('images', img.file);
      }
    });
    
    // Images to delete
    if (imagesToDelete.length > 0) {
      formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
    }
    
    // Materials
    formData.append('materials', JSON.stringify(
      selectedMaterials.map(m => ({
        materialId: m.materialId,
        quantity: m.quantity,
        note: m.note,
      }))
    ));

    // Log all FormData entries for debugging
    for (const pair of formData.entries()) {
      if (pair[1] instanceof File) {
        console.log(`${pair[0]}: File - ${pair[1].name} (${pair[1].size} bytes)`);
      } else {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
    }

    let response;
    if (isEdit && initialData?.id) {
      // Make sure you're passing the FormData correctly
      await updateItem(initialData.id, formData);
      router.push('/dashboard/Item');
      router.refresh();
      toast.success('Item updated successfully');
    } else {
      response = await createItem(formData);
      toast.success('Item created successfully');
      router.push(`/dashboard/Item/initial?id=${response?.data?.id}`);
      router.refresh();
    }

  } catch (error: any) {
    console.error('Submit error:', error);
    toast.error(error.message || 'Failed to save item');
  } finally {
    setIsLoading(false);
  }
};

  // Get available materials (not already selected)
  const availableMaterials = materials.filter(
    m => !selectedMaterials.some(sm => sm.materialId === m.id)
  );

  // Filter materials based on search term
  const filteredMaterials = availableMaterials.filter(material => {
    const searchLower = materialSearch.toLowerCase();
    return (
      material.name.toLowerCase().includes(searchLower) ||
      material.color?.toLowerCase().includes(searchLower) ||
      material.size?.toLowerCase().includes(searchLower)
    );
  });

  // Filter categories
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Filter types (based on selected size)
  const filteredTypesBySearch = filteredTypes.filter(type =>
    type.name.toLowerCase().includes(typeSearch.toLowerCase())
  );

  // Filter sizes
  const filteredSizesBySearch = filteredSizes.filter(size =>
    size.name.toLowerCase().includes(sizeSearch.toLowerCase())
  );

  // Safe image source getter for main image
  const getSafeMainImageSource = () => {
    if (!mainImagePreview) return null;
    if (mainImagePreview.startsWith('blob:') || mainImagePreview.startsWith('http')) {
      return mainImagePreview;
    }
    return normalizeImagePath(mainImagePreview);
  };

  const safeMainImageSrc = getSafeMainImageSource();

  return (
    <div>
      <Card className="mx-auto w-full ">
        <CardHeader className="border-b">
          <CardTitle className="text-left text-xl sm:text-2xl font-bold">
            {pageTitle}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6" ref={formContainerRef}>
            {/* Product Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Product Information
              </h3>
              {/* Category, Size, Type Selection */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <Select
                    open={selectOpen.category}
                    onOpenChange={(open) => setSelectOpen(prev => ({ ...prev, category: open }))}
                    value={categoryId}
                    onValueChange={(value) => {
                      setCategoryId(value);
                      setSelectOpen(prev => ({ ...prev, category: false }));
                      setCategorySearch('');
                    }}
                  >
                    <SelectTrigger className={errors.categoryId && touched.categoryId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="sticky top-0 bg-white p-2 border-b">
                        <Input
                          placeholder="Search categories..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          className="h-8"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filteredCategories.length === 0 ? (
                        <div className="py-6 text-center text-sm">No categories found</div>
                      ) : (
                        filteredCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <ProductCategoryModal/>
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Size 
                  </label>
                  <Select
                    open={selectOpen.size}
                    onOpenChange={(open) => setSelectOpen(prev => ({ ...prev, size: open }))}
                    value={sizeId}
                    onValueChange={(value) => {
                      setSizeId(value);
                      setSelectOpen(prev => ({ ...prev, size: false }));
                      setSizeSearch('');
                    }}
                    disabled={!categoryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={categoryId ? "Select size" : "Select category first"} />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="sticky top-0 bg-white p-2 border-b">
                        <Input
                          placeholder="Search sizes..."
                          value={sizeSearch}
                          onChange={(e) => setSizeSearch(e.target.value)}
                          className="h-8"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filteredSizesBySearch.length === 0 ? (
                        <div className="py-6 text-center text-sm">
                          {filteredSizes.length === 0 ? 'No sizes available for this category' : 'No sizes found'}
                        </div>
                      ) : (
                        filteredSizesBySearch.map((size) => (
                          <SelectItem key={size.id} value={size.id}>
                            {size.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <SizeModal/>
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Product Type 
                  </label>
                  <Select
                    open={selectOpen.type}
                    onOpenChange={(open) => setSelectOpen(prev => ({ ...prev, type: open }))}
                    value={typeId}
                    onValueChange={(value) => {
                      setTypeId(value);
                      setSelectOpen(prev => ({ ...prev, type: false }));
                      setTypeSearch('');
                    }}
                    disabled={!sizeId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={sizeId ? "Select type" : "Select size first"} />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="sticky top-0 bg-white p-2 border-b">
                        <Input
                          placeholder="Search types..."
                          value={typeSearch}
                          onChange={(e) => setTypeSearch(e.target.value)}
                          className="h-8"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filteredTypesBySearch.length === 0 ? (
                        <div className="py-6 text-center text-sm">
                          {filteredTypes.length === 0 
                            ? 'No product types available for this size' 
                            : 'No types found'}
                        </div>
                      ) : (
                        filteredTypesBySearch.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex flex-col">
                              <span>{type.name}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <ProductTypeModal/>
                </div>
              </div>
    
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Item Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Product name will be auto-generated from category, size, and type"
                    value={name}
                    onChange={handleNameChange}
                    onBlur={() => handleBlur('name')}
                    className={errors.name && touched.name ? 'border-red-500' : ''}
                  />
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price ($)</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Enter price (optional)"
                    value={price}
                    onChange={handlePriceChange}
                    onBlur={() => handleBlur('price')}
                    className={errors.price && touched.price ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty to set price as 0
                  </p>
                </div>

                {/* Color - Fully Editable with Auto/Manual Toggle */}
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Product Color
                    </label>
                    {isColorManuallyEdited && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={resetColorToAuto}
                        className="text-xs h-6 px-2"
                      >
                        Reset to Auto
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Enter product colors (e.g., Red, Blue) or select from materials below"
                    value={color}
                    onChange={handleColorManualChange}
                  />
                </div>
              </div>

              {/* Product Images Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Product Images
                </h3>
                
                {/* Main Image */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Main Image</label>
                  
                  {safeMainImageSrc && (
                    <div className="relative inline-block">
                      <div className="relative h-24 w-24 sm:h-32 sm:w-32 overflow-hidden rounded-lg border">
                        <Image
                          src={safeMainImageSrc}
                          alt="Main product image"
                          fill
                          className="object-cover"
                          onError={() => {
                            console.error('Failed to load image:', safeMainImageSrc);
                            toast.error('Failed to load image');
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -right-2 -top-2 h-5 w-5 sm:h-6 sm:w-6"
                        onClick={handleRemoveMainImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  <div>
                    <input
                      type="file"
                      id="main-image-upload"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleMainImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('main-image-upload')?.click()}
                      className="w-full sm:w-auto"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {safeMainImageSrc ? 'Change Main Image' : 'Upload Main Image'}
                    </Button>
                  </div>
                </div>

                {/* Additional Images */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Images</label>
                  
                  {/* Image grid */}
                  {additionalImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {additionalImages.map((image, index) => (
                        <div key={image.isExisting ? image.id : index} className="relative">
                          <div className="relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-lg border">
                            <Image
                              src={image.url}
                              alt={`Additional image ${index + 1}`}
                              fill
                              className="object-cover"
                              onError={() => {
                                console.error('Failed to load additional image:', image.url);
                              }}
                            />
                            {image.isExisting && (
                              <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 rounded-bl">
                                saved
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -right-2 -top-2 h-5 w-5 sm:h-6 sm:w-6"
                            onClick={() => handleRemoveAdditionalImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <input
                      type="file"
                      ref={imageInputRef}
                      id="additional-images-upload"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleAdditionalImagesUpload}
                      multiple
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('additional-images-upload')?.click()}
                      className="w-full sm:w-auto"
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Add Additional Images
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">
                      You can upload multiple images at once
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Materials Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Required Materials <span className="text-red-500">*</span>
                </h3>
                {errors.materials && touched.materials && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.materials}
                  </p>
                )}
              </div>

              {/* Material Selection Form */}
              <div className="pb-4 border-b">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <Select
                      open={selectOpen.material}
                      onOpenChange={(open) => setSelectOpen(prev => ({ ...prev, material: open }))}
                      value={currentMaterial.materialId || ''}
                      onValueChange={(value) => {
                        setCurrentMaterial({ ...currentMaterial, materialId: value });
                        setSelectOpen(prev => ({ ...prev, material: false }));
                        setMaterialSearch('');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="sticky top-0 bg-white p-2 border-b">
                          <div className="flex items-center border rounded-md px-3 py-1">
                            <Search className="h-4 w-4 text-gray-400 mr-2" />
                            <Input
                              placeholder="Search materials..."
                              value={materialSearch}
                              onChange={(e) => setMaterialSearch(e.target.value)}
                              className="border-0 p-0 focus-visible:ring-0"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        {loadingMaterials ? (
                          <div className="py-6 text-center text-sm">Loading...</div>
                        ) : filteredMaterials.length === 0 ? (
                          <div className="py-6 text-center text-sm">
                            {materialSearch ? 'No materials found' : 'No materials available'}
                          </div>
                        ) : (
                          filteredMaterials.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{material.name}</span>
                                <span className="text-xs text-gray-500">
                                  {material.color && `Color: ${material.color} - `}
                                  Size: {material.size}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-3">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Quantity"
                      value={currentMaterial.quantity || ''}
                      onChange={(e) => 
                        setCurrentMaterial({ 
                          ...currentMaterial, 
                          quantity: parseInt(e.target.value) || 0 
                        })
                      }
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={handleAddMaterial}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Materials Table with Checkboxes */}
              <div 
                ref={materialsTableRef}
                className="overflow-x-auto -mx-4 sm:mx-0 max-h-96 overflow-y-auto"
              >
                {selectedMaterials.length > 0 ? (
                  <div className="min-w-full inline-block align-middle">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow>
                          <TableHead className="w-[10%] text-center">Select for Color</TableHead>
                          <TableHead className="w-[30%]">Material</TableHead>
                          <TableHead className="w-[20%]">Color</TableHead>
                          <TableHead className="w-[20%]">Quantity</TableHead>
                          <TableHead className="w-[10%] text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedMaterials.map((material) => (
                          <TableRow key={material.materialId}>
                            <TableCell className="text-center">
                              <input
                                type="checkbox"
                                checked={selectedProductColors.includes(material.materialColor || '')}
                                onChange={() => handleColorCheckboxToggle(material.materialColor || '')}
                                disabled={!material.materialColor || isColorManuallyEdited}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {material.materialName || material.materialId}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full border"
                                  style={{ 
                                    backgroundColor: material.materialColor?.toLowerCase() || '#ccc',
                                    borderColor: '#ddd'
                                  }}
                                />
                                <span className="text-sm capitalize">
                                  {material.materialColor || 'N/A'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={material.quantity}
                                onChange={(e) => 
                                  handleQuantityChange(
                                    material.materialId, 
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMaterial(material.materialId)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    <p className="text-sm">No materials added yet</p>
                    <p className="text-xs mt-1">Select a material above to add</p>
                  </div>
                )}
              </div>
              
              {selectedMaterials.length > 0 && (
                <div className="text-sm text-gray-500 text-right">
                  Total materials: {selectedMaterials.length}
                  {!isColorManuallyEdited && selectedProductColors.length > 0 && (
                    <span className="ml-2 text-green-600">
                      • Colors selected: {selectedProductColors.join(', ')}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-white pt-4 border-t mt-4">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? 'Saving...' : (isEdit ? 'Update Item' : 'Create Item')}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}