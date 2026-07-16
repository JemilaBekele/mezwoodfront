// app/materials/[materialId]/form.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, X, AlertCircle, Loader2 } from 'lucide-react';

import { IMaterial } from '@/models/material';
import { IMaterialCategory } from '@/models/materialCategory';
import { IUnitOfMeasure } from '@/models/UnitOfMeasure';
import { createMaterial, updateMaterial } from '@/service/material';

import { normalizeImagePath } from '@/lib/norm';

interface MaterialFormProps {
  initialData: IMaterial | null;
  pageTitle: string;
  categories: IMaterialCategory[];
  unitsOfMeasure: IUnitOfMeasure[];
  isEdit: boolean;
}

interface ValidationErrors {
  name?: string;
  materialTypeId?: string;
  unitOfMeasureId?: string;
  color?: string;
  size?: string;
  image?: string;
}

// Material type options - defined once at the top level
const materialTypeOptions = [
  { id: 'plainMDF', label: 'Plain MDF' },
  { id: 'laminatedMDF', label: 'Laminated MDF' },
  { id: 'wood', label: 'Wood' },
  { id: 'metal', label: 'Metal' },
  { id: 'accessory', label: 'Accessory' },
  { id: 'other', label: 'Other' },
] as const;

export default function MaterialForm({
  initialData,
  pageTitle,
  categories,
  unitsOfMeasure,
  isEdit,
}: MaterialFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const formContainerRef = useRef<HTMLFormElement>(null);

  // Form fields
  const [name, setName] = useState(initialData?.name || '');
  const [color, setColor] = useState(initialData?.color || '');
  const [size, setSize] = useState(initialData?.size || '');
  const [materialTypeId, setMaterialTypeId] = useState(initialData?.materialTypeId || '');
  const [unitOfMeasureId, setUnitOfMeasureId] = useState(initialData?.unitOfMeasureId || '');
  
  // Boolean flags for material types
  const [plainMDF, setPlainMDF] = useState(initialData?.plainMDF || false);
  const [laminatedMDF, setLaminatedMDF] = useState(initialData?.laminatedMDF || false);
  const [wood, setWood] = useState(initialData?.wood || false);
  const [metal, setMetal] = useState(initialData?.metal || false);
  const [accessory, setAccessory] = useState(initialData?.accessory || false);
  const [other, setOther] = useState(initialData?.other || false);
  
  // Image handling
  const [imageUrl, setImageUrl] = useState<string>(initialData?.imageUrl || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(() => {
    if (initialData?.imageUrl) {
      return normalizeImagePath(initialData.imageUrl) || '';
    }
    return '';
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  // Validation functions
  const validateName = (value: string): string | undefined => {
    if (!value.trim()) return 'Material name is required';
    if (value.length < 2) return 'Material name must be at least 2 characters';
    if (value.length > 100) return 'Material name must be less than 100 characters';
    return undefined;
  };

  const validateMaterialType = (value: string): string | undefined => {
    if (!value) return 'Material category is required';
    return undefined;
  };

  const validateUnitOfMeasure = (value: string): string | undefined => {
    if (!value) return 'Unit of measure is required';
    return undefined;
  };

  const validateColor = (value: string): string | undefined => {
    if (value && value.length > 50) return 'Color must be less than 50 characters';
    return undefined;
  };

  const validateSize = (value: string): string | undefined => {
    if (value && value.length > 50) return 'Size must be less than 50 characters';
    return undefined;
  };

  // Real-time validation
  useEffect(() => {
    if (touched.name) {
      setErrors(prev => ({ ...prev, name: validateName(name) }));
    }
  }, [name, touched.name]);

  useEffect(() => {
    if (touched.materialTypeId) {
      setErrors(prev => ({ ...prev, materialTypeId: validateMaterialType(materialTypeId) }));
    }
  }, [materialTypeId, touched.materialTypeId]);

  useEffect(() => {
    if (touched.unitOfMeasureId) {
      setErrors(prev => ({ ...prev, unitOfMeasureId: validateUnitOfMeasure(unitOfMeasureId) }));
    }
  }, [unitOfMeasureId, touched.unitOfMeasureId]);

  useEffect(() => {
    if (touched.color) {
      setErrors(prev => ({ ...prev, color: validateColor(color) }));
    }
  }, [color, touched.color]);

  useEffect(() => {
    if (touched.size) {
      setErrors(prev => ({ ...prev, size: validateSize(size) }));
    }
  }, [size, touched.size]);

  const validateForm = () => {
    const nameError = validateName(name);
    const materialTypeError = validateMaterialType(materialTypeId);
    const unitOfMeasureError = validateUnitOfMeasure(unitOfMeasureId);
    const colorError = validateColor(color);
    const sizeError = validateSize(size);

    const newErrors = {
      name: nameError,
      materialTypeId: materialTypeError,
      unitOfMeasureId: unitOfMeasureError,
      color: colorError,
      size: sizeError,
    };

    setErrors(newErrors);
    
    // Mark all fields as touched
    setTouched({
      name: true,
      materialTypeId: true,
      unitOfMeasureId: true,
      color: true,
      size: true,
    });

    return !Object.values(newErrors).some(error => error !== undefined);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      // Clean up old preview
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }

      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setImageUrl(''); // Clear URL when file is selected
    }
  };

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    // Normalize the URL for preview
    const normalizedUrl = normalizeImagePath(url);
    setImagePreview(normalizedUrl || url);
    setImageFile(null); // Clear file when URL is provided
    
    // Clean up blob URL if exists
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImageFile(null);
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview('');
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Prepare the base data object
      const baseData: Partial<IMaterial> = {
        name,
        color,
        size,
        materialTypeId,
        unitOfMeasureId,
        plainMDF,
        laminatedMDF,
        wood,
        metal,
        accessory,
        other,
      };

      let response;
      
      // If there's an image file, use FormData
      if (imageFile) {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('color', color);
        formData.append('size', size);
        formData.append('materialTypeId', materialTypeId);
        formData.append('unitOfMeasureId', unitOfMeasureId);
        formData.append('plainMDF', String(plainMDF));
        formData.append('laminatedMDF', String(laminatedMDF));
        formData.append('wood', String(wood));
        formData.append('metal', String(metal));
        formData.append('accessory', String(accessory));
        formData.append('other', String(other));
        formData.append('image', imageFile);
        
        if (isEdit && initialData?.id) {
          response = await updateMaterial(initialData.id, formData);

             router.push('/dashboard/Material'); // Navigate to materials list page
      router.refresh();
        } else {
          response = await createMaterial(formData);
            // Now response is accessible here
            router.push(`/dashboard/Material/initial?id=${response?.material?.id}`);
                  router.refresh();
        }
      } else {
        // Use regular object for URL or no image
        const payload = { ...baseData };
        if (imageUrl) {
          payload.imageUrl = imageUrl;
        }
        
        if (isEdit && initialData?.id) {
          response = await updateMaterial(initialData.id, payload);
          router.push('/dashboard/Material'); // Navigate to materials list page
          router.refresh();
        } else {
          response = await createMaterial(payload);
          // console.log(response.material);
          router.push(`/dashboard/Material/initial?id=${response?.material?.id}`);
          router.refresh();
        }
      }

      toast.success(isEdit ? 'Material updated successfully' : 'Material created successfully');
   
    } catch (error: any) {
      toast.error(error.message || 'Failed to save material');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle checkbox change for material types
// Replace the existing handleMaterialTypeChange function with this:

const handleMaterialTypeChange = (type: string, checked: boolean) => {
  // If unchecking the current item, don't allow it (optional - keeps at least one selected)
  if (!checked) return;
  
  // Set all to false first, then set the selected one to true
  setPlainMDF(type === 'plainMDF');
  setLaminatedMDF(type === 'laminatedMDF');
  setWood(type === 'wood');
  setMetal(type === 'metal');
  setAccessory(type === 'accessory');
  setOther(type === 'other');
};
  const handleGoBack = () => {
    router.back();
  };

  const safeImageSrc = imagePreview || (imageUrl ? normalizeImagePath(imageUrl) : null);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header with back button */}
      
       <h1 className="text-2xl font-bold text-gray-900">
            {pageTitle}
          </h1>

        {/* Form Card */}
        <Card className="mx-auto w-full ">
          
          <CardContent className="p-4 sm:p-6">
            
            <form onSubmit={handleSubmit} className="space-y-6" ref={formContainerRef}>
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Material Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Material Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g., Oak Wood, Steel Sheet, MDF Board"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => handleBlur('name')}
                      className={errors.name && touched.name ? 'border-red-500' : ''}
                      aria-invalid={!!(errors.name && touched.name)}
                    />
                    {errors.name && touched.name && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Material Category */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Material Category <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={materialTypeId}
                      onValueChange={(value) => {
                        setMaterialTypeId(value);
                        handleBlur('materialTypeId');
                      }}
                    >
                      <SelectTrigger 
                        className={errors.materialTypeId && touched.materialTypeId ? 'border-red-500' : ''}
                      >
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No categories available
                          </SelectItem>
                        ) : (
                          categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.materialTypeId && touched.materialTypeId && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.materialTypeId}
                      </p>
                    )}
                  </div>

                  {/* Unit of Measure */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Unit of Measure <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={unitOfMeasureId}
                      onValueChange={(value) => {
                        setUnitOfMeasureId(value);
                        handleBlur('unitOfMeasureId');
                      }}
                    >
                      <SelectTrigger 
                        className={errors.unitOfMeasureId && touched.unitOfMeasureId ? 'border-red-500' : ''}
                      >
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitsOfMeasure.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No units available
                          </SelectItem>
                        ) : (
                          unitsOfMeasure.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.name} {unit.symbol ? `(${unit.symbol})` : ''}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.unitOfMeasureId && touched.unitOfMeasureId && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.unitOfMeasureId}
                      </p>
                    )}
                  </div>

                  {/* Color */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Color / Finish</label>
                    <Input
                      placeholder="e.g., Natural, White, Black, Cherry"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      onBlur={() => handleBlur('color')}
                      className={errors.color && touched.color ? 'border-red-500' : ''}
                    />
                    {errors.color && touched.color && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.color}
                      </p>
                    )}
                  </div>

                  {/* Size / Dimensions */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Size / Dimensions</label>
                    <Input
                      placeholder="e.g., 4x8 ft, 1/2 inch, 2m x 1m"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      onBlur={() => handleBlur('size')}
                      className={errors.size && touched.size ? 'border-red-500' : ''}
                    />
                    {errors.size && touched.size && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.size}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Material Type Flags Section */}
<div className="space-y-4">
  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
    Material Classification
  </h3>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
    {materialTypeOptions.map((option) => (
      <div key={option.id} className="flex items-center space-x-2">
        <input
          type="radio"
          id={option.id}
          name="materialType"
          checked={
            option.id === 'plainMDF' ? plainMDF :
            option.id === 'laminatedMDF' ? laminatedMDF :
            option.id === 'wood' ? wood :
            option.id === 'metal' ? metal :
            option.id === 'accessory' ? accessory :
            other
          }
          onChange={() => {
            // Set the selected type to true, others to false
            setPlainMDF(option.id === 'plainMDF');
            setLaminatedMDF(option.id === 'laminatedMDF');
            setWood(option.id === 'wood');
            setMetal(option.id === 'metal');
            setAccessory(option.id === 'accessory');
            setOther(option.id === 'other');
          }}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
        />
        <Label htmlFor={option.id} className="text-sm cursor-pointer">
          {option.label}
        </Label>
      </div>
    ))}
  </div>
  <p className="text-xs text-gray-500">
    Select one material classification type
  </p>
</div>

              {/* Image Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Material Image
                </h3>
                
                <div className="space-y-2">
                  {safeImageSrc && (
                    <div className="relative inline-block">
                      <div className="relative h-24 w-24 sm:h-32 sm:w-32 overflow-hidden rounded-lg border">
                        <Image
                          src={safeImageSrc}
                          alt="Material preview"
                          fill
                          className="object-cover"
                          onError={() => {
                            console.error('Failed to load image:', safeImageSrc);
                            toast.error('Failed to load image');
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -right-2 -top-2 h-5 w-5 sm:h-6 sm:w-6"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
               

                    <div>
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        className="w-full sm:w-auto"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Image
                      </Button>
                    </div>
                  </div>
                  
                  {errors.image && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.image}
                    </p>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t mt-4">
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleGoBack}
                    className="w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isEdit ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      isEdit ? 'Update Material' : 'Create Material'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}