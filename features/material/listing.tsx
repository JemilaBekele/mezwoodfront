/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { deleteMaterial, getMaterials } from '@/service/material';
import { IMaterial } from '@/models/material';
import { IMaterialCategory } from '@/models/materialCategory';
import { toast } from 'sonner';
import { normalizeImagePath } from '@/lib/norm';
import { getMaterialCategories } from '@/service/materialcatagory';
import { useRouter } from 'next/navigation';
import { AlertModal } from '@/components/modal/alert-modal';
import { IconEdit, IconEye, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

interface StockDetails {
  stores: Array<{
    storeId: string;
    storeName: string;
    isMain: boolean;
    quantity: number;
  }>;
  totalStoreQuantity: number;
  showrooms: Array<{
    showroomId: string;
    showroomName: string;
    isMain: boolean;
    quantity: number;
  }>;
  totalShowroomQuantity: number;
  totalQuantity: number;
  stock: number;
  stockByStatus?: Record<string, number>;
}

interface ExtendedMaterial extends IMaterial {
  stockDetails?: StockDetails;
  currentStock?: number;
}

interface MaterialCardProps {
  material: ExtendedMaterial;
  onSelectMaterial: (material: ExtendedMaterial) => void;
}

export const MaterialCard = ({ material, onSelectMaterial }: MaterialCardProps) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  
  // State for delete modal
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const imageUrl = imageError ? '/placeholder-image.jpg' : normalizeImagePath(material.imageUrl);
  const stockDetails = material.stockDetails;
  const totalStock = stockDetails?.totalQuantity || material.currentStock || 0;

  const onConfirmDelete = async () => {
    try {
      setLoading(true);
      await deleteMaterial(material.id);
      console.log('Material deleted:', material.id);
      setOpenDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete material', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockColor = (quantity: number) => {
    if (quantity === 0) return 'text-red-600 dark:text-red-400';
    if (quantity < 10) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getMaterialTypes = () => {
    const types = [];
    if (material.plainMDF) types.push('Plain MDF');
    if (material.laminatedMDF) types.push('Laminated MDF');
    if (material.wood) types.push('Wood');
    if (material.metal) types.push('Metal');
    if (material.accessory) types.push('Accessory');
    if (material.other) types.push('Other');
    return types;
  };

  return (
    <>
      <AlertModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
      />

      <Card
        className="group flex h-full w-full flex-col cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
        onClick={() => onSelectMaterial(material)}
      >
        <CardHeader className="relative p-0">
          <div className="relative aspect-video w-full overflow-hidden bg-gray-50 dark:bg-gray-800">
            <Image
              src={imageUrl || '/placeholder-image.jpg'}
              alt={material.name}
              fill
              className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              onError={() => setImageError(true)}
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-3 pb-1">
          <h3 className="line-clamp-1 text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {material.name}
          </h3>
          
          <div className="mt-1 flex flex-wrap gap-1">
            {getMaterialTypes().slice(0, 2).map((type) => (
              <span key={type} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {type}
              </span>
            ))}
          </div>

          <div className="mt-2 space-y-0.5">
            {material.color && (
              <p className="text-xs text-gray-500 dark:text-gray-400">Color: {material.color}</p>
            )}
            {material.unitOfMeasure && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                UOM: {material.unitOfMeasure.name} ({material.unitOfMeasure.symbol})
              </p>
            )}
          </div>
          
          <div className="mt-2 flex items-center gap-1">
            <div className={`text-sm font-medium ${getStockColor(totalStock)}`}>
              Total Stock: {totalStock}
            </div>
          </div>

          {stockDetails && (
            <div className="mt-3 space-y-2">
              {/* Store Stocks */}
                            <div className="flex justify-between text-xs pt-1 border-t border-gray-100 dark:border-gray-800">

              {stockDetails.stores?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Store Stock:</p>
                  <div className="flex flex-wrap gap-1">
                    {stockDetails.stores.slice(0, 3).map((store: any) => (
                      <span key={store.storeId} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${store.quantity > 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900' : 'bg-gray-100 text-gray-500'}`}>
                        {store.storeName.split(' ')[0]}: {store.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Showroom Stocks */}
              {stockDetails.showrooms?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Showroom Stock:</p>
                  <div className="flex flex-wrap gap-1">
                    {stockDetails.showrooms.slice(0, 3).map((showroom: any) => (
                      <span key={showroom.showroomId} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${showroom.quantity > 0 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900' : 'bg-gray-100 text-gray-500'}`}>
                        {showroom.showroomName.split(' ')[0]}: {showroom.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
  </div>
              <div className="flex justify-between text-xs pt-1 border-t border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Stores: <span className="text-blue-600 font-medium">{stockDetails.totalStoreQuantity}</span></span>
                <span className="text-gray-500">Showrooms: <span className="text-purple-600 font-medium">{stockDetails.totalShowroomQuantity}</span></span>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 p-3 pt-2">
          <div className="flex w-full gap-2">
                                  <PermissionGuard requiredPermission={PERMISSIONS.MATERIAL.UPDATE.name}>

            <button
              className="flex flex-1 items-center justify-center rounded-lg bg-gray-100 px-2 py-1.5 text-[12px] font-medium text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-white"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/Material/view?id=${material.id}`);
              }}
            >
              <IconEye className="mr-1 h-4 w-4" /> View
            </button>          </PermissionGuard>

                                <PermissionGuard requiredPermission={PERMISSIONS.MATERIAL.VIEW.name}>

         <Link href={`/dashboard/Material/${material.id}`}>
  <button
    className="flex flex-1 items-center justify-center rounded-lg bg-blue-600 px-2 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-blue-700"
  >
    <IconEdit className="mr-1 h-4 w-4" />
    Edit
  </button>
</Link>
          </PermissionGuard>
                                  <PermissionGuard requiredPermission={PERMISSIONS.MATERIAL.DELETE.name}>

            <button
              className="flex items-center justify-center rounded-lg bg-red-100 px-2 py-1.5 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-200 dark:bg-red-900/30"
              onClick={(e) => {
                e.stopPropagation();
                setOpenDeleteModal(true);
              }}
            >
              <IconTrash className="h-4 w-4" />
            </button>

                      </PermissionGuard>

          </div>
        </CardFooter>
      </Card>

    </>
  );
};

interface MaterialListingProps {
  initialMaterials?: ExtendedMaterial[];
}

export default function MaterialListingPage({ initialMaterials }: MaterialListingProps) {
  const [materials, setMaterials] = useState<ExtendedMaterial[]>(initialMaterials || []);
  const [categories, setCategories] = useState<IMaterialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  
  // Boolean filters
  const [filters, setFilters] = useState({
    plainMDF: false,
    laminatedMDF: false,
    wood: false,
    metal: false,
    accessory: false,
    other: false
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [materialsData, categoriesData] = await Promise.all([
          getMaterials(),
          getMaterialCategories()
        ]);
        
        
        setMaterials(materialsData || []);
        setCategories(categoriesData || []);
      } catch (error: any) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter materials based on all criteria
const filteredMaterials = useMemo(() => {
  let filtered = [...materials];
  

  
  // Search by name
  if (searchTerm && searchTerm.trim() !== '') {
    const term = searchTerm.toLowerCase().trim();
    filtered = filtered.filter(material => 
      material.name.toLowerCase().includes(term)
    );
  }
  
  // Filter by category - FIXED: Use material.materialType?.id instead of material.materialTypeId
  if (selectedCategoryId && selectedCategoryId !== 'all') {
    filtered = filtered.filter(material => {
      // Check if material has materialType object
      const categoryId = material.materialType?.id;
      return categoryId === selectedCategoryId;
    });
  }
  
  // Filter by boolean properties - FIXED: Check if these properties exist on the material
  if (filters.plainMDF) {
    filtered = filtered.filter(material => material.plainMDF === true);
  }
  if (filters.laminatedMDF) {
    filtered = filtered.filter(material => material.laminatedMDF === true);
  }
  if (filters.wood) {
    filtered = filtered.filter(material => material.wood === true);
  }
  if (filters.metal) {
    filtered = filtered.filter(material => material.metal === true);
  }
  if (filters.accessory) {
    filtered = filtered.filter(material => material.accessory === true);
  }
  if (filters.other) {
    filtered = filtered.filter(material => material.other === true);
  }
  
  return filtered;
}, [materials, searchTerm, selectedCategoryId, filters]);
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMaterials = filteredMaterials.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Filter handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handleBooleanFilterChange = (filterName: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: checked
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategoryId('');
    setFilters({
      plainMDF: false,
      laminatedMDF: false,
      wood: false,
      metal: false,
      accessory: false,
      other: false
    });
    setCurrentPage(1);
  };

  const handleSelectMaterial = (material: ExtendedMaterial) => {
    console.log('Selected material:', material);
  };

  const hasActiveFilters = searchTerm !== '' || selectedCategoryId !== '' || 
    filters.plainMDF || filters.laminatedMDF || filters.wood || filters.metal || filters.accessory || filters.other;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Filters Section */}
      <div className="w-full rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-900">
        <h2 className="mb-3 text-xl font-bold">Filter Materials</h2>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search Input */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Search</Label>
            <Input
              type="text"
              placeholder="Search by material name..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
          
          {/* Category Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Category</Label>
            <Select 
              value={selectedCategoryId || 'all'} 
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Material Type Filters - Checkboxes */}
        <div className="mt-4">
          <Label className="text-sm font-medium mb-2 block">Material Types</Label>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="plainMDF"
                checked={filters.plainMDF}
                onCheckedChange={(checked) => handleBooleanFilterChange('plainMDF', checked as boolean)}
              />
              <Label htmlFor="plainMDF" className="text-sm cursor-pointer">Plain MDF</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="laminatedMDF"
                checked={filters.laminatedMDF}
                onCheckedChange={(checked) => handleBooleanFilterChange('laminatedMDF', checked as boolean)}
              />
              <Label htmlFor="laminatedMDF" className="text-sm cursor-pointer">Laminated MDF</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wood"
                checked={filters.wood}
                onCheckedChange={(checked) => handleBooleanFilterChange('wood', checked as boolean)}
              />
              <Label htmlFor="wood" className="text-sm cursor-pointer">Wood</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="metal"
                checked={filters.metal}
                onCheckedChange={(checked) => handleBooleanFilterChange('metal', checked as boolean)}
              />
              <Label htmlFor="metal" className="text-sm cursor-pointer">Metal</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="accessory"
                checked={filters.accessory}
                onCheckedChange={(checked) => handleBooleanFilterChange('accessory', checked as boolean)}
              />
              <Label htmlFor="accessory" className="text-sm cursor-pointer">Accessory</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="other"
                checked={filters.other}
                onCheckedChange={(checked) => handleBooleanFilterChange('other', checked as boolean)}
              />
              <Label htmlFor="other" className="text-sm cursor-pointer">Other</Label>
            </div>
          </div>
        </div>
        
        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="mt-4">
            <Button onClick={clearFilters} variant="outline" className="w-full md:w-auto">
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="w-full rounded-lg border bg-white p-3 shadow-sm dark:bg-gray-900">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredMaterials.length > 0 ? indexOfFirstItem + 1 : 0}-
          {Math.min(indexOfLastItem, filteredMaterials.length)} of {filteredMaterials.length} materials
        </p>
      </div>

      {/* Materials Grid */}
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {currentMaterials.length > 0 ? (
          currentMaterials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              onSelectMaterial={handleSelectMaterial}
            />
          ))
        ) : (
          <div className="col-span-full py-12 text-center">
            <p className="text-gray-500">No materials found matching your criteria.</p>
            <Button onClick={clearFilters} variant="link" className="mt-2">
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? 'default' : 'outline'}
                onClick={() => paginate(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          
          <Button
            variant="outline"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}