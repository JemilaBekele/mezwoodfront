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
import { Trash2, Plus, Search, Upload, X, AlertCircle, Image as ImageIcon, Loader2, Eye, ZoomIn } from 'lucide-react';

import { IItem, IItemMaterial } from '@/models/item';
import { IMaterial } from '@/models/material';
import { createItem, updateItem } from '@/service/item';
import { getMaterials } from '@/service/material';
import { normalizeImagePath } from '@/lib/norm';
import { IProductCategory, IProductType, ISize } from '@/models/productConfiguration';
import { createCategory, createSize, createType, getCategories, getSizes, getTypes } from '@/service/productConfiguration';

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
  materialImage?: string;
  quantity: number;
  note?: string;
}

interface ImageFileWithPreview {
  file?: File;
  url: string;
  isExisting: boolean;
  id?: string;
}

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

// Image View Modal Component
interface ImageViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  materialName?: string;
}

const ImageViewModal: React.FC<ImageViewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  materialName,
}) => {
  if (!isOpen) return null;

  const normalizedImageUrl = normalizeImagePath(imageUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="relative max-w-4xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X className="h-8 w-8" />
        </button>
        
        {/* Image container */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          {normalizedImageUrl ? (
            <div className="relative w-full h-[70vh] min-h-[300px]">
              <Image
                src={normalizedImageUrl}
                alt={materialName || 'Material image'}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 80vw"
              />
            </div>
          ) : (
            <div className="flex h-[70vh] min-h-[300px] items-center justify-center">
              <div className="text-center text-white">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No image available</p>
              </div>
            </div>
          )}
          
          {/* Material name overlay */}
          {materialName && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="text-white text-lg font-medium">{materialName}</p>
            </div>
          )}
        </div>
        
        {/* Zoom indicator */}
        <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
          Click outside to close
        </div>
      </div>
    </div>
  );
};

// Inline Create Modal Component
interface InlineCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newItem: any) => void;
  type: 'category' | 'size' | 'type';
  categoryId?: string;
  sizeId?: string;
}

const InlineCreateModal: React.FC<InlineCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  type,
  categoryId,
  sizeId,
}) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId || '');
  const [selectedSizeId, setSelectedSizeId] = useState(sizeId || '');
  const [categories, setCategories] = useState<IProductCategory[]>([]);
  const [sizes, setSizes] = useState<ISize[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (categoryId) {
        setSelectedCategoryId(categoryId);
      }
      if (sizeId) {
        setSelectedSizeId(sizeId);
      }
    }
  }, [isOpen, categoryId, sizeId]);

  const loadData = async () => {
    try {
      const [categoriesData, sizesData] = await Promise.all([
        getCategories(),
        getSizes()
      ]);
      setCategories(categoriesData);
      setSizes(sizesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsLoading(true);
    try {
      let result;
      if (type === 'category') {
        result = await createCategory({ name: name.trim() });
        toast.success('Category created successfully');
      } else if (type === 'size') {
        const categoryToUse = categoryId || selectedCategoryId;
        if (!categoryToUse) {
          toast.error('Please select a category');
          setIsLoading(false);
          return;
        }
        result = await createSize({ name: name.trim(), categoryId: categoryToUse });
        toast.success('Size created successfully');
      } else if (type === 'type') {
        const sizeToUse = sizeId || selectedSizeId;
        if (!sizeToUse) {
          toast.error('Please select a size');
          setIsLoading(false);
          return;
        }
        result = await createType({ name: name.trim(), sizeId: sizeToUse });
        toast.success('Product type created successfully');
      }

      if (result) {
        onSuccess(result);
        onClose();
        setName('');
        setSelectedCategoryId('');
        setSelectedSizeId('');
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to create ${type}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case 'category': return 'Create New Category';
      case 'size': return 'Create New Size';
      case 'type': return 'Create New Product Type';
    }
  };

  const getSubtitle = () => {
    if (type === 'size' && categoryId) {
      const category = categories.find(c => c.id === categoryId);
      return category ? `for category: ${category.name}` : '';
    }
    if (type === 'type' && sizeId) {
      const size = sizes.find(s => s.id === sizeId);
      return size ? `for size: ${size.name}` : '';
    }
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">{getTitle()}</h3>
            {getSubtitle() && (
              <p className="text-sm text-gray-500">{getSubtitle()}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {type === 'size' && !categoryId && (
            <div>
              <label className="text-sm font-medium block mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedCategoryId}
                onValueChange={setSelectedCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'size' && categoryId && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Category:</span> {categories.find(c => c.id === categoryId)?.name || 'Loading...'}
              </p>
            </div>
          )}

          {type === 'type' && !sizeId && (
            <div>
              <label className="text-sm font-medium block mb-1">
                Size <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedSizeId}
                onValueChange={setSelectedSizeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((size) => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'type' && sizeId && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Size:</span> {sizes.find(s => s.id === sizeId)?.name || 'Loading...'}
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder={`Enter ${type} name...`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  
  const [categories, setCategories] = useState<IProductCategory[]>(initialCategories);
  const [types, setTypes] = useState<IProductType[]>(initialTypes);
  const [sizes, setSizes] = useState<ISize[]>(initialSizes);
  const [filteredTypes, setFilteredTypes] = useState<IProductType[]>([]);
  const [filteredSizes, setFilteredSizes] = useState<ISize[]>([]);
  
  const [modalOpen, setModalOpen] = useState({
    category: false,
    size: false,
    type: false,
  });

  // Image view modal state
  const [imageViewModal, setImageViewModal] = useState<{
    isOpen: boolean;
    imageUrl: string;
    materialName?: string;
  }>({
    isOpen: false,
    imageUrl: '',
    materialName: '',
  });
  
  const [materials, setMaterials] = useState<IMaterial[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  
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
  
  const materialsTableRef = useRef<HTMLDivElement>(null);
  const formContainerRef = useRef<HTMLFormElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialData?.name || '');
  const [price, setPrice] = useState<string>(initialData?.price?.toString() || '');
  const [color, setColor] = useState<string>(initialData?.color || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [typeId, setTypeId] = useState(initialData?.typeId || '');
  const [sizeId, setSizeId] = useState(initialData?.sizeId || '');
  
  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);
  
  const [mainImageUrl, setMainImageUrl] = useState<string>(initialData?.imageUrl || '');
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>(() => {
    if (initialData?.imageUrl) {
      return normalizeImagePath(initialData.imageUrl) || '';
    }
    return '';
  });
  
  const [additionalImages, setAdditionalImages] = useState<ImageFileWithPreview[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialSelection[]>([]);
  const [currentMaterial, setCurrentMaterial] = useState<Partial<MaterialSelection>>({
    quantity: 1,
  });

  // Selected colors for product (max 3)
  const [selectedProductColors, setSelectedProductColors] = useState<string[]>([]);

  const [errors, setErrors] = useState<ValidationErrors>({});

  const selectedCategory = categories.find(c => c.id === categoryId);
  const selectedSize = sizes.find(s => s.id === sizeId);
  const selectedType = types.find(t => t.id === typeId);

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

  // Initialize selected colors from existing color when editing
  useEffect(() => {
    if (isEdit && initialData?.color) {
      const productColors = initialData.color.split(',').map(c => c.trim());
      const limitedColors = productColors.slice(0, 3);
      setSelectedProductColors(limitedColors);
      setColor(limitedColors.join(', '));
    }
  }, [isEdit, initialData]);

  // Initialize selected materials from initialData when editing
  useEffect(() => {
    if (initialData?.itemMaterials && initialData.itemMaterials.length > 0) {
      const materialsFromInitial = initialData.itemMaterials.map(im => ({
        materialId: im.materialId,
        materialName: im.material?.name,
        materialColor: im.material?.color,
        materialImage: im.material?.imageUrl,
        quantity: im.quantity,
        note: im.note || undefined,
      }));
      setSelectedMaterials(materialsFromInitial);
      
      if (initialData.color) {
        const savedColors = initialData.color.split(',').map(c => c.trim());
        const limitedColors = savedColors.slice(0, 3);
        setSelectedProductColors(limitedColors);
      }
    }
  }, [initialData]);

  // Reset manual edit flags when starting a new item
  useEffect(() => {
    if (!isEdit && !initialData?.id) {
      setIsNameManuallyEdited(false);
    }
  }, [isEdit, initialData]);

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

  useEffect(() => {
    fetchMaterials();
  }, []);

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

  const refreshConfigData = async () => {
    try {
      const [categoriesData, sizesData, typesData] = await Promise.all([
        getCategories(),
        getSizes(),
        getTypes()
      ]);
      setCategories(categoriesData);
      setSizes(sizesData);
      setTypes(typesData);
      return { categoriesData, sizesData, typesData };
    } catch (error) {
      console.error('Failed to refresh config data:', error);
      throw error;
    }
  };

  const handleCategoryCreated = async (newCategory: IProductCategory) => {
    const { categoriesData } = await refreshConfigData();
    setCategories(categoriesData);
    setCategoryId(newCategory.id);
    toast.success(`Category "${newCategory.name}" created and selected`);
  };

  const handleSizeCreated = async (newSize: ISize) => {
    const { sizesData } = await refreshConfigData();
    setSizes(sizesData);
    setSizeId(newSize.id);
    toast.success(`Size "${newSize.name}" created and selected`);
  };

  const handleTypeCreated = async (newType: IProductType) => {
    const { typesData } = await refreshConfigData();
    setTypes(typesData);
    setTypeId(newType.id);
    toast.success(`Product type "${newType.name}" created and selected`);
  };

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

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleRemoveAdditionalImage = (index: number) => {
    const imageToRemove = additionalImages[index];
    
    if (imageToRemove.isExisting && imageToRemove.id) {
      setImagesToDelete(prev => [...prev, imageToRemove.id!]);
    }
    
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
        materialImage: selectedMaterial?.imageUrl,
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
    if (removedMaterial?.materialColor) {
      setSelectedProductColors(prev => prev.filter(c => c !== removedMaterial.materialColor));
      const updatedColors = selectedProductColors.filter(c => c !== removedMaterial.materialColor);
      setColor(updatedColors.join(', '));
    }
  };

  const handleQuantityChange = (materialId: string, quantity: number) => {
    setSelectedMaterials(selectedMaterials.map(m => 
      m.materialId === materialId ? { ...m, quantity } : m
    ));
  };

  const handleColorCheckboxToggle = (colorValue: string) => {
    if (!colorValue) return;
    
    if (selectedProductColors.includes(colorValue)) {
      const newColors = selectedProductColors.filter(c => c !== colorValue);
      setSelectedProductColors(newColors);
      setColor(newColors.join(', '));
    } else {
      if (selectedProductColors.length >= 3) {
        toast.warning('Maximum 3 colors allowed for a product');
        return;
      }
      const newColors = [...selectedProductColors, colorValue];
      setSelectedProductColors(newColors);
      setColor(newColors.join(', '));
    }
  };

  const handleColorManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setColor(value);
    const colors = value.split(',').map(c => c.trim()).filter(c => c !== '');
    const limitedColors = colors.slice(0, 3);
    if (limitedColors.length !== colors.length && colors.length > 3) {
      toast.warning('Maximum 3 colors allowed');
    }
    setSelectedProductColors(limitedColors);
    if (colors.length > 3) {
      setColor(limitedColors.join(', '));
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const priceValue = price === '' ? 0 : parseFloat(price);
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('price', priceValue.toString());
      if (color) formData.append('color', color);
      if (categoryId) formData.append('categoryId', categoryId);
      if (typeId) formData.append('typeId', typeId);
      if (sizeId) formData.append('sizeId', sizeId);
      
      if (mainImageFile) {
        formData.append('image', mainImageFile);
      } else if (mainImageUrl === null || mainImageUrl === '') {
        formData.append('imageUrl', 'null');
      }
      
      const newImageFiles = additionalImages.filter(img => !img.isExisting);
      newImageFiles.forEach((img) => {
        if (img.file) {
          formData.append('images', img.file);
        }
      });
      
      if (imagesToDelete.length > 0) {
        formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
      }
      
      formData.append('materials', JSON.stringify(
        selectedMaterials.map(m => ({
          materialId: m.materialId,
          quantity: m.quantity,
          note: m.note,
        }))
      ));

      if (isEdit && initialData?.id) {
        await updateItem(initialData.id, formData);
        router.push('/dashboard/Item');
        router.refresh();
        toast.success('Item updated successfully');
      } else {
        const response = await createItem(formData);
        toast.success('Item created successfully');
        router.push('/dashboard/Item');
        router.refresh();
      }

    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to save item');
    } finally {
      setIsLoading(false);
    }
  };

  const availableMaterials = materials.filter(
    m => !selectedMaterials.some(sm => sm.materialId === m.id)
  );

  const filteredMaterials = availableMaterials.filter(material => {
    const searchLower = materialSearch.toLowerCase();
    return (
      material.name.toLowerCase().includes(searchLower) ||
      material.color?.toLowerCase().includes(searchLower) ||
      material.size?.toLowerCase().includes(searchLower)
    );
  });

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredTypesBySearch = filteredTypes.filter(type =>
    type.name.toLowerCase().includes(typeSearch.toLowerCase())
  );

  const filteredSizesBySearch = filteredSizes.filter(size =>
    size.name.toLowerCase().includes(sizeSearch.toLowerCase())
  );

  const getSafeMainImageSource = () => {
    if (!mainImagePreview) return null;
    if (mainImagePreview.startsWith('blob:') || mainImagePreview.startsWith('http')) {
      return mainImagePreview;
    }
    return normalizeImagePath(mainImagePreview);
  };

  const safeMainImageSrc = getSafeMainImageSource();

  // Helper to get material image
  const getMaterialImage = (materialImage?: string) => {
    if (!materialImage) return null;
    return normalizeImagePath(materialImage);
  };

  const openImageView = (imageUrl: string, materialName?: string) => {
    if (!imageUrl) {
      toast.error('No image available for this material');
      return;
    }
    setImageViewModal({
      isOpen: true,
      imageUrl: imageUrl,
      materialName: materialName,
    });
  };

  const closeImageView = () => {
    setImageViewModal({
      isOpen: false,
      imageUrl: '',
      materialName: '',
    });
  };

  return (
    <div>
      {/* Image View Modal */}
      <ImageViewModal
        isOpen={imageViewModal.isOpen}
        onClose={closeImageView}
        imageUrl={imageViewModal.imageUrl}
        materialName={imageViewModal.materialName}
      />

      <InlineCreateModal
        isOpen={modalOpen.category}
        onClose={() => setModalOpen(prev => ({ ...prev, category: false }))}
        onSuccess={handleCategoryCreated}
        type="category"
      />
      <InlineCreateModal
        isOpen={modalOpen.size}
        onClose={() => setModalOpen(prev => ({ ...prev, size: false }))}
        onSuccess={handleSizeCreated}
        type="size"
        categoryId={categoryId}
      />
      <InlineCreateModal
        isOpen={modalOpen.type}
        onClose={() => setModalOpen(prev => ({ ...prev, type: false }))}
        onSuccess={handleTypeCreated}
        type="type"
        sizeId={sizeId}
      />

      <Card className="mx-auto w-full ">
        <CardHeader className="border-b">
          <CardTitle className="text-left text-xl sm:text-2xl font-bold">
            {pageTitle}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6" ref={formContainerRef}>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Product Information
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setModalOpen(prev => ({ ...prev, category: true }))}
                      title="Create new category"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Size 
                  </label>
                  <div className="flex gap-2">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setModalOpen(prev => ({ ...prev, size: true }))}
                      title="Create new size"
                      disabled={!categoryId}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Product Type 
                  </label>
                  <div className="flex gap-2">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setModalOpen(prev => ({ ...prev, type: true }))}
                      title="Create new product type"
                      disabled={!sizeId}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
    
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Price</label>
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

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">
                    Product Color <span className="text-xs text-gray-500">(Max 3 colors)</span>
                  </label>
                  <div>
                    <Input
                      placeholder="Enter product colors separated by commas (e.g., Red, Blue, Green)"
                      value={color}
                      onChange={handleColorManualChange}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedProductColors.length > 0 ? (
                        <span>Selected colors: {selectedProductColors.join(', ')}</span>
                      ) : (
                        <span>No colors selected</span>
                      )}
                      <span className="ml-2 text-blue-500">
                        ({selectedProductColors.length}/3)
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Product Images
                </h3>
                
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Images</label>
                  
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

              <div 
                ref={materialsTableRef}
                className="overflow-x-auto -mx-4 sm:mx-0 max-h-96 overflow-y-auto"
              >
                {selectedMaterials.length > 0 ? (
                  <div className="min-w-full inline-block align-middle">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow>
                          <TableHead className="w-[8%] text-center">Select for Color</TableHead>
                          <TableHead className="w-[12%]">Image</TableHead>
                          <TableHead className="w-[25%]">Material</TableHead>
                          <TableHead className="w-[15%]">Color</TableHead>
                          <TableHead className="w-[20%]">Quantity</TableHead>
                          <TableHead className="w-[10%] text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedMaterials.map((material) => {
                          const imageSrc = getMaterialImage(material.materialImage);
                          return (
                            <TableRow key={material.materialId}>
                              <TableCell className="text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedProductColors.includes(material.materialColor || '')}
                                  onChange={() => handleColorCheckboxToggle(material.materialColor || '')}
                                  disabled={!material.materialColor}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                />
                              </TableCell>
                              <TableCell>
                                {imageSrc ? (
                                  <div className="relative group">
                                    <div className="relative h-12 w-12 rounded-lg border overflow-hidden cursor-pointer">
                                      <Image
                                        src={imageSrc}
                                        alt={material.materialName || 'Material'}
                                        fill
                                        className="object-cover"
                                        onClick={() => openImageView(imageSrc, material.materialName)}
                                        onError={() => {
                                          console.error('Failed to load material image:', imageSrc);
                                        }}
                                      />
                                      <div 
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                        onClick={() => openImageView(imageSrc, material.materialName)}
                                      >
                                        <ZoomIn className="h-5 w-5 text-white" />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-12 w-12 rounded-lg border bg-gray-100 flex items-center justify-center">
                                    <ImageIcon className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
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
                                    {material.materialColor || ''}
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
                          );
                        })}
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
                  {selectedProductColors.length > 0 && (
                    <span className="ml-2 text-green-600">
                      • Colors selected: {selectedProductColors.join(', ')}
                    </span>
                  )}
                </div>
              )}
            </div>

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