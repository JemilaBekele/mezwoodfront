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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getItems } from '@/service/item';
import { getCategories, getSizes, getTypes } from '@/service/productConfiguration';
import { IItem } from '@/models/item';
import { IProductCategory, ISize, IProductType } from '@/models/productConfiguration';
import { toast } from 'sonner';
import { normalizeImagePath } from '@/lib/norm';
import { AlertModal } from '@/components/modal/alert-modal';
import { useRouter } from 'next/dist/client/components/navigation';
import { IconEdit, IconEye, IconTrash, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

const formatPrice = (price: unknown): string => {
  if (price === null || price === undefined) return '0.00';
  const numericPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  return isNaN(numericPrice) ? '0.00' : `${numericPrice.toFixed(2)}`;
};

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
}

interface ExtendedItem extends IItem {
  stockDetails?: StockDetails;
}

interface ItemCardProps {
  item: ExtendedItem;
  onSelectItem: (item: ExtendedItem) => void;
}

export const ItemCard = ({ item, onSelectItem }: ItemCardProps) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Carousel state for card
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  // Carousel state for modal
  const [modalImageIndex, setModalImageIndex] = useState(0);
  
  // State for delete modal
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get all images (main + additional)
  const getAllImages = useMemo(() => {
    const images: string[] = [];
    
    // Add main image first
    if (item.imageUrl) {
      images.push(normalizeImagePath(item.imageUrl) || item.imageUrl);
    }
    
    // Add additional images
    if (item.itemImages && item.itemImages.length > 0) {
      item.itemImages.forEach(img => {
        const normalized = normalizeImagePath(img.imageUrl) || img.imageUrl;
        if (normalized) {
          images.push(normalized);
        }
      });
    }
    
    return images;
  }, [item.imageUrl, item.itemImages]);

  const allImages = getAllImages;
  const hasMultipleImages = allImages.length > 1;

  // Auto-rotate carousel on card
  useEffect(() => {
    if (!isHovering || !hasMultipleImages) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isHovering, hasMultipleImages, allImages.length]);

  const currentImage = allImages[currentImageIndex] || '/placeholder-image.jpg';
  const formattedPrice = formatPrice(item.price);
  const stockDetails = item.stockDetails;
  const totalStock = stockDetails?.totalQuantity || item.stock || 0;

  // Handle carousel navigation
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Handle modal carousel navigation
  const nextModalImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevModalImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Handle Delete Confirmation
  const onConfirmDelete = async () => {
    try {
      setLoading(true);
      // Add your API delete call here:
      // await axios.delete(`/api/items/${item.id}`);
      console.log('Item deleted:', item.id);
      setOpenDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete item', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine stock status color
  const getStockColor = (quantity: number) => {
    if (quantity === 0) return 'text-red-600 dark:text-red-400';
    if (quantity < 10) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  // Open modal with carousel
  const openModal = () => {
    setIsModalOpen(true);
    setModalImageIndex(currentImageIndex);
  };

  return (
    <>
      {/* Delete confirmation Modal */}
      <AlertModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
      />

      <Card
        className="group flex h-full w-full flex-col cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => onSelectItem(item)}
      >
        <CardHeader className="relative p-0">
          <div className="relative aspect-video w-full overflow-hidden bg-gray-50 dark:bg-gray-800">
            {/* Image Carousel */}
            <div 
              className="relative w-full h-full"
              onClick={(e) => {
                e.stopPropagation();
                openModal();
              }}
            >
              <Image
                src={currentImage}
                alt={item.name}
                fill
                className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                onError={() => setImageError(true)}
              />
              
              {/* Image counter badge */}
              {hasMultipleImages && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                  {currentImageIndex + 1} / {allImages.length}
                </div>
              )}
              
              {/* Navigation arrows - only show on hover */}
              {hasMultipleImages && isHovering && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                    aria-label="Previous image"
                  >
                    <IconChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                    aria-label="Next image"
                  >
                    <IconChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
              
              {/* Dot indicators */}
              {hasMultipleImages && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {allImages.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentImageIndex
                          ? 'bg-white w-3'
                          : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-3 pb-1">
          <h3 className="line-clamp-1 text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {item.name}
          </h3>
          {item.color && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Color: {item.color}
            </p>
          )}
          
          {/* Stock indicator on card */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className={`text-sm font-medium ${getStockColor(totalStock)}`}>
                Total Stock: {totalStock}
              </div>
              {totalStock === 0 && (
                <span className="text-xs text-red-500 dark:text-red-400">(Out of Stock)</span>
              )}
              {totalStock > 0 && totalStock < 10 && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400">(Low Stock)</span>
              )}
            </div>
          </div>

          {/* Store and Showroom Stock Details - Directly on Card */}
          {stockDetails && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-xs pt-1 border-t border-gray-100 dark:border-gray-800">
                {stockDetails.stores && stockDetails.stores.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      📦 Store Stock:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {stockDetails.stores.slice(0, 3).map((store: any) => (
                        <span
                          key={store.storeId}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            store.quantity > 0
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {store.storeName.split(' ')[0]}: {store.quantity}
                        </span>
                      ))}
                      {stockDetails.stores.length > 3 && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          +{stockDetails.stores.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {stockDetails.showrooms && stockDetails.showrooms.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      🏢 Showroom Stock:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {stockDetails.showrooms.slice(0, 3).map((showroom: any) => (
                        <span
                          key={showroom.showroomId}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            showroom.quantity > 0
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {showroom.showroomName.split(' ')[0]}: {showroom.quantity}
                        </span>
                      ))}
                      {stockDetails.showrooms.length > 3 && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          +{stockDetails.showrooms.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Line */}
              <div className="flex justify-between text-xs pt-1 border-t border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Stores Total:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {stockDetails.totalStoreQuantity}
                </span>
                <span className="text-gray-500 dark:text-gray-400">Showrooms Total:</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {stockDetails.totalShowroomQuantity}
                </span>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 p-3 pt-2">
          {/* Price Container */}
          <div className="flex w-full items-center justify-between">
            <span className="text-lg font-extrabold text-gray-900 dark:text-gray-100">
              {formattedPrice}
            </span>
          </div>

          {/* Action Buttons Row */}
          <div className="flex w-full gap-2">
            <PermissionGuard requiredPermission={PERMISSIONS.PRODUCT.VIEW.name}>
              <button
                className="flex flex-1 items-center justify-center rounded-lg bg-gray-100 px-2 py-1.5 text-[12px] font-medium text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/Item/view?id=${item.id}`);
                }}
              >
                <IconEye className="mr-1 h-4 w-4" /> View
              </button>
            </PermissionGuard>
            
            <PermissionGuard requiredPermission={PERMISSIONS.PRODUCT.UPDATE.name}>
              <button
                className="flex flex-1 items-center justify-center rounded-lg bg-blue-600 px-2 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/Item/${item.id}`);
                }}
              >
                <IconEdit className="mr-1 h-4 w-4" /> Edit
              </button>
            </PermissionGuard>
            
            <PermissionGuard requiredPermission={PERMISSIONS.PRODUCT.DELETE.name}>
              <button
                className="flex items-center justify-center rounded-lg bg-red-100 px-2 py-1.5 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
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

      {/* View Modal with Carousel and Detailed Stock Breakdown */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 dark:bg-black/90 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              onClick={() => setIsModalOpen(false)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative bg-white dark:bg-gray-900 rounded-lg overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Modal Image Carousel */}
              <div className="relative aspect-video w-full bg-gray-900 dark:bg-black">
                <Image
                  src={allImages[modalImageIndex] || '/placeholder-image.jpg'}
                  alt={item.name}
                  fill
                  className="object-contain"
                  sizes="90vw"
                />
                
                {/* Modal Navigation Arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevModalImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                    >
                      <IconChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextModalImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                    >
                      <IconChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
                
                {/* Modal Image Counter */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                  {modalImageIndex + 1} / {allImages.length}
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-900">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {item.name}
                </h3>
                {item.category && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Category: {item.category.name}
                  </p>
                )}
                {item.type && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Type: {item.type.name}
                  </p>
                )}
                {item.size && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Size: {item.size.name}
                  </p>
                )}
                {item.color && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Color: {item.color}
                  </p>
                )}
                
                {/* Stock Breakdown Section */}
                {stockDetails ? (
                  <div className="mt-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
                      Stock Breakdown
                    </h4>
                    
                    {/* Store Stocks */}
                    {stockDetails.stores && stockDetails.stores.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          📦 Stores:
                        </p>
                        <div className="space-y-1 bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                          {stockDetails.stores.map((store: any) => (
                            <div key={store.storeId} className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                {store.storeName} {store.isMain && "(Main Store)"}:
                              </span>
                              <span className={`font-medium ${getStockColor(store.quantity)}`}>
                                {store.quantity}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gray-200 dark:border-gray-700 mt-1">
                            <span>Total Stores:</span>
                            <span className="font-bold">{stockDetails.totalStoreQuantity}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Showroom Stocks */}
                    {stockDetails.showrooms && stockDetails.showrooms.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          🏢 Showrooms:
                        </p>
                        <div className="space-y-1 bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                          {stockDetails.showrooms.map((showroom: any) => (
                            <div key={showroom.showroomId} className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                {showroom.showroomName} {showroom.isMain && "(Main Showroom)"}:
                              </span>
                              <span className={`font-medium ${getStockColor(showroom.quantity)}`}>
                                {showroom.quantity}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gray-200 dark:border-gray-700 mt-1">
                            <span>Total Showrooms:</span>
                            <span className="font-bold">{stockDetails.totalShowroomQuantity}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Grand Total */}
                    <div className="flex justify-between items-center text-base font-bold pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                      <span>Total Stock:</span>
                      <span className={`text-lg ${getStockColor(stockDetails.totalQuantity)}`}>
                        {stockDetails.totalQuantity}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Stock: {item.stock || 0}
                  </p>
                )}
                
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-4">
                  {formattedPrice}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface ProductListingProps {
  initialItems?: ExtendedItem[];
}

export default function ProductListing({ initialItems }: ProductListingProps) {
  const [items, setItems] = useState<ExtendedItem[]>(initialItems || []);
  const [categories, setCategories] = useState<IProductCategory[]>([]);
  const [sizes, setSizes] = useState<ISize[]>([]);
  const [types, setTypes] = useState<IProductType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [selectedSizeId, setSelectedSizeId] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Get available sizes based on selected category
  const availableSizes = useMemo(() => {
    if (!selectedCategoryId) return [];
    return sizes.filter(size => size.categoryId === selectedCategoryId);
  }, [sizes, selectedCategoryId]);

  // Get available types based on selected category and size
  const typesForSelectedSize = useMemo(() => {
    let filtered = [...types];
    
    if (selectedCategoryId) {
      filtered = filtered.filter(type => {
        const size = sizes.find(s => s.id === type.sizeId);
        return size?.categoryId === selectedCategoryId;
      });
    }
    
    if (selectedSizeId) {
      filtered = filtered.filter(type => type.sizeId === selectedSizeId);
    }
    
    return filtered;
  }, [types, sizes, selectedCategoryId, selectedSizeId]);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [itemsData, categoriesData, sizesData, typesData] = await Promise.all([
          getItems(),
          getCategories(),
          getSizes(),
          getTypes()
        ]);
        
        setItems(itemsData || []);
        setCategories(categoriesData);
        setSizes(sizesData);
        setTypes(typesData);
      } catch (error: any) {
        toast.error('Failed to load data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter items based on all criteria
  const filteredItems = useMemo(() => {
    let filtered = [...items];
    
    // Search by name
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(term)
      );
    }
    
    // Filter by category
    if (selectedCategoryId) {
      filtered = filtered.filter(item => {
        const itemCategoryId = item.categoryId || item.category?.id;
        return itemCategoryId === selectedCategoryId;
      });
    }
    
    // Filter by type
    if (selectedTypeId) {
      filtered = filtered.filter(item => {
        const itemTypeId = item.typeId || item.type?.id;
        return itemTypeId === selectedTypeId;
      });
    }
    
    // Filter by size
    if (selectedSizeId) {
      filtered = filtered.filter(item => {
        const itemSizeId = item.sizeId || item.size?.id;
        return itemSizeId === selectedSizeId;
      });
    }
    
    return filtered;
  }, [items, searchTerm, selectedCategoryId, selectedTypeId, selectedSizeId]);


  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Filter handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    setSelectedTypeId('');
    setSelectedSizeId('');
    setCurrentPage(1);
  };

  const handleTypeChange = (value: string) => {
    setSelectedTypeId(value);
    if (value) {
      const selectedType = types.find(t => t.id === value);
      if (selectedType && selectedType.sizeId) {
        setSelectedSizeId(selectedType.sizeId);
      }
    }
    setCurrentPage(1);
  };

  const handleSizeChange = (value: string) => {
    setSelectedSizeId(value);
    if (selectedTypeId) {
      const selectedType = types.find(t => t.id === selectedTypeId);
      if (selectedType && selectedType.sizeId !== value) {
        setSelectedTypeId('');
      }
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategoryId('');
    setSelectedTypeId('');
    setSelectedSizeId('');
    setCurrentPage(1);
  };

  const handleSelectItem = (item: ExtendedItem) => {
    console.log('Selected item:', item);
  };

  const hasActiveFilters = searchTerm || selectedCategoryId || selectedTypeId || selectedSizeId;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Filters Section */}
      <div className="w-full rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-900">
        <h2 className="mb-3 text-xl font-bold">Filter Products</h2>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search Input */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Search</Label>
            <Input
              type="text"
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
          
          {/* Category Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Category</Label>
            <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
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
          
          {/* Size Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Size</Label>
            <Select 
              value={selectedSizeId} 
              onValueChange={handleSizeChange}
              disabled={!selectedCategoryId}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedCategoryId ? "All Sizes" : "Select category first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                {availableSizes.map((size) => (
                  <SelectItem key={size.id} value={size.id}>
                    {size.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Type Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Product Type</Label>
            <Select 
              value={selectedTypeId} 
              onValueChange={handleTypeChange}
              disabled={!selectedCategoryId}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedCategoryId ? "All Types" : "Select category first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {typesForSelectedSize.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          Showing {filteredItems.length > 0 ? indexOfFirstItem + 1 : 0}-
          {Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} products
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {currentItems.length > 0 ? (
          currentItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onSelectItem={handleSelectItem}
            />
          ))
        ) : (
          <div className="col-span-full py-12 text-center">
            <p className="text-gray-500">No products found matching your criteria.</p>
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