/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Image from 'next/image';
import { Modal } from '@/components/ui/modal';
import { IItem } from '@/models/item';
import { ICustomer } from '@/models/customer';
import Select from 'react-select';
import { createCustomer, getCustomer } from '@/service/customer';
import { toast } from 'sonner';
import { createSell } from '@/service/Sell';
import { normalizeImagePath } from '@/lib/norm';
import { SaleStatus } from '@/models/Sell';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { IProductCategory, IProductType, ISize } from '@/models/productConfiguration';
import { getStoresAll } from '@/service/store';
import { getShowroomsAll } from '@/service/showroom';



const formatPrice = (price: unknown): string => {
  if (price === null || price === undefined) return '0.00';
  const numericPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  return isNaN(numericPrice) ? '0.00' : `${numericPrice.toFixed(2)}`;
};

// ==================== CREATE CUSTOMER MODAL ====================
interface CreateCustomerModalProps {
  closeModal: () => void;
  onSuccess: () => void;
}

const CreateCustomerModal = ({ closeModal, onSuccess }: CreateCustomerModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    phone1: '',
    phone2: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createCustomer(formData);
      toast.success('Customer created successfully');
      onSuccess();
      closeModal();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title='Create New Customer'
      description='Fill in the customer details'
      isOpen={true}
      onClose={closeModal}
      size='lg'
    >
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Name *</Label>
            <Input
              id='name'
              required
              value={formData.name}
              onChange={handleChange}
              placeholder='Customer name'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='companyName'>Company Name</Label>
            <Input
              id='companyName'
              value={formData.companyName}
              onChange={handleChange}
              placeholder='Company name'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='phone1'>Phone 1 *</Label>
            <Input
              id='phone1'
              required
              value={formData.phone1}
              onChange={handleChange}
              placeholder='Primary phone number'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='phone2'>Phone 2</Label>
            <Input
              id='phone2'
              value={formData.phone2}
              onChange={handleChange}
              placeholder='Secondary phone number'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              value={formData.email}
              onChange={handleChange}
              placeholder='Email address'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='city'>City</Label>
            <Input
              id='city'
              value={formData.city}
              onChange={handleChange}
              placeholder='City'
            />
          </div>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='address'>Address</Label>
          <Textarea
            id='address'
            value={formData.address}
            onChange={handleChange}
            placeholder='Full address'
            rows={2}
          />
        </div>
        <div className='flex justify-end space-x-2 pt-4'>
          <Button variant='outline' type='button' onClick={closeModal}>
            Cancel
          </Button>
          <Button type='submit' disabled={loading}>
            {loading ? 'Creating...' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ==================== ITEM CARD COMPONENT ====================
interface ItemCardProps {
  item: IItem;
  onSelectItem: (item: IItem) => void;
}

const ItemCard = ({ item, onSelectItem }: ItemCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Carousel state for card
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  // Carousel state for modal
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Get all images (main + additional)
  const getAllImages = useMemo(() => {
    const images: string[] = [];
    
    // Add main image first
    if (item.imageUrl) {
      const normalized = normalizeImagePath(item.imageUrl);
      if (normalized) {
        images.push(normalized);
      }
    }
    
    // Add additional images
    if (item.itemImages && item.itemImages.length > 0) {
      item.itemImages.forEach(img => {
        const normalized = normalizeImagePath(img.imageUrl);
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

  const currentImage = allImages[currentImageIndex] || (imageError ? '/placeholder-image.jpg' : '/placeholder-image.jpg');
  const formattedPrice = formatPrice(item.price);

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

  // Open modal with carousel
  const openModal = () => {
    setIsModalOpen(true);
    setModalImageIndex(currentImageIndex);
  };

  // Get stock by location
  const getStockByLocation = useMemo(() => {
    const stores: { name: string; quantity: number; isMain?: boolean }[] = [];
    const showrooms: { name: string; quantity: number; isMain?: boolean }[] = [];

    if (item.stockDetails?.stores) {
      item.stockDetails.stores.forEach((store: any) => {
        stores.push({
          name: store.storeName,
          quantity: store.quantity,
          isMain: store.isMain
        });
      });
    }

    if (item.stockDetails?.showrooms) {
      item.stockDetails.showrooms.forEach((showroom: any) => {
        showrooms.push({
          name: showroom.showroomName,
          quantity: showroom.quantity,
          isMain: showroom.isMain
        });
      });
    }

    return { stores, showrooms, totalStock: item.stockDetails?.totalQuantity || 0 };
  }, [item.stockDetails]);

  const hasStock = getStockByLocation.totalStock > 0;

  return (
    <>
      <Card
        className="group flex h-full w-full flex-col cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => onSelectItem(item)}
      >
        <CardHeader className="relative p-0">
          <div className="relative aspect-video w-full overflow-hidden bg-gray-50 dark:bg-gray-800">
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
              
              {/* Stock Status Badge */}
              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                hasStock 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
              }`}>
                {hasStock ? `In Stock (${getStockByLocation.totalStock})` : 'Out of Stock'}
              </div>
              
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
          {/* Product Name */}
          <h3 className="line-clamp-1 text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {item.name}
          </h3>
          
          {/* Category, Type, Size Badges */}
          <div className="mt-2 flex flex-wrap gap-1">
            {item.category && (
              <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                {item.category.name}
              </span>
            )}
            {item.type && (
              <span className="inline-flex items-center rounded-full bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
                {item.type.name}
              </span>
            )}
            {item.size && (
              <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
                {item.size.name}
              </span>
            )}
          </div>
          
          {/* Color */}
          {item.color && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Color: {item.color}
            </p>
          )}

          {/* Stock by Location - Store */}
          {getStockByLocation.stores.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Stores:
              </p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {getStockByLocation.stores.map((store, index) => (
                  <span key={index} className="inline-flex items-center gap-1 rounded bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 text-xs text-blue-700 dark:text-blue-300">
                    <span>{store.name}</span>
                    <span className="font-semibold">({store.quantity})</span>
                    {store.isMain && (
                      <span className="text-[10px] bg-blue-200 dark:bg-blue-800 px-1 rounded">Main</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stock by Location - Showroom */}
          {getStockByLocation.showrooms.length > 0 && (
            <div className="mt-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Showrooms:
              </p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {getStockByLocation.showrooms.map((showroom, index) => (
                  <span key={index} className="inline-flex items-center gap-1 rounded bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 text-xs text-purple-700 dark:text-purple-300">
                    <span>{showroom.name}</span>
                    <span className="font-semibold">({showroom.quantity})</span>
                    {showroom.isMain && (
                      <span className="text-[10px] bg-purple-200 dark:bg-purple-800 px-1 rounded">Main</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between p-3 pt-2">
          <span className="text-lg font-extrabold text-gray-900 dark:text-gray-100">
            {formattedPrice}
          </span>

          <button
            className={`rounded-lg px-4 py-1.5 text-[13px] font-medium text-white transition-colors ${
              hasStock
                ? 'bg-[#0f172a] dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-500'
                : 'bg-gray-400 cursor-not-allowed dark:bg-gray-600'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (hasStock) {
                openModal();
              }
            }}
            disabled={!hasStock}
          >
            {hasStock ? 'View' : 'Out of Stock'}
          </button>
        </CardFooter>
      </Card>

      {/* View Modal with Carousel */}
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
                {/* Product Name */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {item.name}
                </h3>
                
                {/* Category, Type, Size Details */}
                <div className="mt-2 space-y-1">
                  {item.category && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Category:</span> {item.category.name}
                    </p>
                  )}
                  {item.type && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span> {item.type.name}
                    </p>
                  )}
                  {item.size && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Size:</span> {item.size.name}
                    </p>
                  )}
                  {item.color && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Color:</span> {item.color}
                    </p>
                  )}
                </div>

                {/* Stock Details by Location - Modal */}
                <div className="mt-3 border-t pt-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stock by Location:
                  </p>
                  
                  {/* Stores Stock */}
                  {getStockByLocation.stores.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Stores:</p>
                      <div className="space-y-1 mt-1">
                        {getStockByLocation.stores.map((store, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {store.name} {store.isMain && <span className="text-xs text-blue-500">(Main)</span>}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {store.quantity} units
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Showrooms Stock */}
                  {getStockByLocation.showrooms.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Showrooms:</p>
                      <div className="space-y-1 mt-1">
                        {getStockByLocation.showrooms.map((showroom, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {showroom.name} {showroom.isMain && <span className="text-xs text-purple-500">(Main)</span>}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {showroom.quantity} units
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total Stock */}
                  <div className="mt-2 pt-2 border-t flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Stock:</span>
                    <span className={`text-sm font-bold ${hasStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {getStockByLocation.totalStock} units
                    </span>
                  </div>
                </div>
                
                {/* Price */}
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-3">
                  {formattedPrice}
                </p>

                {/* Add to Cart disabled if out of stock */}
                {!hasStock && (
                  <p className="text-sm text-red-500 mt-2">⚠️ This item is currently out of stock</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ==================== ITEM SELECTION MODAL ====================
// ==================== ITEM CARD COMPONENT ====================
interface ItemCardProps {
  item: IItem;
  onSelectItem: (item: IItem) => void;
}

// ==================== ITEM SELECTION MODAL ====================
interface ItemModalProps {
  item: IItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    item: IItem, 
    quantity: number, 
    customPrice?: number, 
    storeId?: string, 
    showroomId?: string,
    locationName?: string,
    locationType?: 'store' | 'showroom'
  ) => void;
}

const ItemModal = ({ item, isOpen, onClose, onAddToCart }: ItemModalProps) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [selectedShowroomId, setSelectedShowroomId] = useState<string>('');
  const [stores, setStores] = useState<any[]>([]);
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationType, setLocationType] = useState<'store' | 'showroom'>('store');
  const [selectedLocationName, setSelectedLocationName] = useState<string>('');

  // Fetch stores and showrooms when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchStoresAndShowrooms();
      // Reset selections
      setSelectedStoreId('');
      setSelectedShowroomId('');
      setSelectedLocationName('');
      setQuantity(1);
      setCustomPrice('');
      setLocationType('store');
    }
  }, [isOpen]);

  const fetchStoresAndShowrooms = async () => {
    setLoading(true);
    try {
      const [storesData, showroomsData] = await Promise.all([
        getStoresAll(),
        getShowroomsAll()
      ]);
      setStores(storesData || []);
      setShowrooms(showroomsData || []);
    } catch (error) {
      console.error('Error fetching stores/showrooms:', error);
      toast.error('Failed to load stores and showrooms');
    } finally {
      setLoading(false);
    }
  };

  // Get available stock for selected location
  const getAvailableStock = useMemo(() => {
    if (!item?.stockDetails) return 0;

    if (locationType === 'store' && selectedStoreId) {
      const storeStock = item.stockDetails.stores?.find(
        (s: any) => s.storeId === selectedStoreId
      );
      return storeStock?.quantity || 0;
    }

    if (locationType === 'showroom' && selectedShowroomId) {
      const showroomStock = item.stockDetails.showrooms?.find(
        (s: any) => s.showroomId === selectedShowroomId
      );
      return showroomStock?.quantity || 0;
    }

    return 0;
  }, [item, locationType, selectedStoreId, selectedShowroomId]);

  // Get available locations with stock
  const availableStores = useMemo(() => {
    if (!item?.stockDetails?.stores) return [];
    return item.stockDetails.stores.filter((s: any) => s.quantity > 0);
  }, [item]);

  const availableShowrooms = useMemo(() => {
    if (!item?.stockDetails?.showrooms) return [];
    return item.stockDetails.showrooms.filter((s: any) => s.quantity > 0);
  }, [item]);

  const handleAddToCart = () => {
    if (!item) return;
    
    const price = customPrice ? parseFloat(customPrice) : item.price;
    const availableStock = getAvailableStock;
    
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    
    if (quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    
    if (quantity > availableStock) {
      toast.error(`Not enough stock. Only ${availableStock} available.`);
      return;
    }

    // Validate location selection
    if (locationType === 'store' && !selectedStoreId) {
      toast.error('Please select a store');
      return;
    }

    if (locationType === 'showroom' && !selectedShowroomId) {
      toast.error('Please select a showroom');
      return;
    }
    
    // Get location name
    let locationName = '';
    if (locationType === 'store') {
      const store = stores.find(s => s.id === selectedStoreId);
      locationName = store?.name || '';
    } else if (locationType === 'showroom') {
      const showroom = showrooms.find(s => s.id === selectedShowroomId);
      locationName = showroom?.name || '';
    }
    
    onAddToCart(
      item, 
      quantity, 
      price, 
      locationType === 'store' ? selectedStoreId : undefined,
      locationType === 'showroom' ? selectedShowroomId : undefined,
      locationName,
      locationType
    );
    onClose();
    setQuantity(1);
    setCustomPrice('');
    setSelectedStoreId('');
    setSelectedShowroomId('');
    setSelectedLocationName('');
    setLocationType('store');
  };

  if (!item) return null;

  const hasAvailableStock = availableStores.length > 0 || availableShowrooms.length > 0;

  return (
    <Modal
      title={`Add ${item.name} to Cart`}
      description='Select location and set quantity'
      isOpen={isOpen}
      onClose={onClose}
      size='md'
    >
      <div className='space-y-4 py-4'>
        {/* Price Section */}
        <div className='space-y-2'>
          <Label htmlFor='price'>Unit Price</Label>
          <Input
            id='price'
            type='number'
            min='0'
            step='0.01'
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
            placeholder={`Default: ${formatPrice(item.price)}`}
          />
          <p className='text-xs text-gray-500'>
            Leave empty to use default price
          </p>
        </div>

        {/* Location Type Selection - Radio Buttons */}
        <div className='space-y-2'>
          <Label>Select Location Type</Label>
          <div className='flex gap-4'>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='radio'
                value='store'
                checked={locationType === 'store'}
                onChange={() => {
                  setLocationType('store');
                  setSelectedStoreId('');
                  setSelectedShowroomId('');
                  setSelectedLocationName('');
                  setQuantity(1);
                }}
                disabled={availableStores.length === 0}
                className='w-4 h-4 text-blue-600'
              />
              <span className={`text-sm ${availableStores.length === 0 ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                Store ({availableStores.length} available)
              </span>
            </label>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='radio'
                value='showroom'
                checked={locationType === 'showroom'}
                onChange={() => {
                  setLocationType('showroom');
                  setSelectedStoreId('');
                  setSelectedShowroomId('');
                  setSelectedLocationName('');
                  setQuantity(1);
                }}
                disabled={availableShowrooms.length === 0}
                className='w-4 h-4 text-purple-600'
              />
              <span className={`text-sm ${availableShowrooms.length === 0 ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                Showroom ({availableShowrooms.length} available)
              </span>
            </label>
          </div>
          {!hasAvailableStock && (
            <p className='text-xs text-red-500'>⚠️ This item is out of stock in all locations</p>
          )}
        </div>

        {/* Location Selection based on type */}
        {locationType === 'store' && availableStores.length > 0 && (
          <div className='space-y-2'>
            <Label htmlFor='store'>Select Store</Label>
            <div className='space-y-2 max-h-40 overflow-y-auto'>
              {availableStores.map((store: any) => (
                <label
                  key={store.storeId}
                  className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                    selectedStoreId === store.storeId
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className='flex items-center gap-3 flex-1'>
                    <input
                      type='radio'
                      name='store'
                      value={store.storeId}
                      checked={selectedStoreId === store.storeId}
                      onChange={() => {
                        setSelectedStoreId(store.storeId);
                        setSelectedLocationName(store.storeName);
                        setQuantity(1);
                      }}
                      className='w-4 h-4 text-blue-600'
                    />
                    <div>
                      <span className='font-medium text-sm text-gray-700 dark:text-gray-300'>
                        {store.storeName}
                      </span>
                      {store.isMain && (
                        <span className='ml-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-1.5 py-0.5 rounded'>
                          Main
                        </span>
                      )}
                    </div>
                  </div>
                  <span className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                    {store.quantity} units
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {locationType === 'showroom' && availableShowrooms.length > 0 && (
          <div className='space-y-2'>
            <Label htmlFor='showroom'>Select Showroom</Label>
            <div className='space-y-2 max-h-40 overflow-y-auto'>
              {availableShowrooms.map((showroom: any) => (
                <label
                  key={showroom.showroomId}
                  className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                    selectedShowroomId === showroom.showroomId
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className='flex items-center gap-3 flex-1'>
                    <input
                      type='radio'
                      name='showroom'
                      value={showroom.showroomId}
                      checked={selectedShowroomId === showroom.showroomId}
                      onChange={() => {
                        setSelectedShowroomId(showroom.showroomId);
                        setSelectedLocationName(showroom.showroomName);
                        setQuantity(1);
                      }}
                      className='w-4 h-4 text-purple-600'
                    />
                    <div>
                      <span className='font-medium text-sm text-gray-700 dark:text-gray-300'>
                        {showroom.showroomName}
                      </span>
                      {showroom.isMain && (
                        <span className='ml-2 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 px-1.5 py-0.5 rounded'>
                          Main
                        </span>
                      )}
                    </div>
                  </div>
                  <span className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                    {showroom.quantity} units
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Selected Location Stock Info */}
        {getAvailableStock > 0 && (
          <div className='rounded-md bg-green-50 dark:bg-green-900/20 p-2'>
            <p className='text-sm text-green-700 dark:text-green-300'>
              ✅ Selected: <span className='font-bold'>{selectedLocationName}</span> - Available stock: <span className='font-bold'>{getAvailableStock} units</span>
            </p>
          </div>
        )}

        {/* Quantity Section */}
        <div className='space-y-2'>
          <Label htmlFor='quantity'>Quantity</Label>
          <Input
            id='quantity'
            type='number'
            min='1'
            max={getAvailableStock || 1}
            value={quantity}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val >= 1 && val <= (getAvailableStock || 1)) {
                setQuantity(val);
              }
            }}
            disabled={!getAvailableStock}
          />
          <div className='flex justify-between text-xs text-gray-500'>
            <span>Available: {getAvailableStock || 0} units</span>
            {selectedStoreId || selectedShowroomId ? (
              <span className='text-green-600 dark:text-green-400'>✓ Location selected</span>
            ) : (
              <span className='text-yellow-600 dark:text-yellow-400'>Please select a location</span>
            )}
          </div>
        </div>

        <div className='flex justify-end space-x-2 pt-4'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddToCart}
            disabled={!getAvailableStock || !(selectedStoreId || selectedShowroomId) || quantity > getAvailableStock}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ==================== CART ITEM INTERFACE ====================
interface CartItem {
  id: string;
  item: IItem;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  storeId?: string;
  showroomId?: string;
  locationType?: 'store' | 'showroom';
  locationName?: string;
}

// ==================== CART COMPONENT ====================
interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onResetCart: () => void;
  onCreateOrderSuccess: () => void;
}

const Cart = ({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onResetCart,
  onCreateOrderSuccess 
}: CartProps) => {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isOrderConfirmModalOpen, setIsOrderConfirmModalOpen] = useState(false);
  const [customerError, setCustomerError] = useState<string>('');
  const [stores, setStores] = useState<any[]>([]);
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [deliveryDateError, setDeliveryDateError] = useState<string>('');

  const validateForm = () => {
    let isValid = true;
    
    if (!selectedCustomer) {
      setCustomerError('Customer selection is required');
      isValid = false;
    } else {
      setCustomerError('');
    }
    
    if (!deliveryDate) {
      setDeliveryDateError('Delivery date is required');
      isValid = false;
    } else {
      setDeliveryDateError('');
    }
    
    return isValid;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersData, storesData, showroomsData] = await Promise.all([
          getCustomer(),
          getStoresAll(),
          getShowroomsAll()
        ]);
        setCustomers(customersData);
        setStores(storesData || []);
        setShowrooms(showroomsData || []);
        
        // Set default delivery date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDeliveryDate(tomorrow.toISOString().split('T')[0]);
      } catch (err: any) {
        toast.error(err.message || 'Failed to fetch data');
      }
    };

    fetchData();
  }, []);

  const handleRefreshCustomers = async () => {
    try {
      setLoading(true);
      const [customersData, storesData, showroomsData] = await Promise.all([
        getCustomer(),
        getStoresAll(),
        getShowroomsAll()
      ]);
      setCustomers(customersData);
      setStores(storesData || []);
      setShowrooms(showroomsData || []);
      toast.success('Data refreshed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const grandTotal = subtotal - discount;

  const handleCreateOrder = async () => {
    if (!validateForm()) {
      return;
    }
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const orderData: any = {
      customerId: selectedCustomer,
      discount,
      grandTotal: grandTotal,
      subTotal: subtotal,
      notes: notes || undefined,
      saleStatus: SaleStatus.NOT_APPROVED,
      saleDate: new Date().toISOString(),
      deliveryDate: new Date(deliveryDate).toISOString(),
      totalProducts: items.length,
      items: items.map(cartItem => ({
        itemId: cartItem.item.id,
        quantity: cartItem.quantity,
        unitPrice: cartItem.unitPrice,
        totalPrice: cartItem.totalPrice,
        storeId: cartItem.storeId || null,
        showroomId: cartItem.showroomId || null,
        locationName: cartItem.locationName || null,
        locationType: cartItem.locationType || null,
      })),
    };

    setLoading(true);
    try {
      await createSell(orderData);
      toast.success('Order created successfully!');
      setSelectedCustomer('');
      setDiscount(0);
      setNotes('');
      setDeliveryDate('');
      onResetCart();
      setIsOrderConfirmModalOpen(false);
      onCreateOrderSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (!selectedCustomer) {
      setCustomerError('Please select a customer first');
      return;
    }
    if (!deliveryDate) {
      setDeliveryDateError('Please select a delivery date');
      return;
    }
    setIsOrderConfirmModalOpen(true);
  };

  const selectedCustomerDetails = customers.find(
    (c) => c.id === selectedCustomer
  );

  const customerOptions = useMemo(() => {
    return customers
      .filter(customer => customer.id && customer.name)
      .map((customer) => ({
        value: customer.id!,
        label: `${customer.name || ''} ${customer.companyName || ''} ${customer.phone1 || ''} ${customer.phone2 || ''}`,
        data: customer,
      }));
  }, [customers]);

  const handleCustomerSelect = (selectedOption: any) => {
    if (selectedOption) {
      setSelectedCustomer(selectedOption.value);
      if (customerError) {
        setCustomerError('');
      }
    } else {
      setSelectedCustomer('');
    }
  };

  // Helper function to get location details
  const getLocationDetails = (cartItem: CartItem) => {
    // FIRST: Use the stored location name if available (most reliable)
    if (cartItem.locationName) {
      const isStore = cartItem.locationType === 'store';
      return {
        type: cartItem.locationType || 'default',
        name: cartItem.locationName,
        icon: isStore ? '🏬' : '🏪',
        color: isStore ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400',
        bgColor: isStore ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-purple-50 dark:bg-purple-900/20',
        borderColor: isStore ? 'border-blue-200 dark:border-blue-800' : 'border-purple-200 dark:border-purple-800'
      };
    }

    // SECOND: Try to look up by storeId
    if (cartItem.storeId) {
      const store = stores.find(s => s.id === cartItem.storeId);
      if (store) {
        return {
          type: 'store' as const,
          name: store.name,
          icon: '🏬',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      }
    }

    // THIRD: Try to look up by showroomId
    if (cartItem.showroomId) {
      const showroom = showrooms.find(s => s.id === cartItem.showroomId);
      if (showroom) {
        return {
          type: 'showroom' as const,
          name: showroom.name,
          icon: '🏪',
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800'
        };
      }
    }
    
    // FINALLY: If no location found, show the item's stock locations
    if (cartItem.item?.stockDetails) {
      const stores = cartItem.item.stockDetails.stores || [];
      const showrooms = cartItem.item.stockDetails.showrooms || [];
      
      if (stores.length > 0) {
        const store = stores[0];
        return {
          type: 'store' as const,
          name: store.storeName || 'Store',
          icon: '🏬',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      }
      
      if (showrooms.length > 0) {
        const showroom = showrooms[0];
        return {
          type: 'showroom' as const,
          name: showroom.showroomName || 'Showroom',
          icon: '🏪',
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800'
        };
      }
    }
    
    // If absolutely no location info, show error
    return {
      type: 'default' as const,
      name: '⚠️ Select Location',
      icon: '⚠️',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800'
    };
  };

  // Get max quantity based on location stock
  const getMaxQuantity = (cartItem: CartItem) => {
    if (!cartItem.item?.stockDetails) return cartItem.item?.stock || 0;

    if (cartItem.storeId) {
      const storeStock = cartItem.item.stockDetails.stores?.find(
        (s: any) => s.storeId === cartItem.storeId
      );
      return storeStock?.quantity || 0;
    }

    if (cartItem.showroomId) {
      const showroomStock = cartItem.item.stockDetails.showrooms?.find(
        (s: any) => s.showroomId === cartItem.showroomId
      );
      return showroomStock?.quantity || 0;
    }

    return cartItem.item?.stock || 0;
  };

  if (items.length === 0) {
    return (
      <Card className='mx-auto w-full'>
        <CardHeader>
          <h2 className='text-lg font-bold'>Shopping Cart</h2>
        </CardHeader>
        <CardContent>
          <p className='py-8 text-center text-gray-500'>Your cart is empty</p>
          <p className='text-center text-sm text-gray-400'>
            Add items from the product list to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className='mx-auto w-full'>
        <CardHeader className='py-3 sm:py-4'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
            <h2 className='text-lg font-bold sm:text-xl'>Shopping Cart ({items.length} items)</h2>
            <Button
              variant='outline'
              size='sm'
              onClick={onResetCart}
              className='text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
            >
              Clear Cart
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className='space-y-3 px-2 sm:space-y-4 sm:px-4'>
          {/* Customer Selection */}
          <div className='flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-3'>
            <div className='w-full flex-1'>
              <Label htmlFor='customer' className='text-sm sm:text-base dark:text-gray-300'>
                Customer <span className='text-red-500'>*</span>
              </Label>
              
              <Select
                options={customerOptions}
                value={
                  selectedCustomer
                    ? customerOptions.find(option => option.value === selectedCustomer)
                    : null
                }
                onChange={handleCustomerSelect}
                placeholder="Search customer by name, phone, or company..."
                isClearable
                isSearchable
                noOptionsMessage={() => 'No customers found'}
                formatOptionLabel={(option: any) => {
                  const customer = option.data;
                  return (
                    <div className="flex flex-col">
                      <span className="font-medium dark:text-gray-100">
                        {customer?.name || 'Unknown'}
                      </span>
                      <div className="flex flex-wrap gap-1 text-xs">
                        {customer?.phone1 && (
                          <span className="bg-gray-100 px-1 rounded dark:bg-gray-700 dark:text-gray-300">
                            📞 {customer.phone1}
                          </span>
                        )}
                        {customer?.companyName && (
                          <span className="bg-gray-100 px-1 rounded dark:bg-gray-700 dark:text-gray-300">
                            🏢 {customer.companyName}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }}
                className="react-select-container"
                classNamePrefix="react-select"
              />
              
              {customerError && (
                <p className='mt-1 text-xs text-red-500 dark:text-red-400'>{customerError}</p>
              )}
            </div>
            
            <div className='mt-2 flex w-full space-x-2 sm:mt-0 sm:w-auto'>
              <Button
                variant='outline'
                onClick={handleRefreshCustomers}
                disabled={loading}
                className='w-full py-2 text-sm sm:w-auto sm:py-2.5 sm:text-base'
              >
                {loading ? '...' : 'Refresh'}
              </Button>
              <Button
                onClick={() => setIsCustomerModalOpen(true)}
                className='w-full py-2 text-sm sm:w-auto sm:py-2.5 sm:text-base'
              >
                + New
              </Button>
            </div>
          </div>

          {/* Delivery Date - Required */}
          <div className='space-y-2'>
            <Label htmlFor='deliveryDate' className='text-sm sm:text-base dark:text-gray-300'>
              Delivery Date <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='deliveryDate'
              type='date'
              value={deliveryDate}
              onChange={(e) => {
                setDeliveryDate(e.target.value);
                if (deliveryDateError) {
                  setDeliveryDateError('');
                }
              }}
              min={new Date().toISOString().split('T')[0]}
              className='w-full'
            />
            {deliveryDateError && (
              <p className='mt-1 text-xs text-red-500 dark:text-red-400'>{deliveryDateError}</p>
            )}
            <p className='text-xs text-red-500'>
              Please select a delivery date for this order
            </p>
          </div>

          {/* Cart Items Table */}
          <div className='overflow-x-auto'>
            <Table className='min-w-full text-xs sm:text-sm md:text-base'>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-10'>#</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className='text-right'>Total</TableHead>
                  <TableHead className='text-center'>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => {
                  const location = getLocationDetails(item);
                  const maxQty = getMaxQuantity(item);
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell className='font-medium'>{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <div className='font-medium'>{item.item.name}</div>
                          <div className='text-xs text-gray-500'>
                            {item.item.color && `Color: ${item.item.color}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${location.bgColor} ${location.color} border ${location.borderColor}`}>
                          <span>{location.icon}</span>
                          <span>{location.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatPrice(item.unitPrice)}</TableCell>
                      <TableCell>
                        <div className='flex flex-col gap-1'>
                          <Input
                            type='number'
                            min='1'
                            max={maxQty}
                            value={item.quantity}
                            onChange={(e) =>
                              onUpdateQuantity(item.id, Number(e.target.value))
                            }
                            className='w-16 text-sm sm:w-20 sm:text-base'
                          />
                          <span className='text-[10px] text-gray-400'>
                            Max: {maxQty}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='text-right font-medium'>
                        {formatPrice(item.totalPrice)}
                      </TableCell>
                      <TableCell className='text-center'>
                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() => onRemoveItem(item.id)}
                          className='px-2 py-1 text-xs sm:text-sm'
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Order Totals */}
          <div className='space-y-2 pt-3 sm:pt-4'>
            <div className='flex flex-col justify-between gap-1 text-sm sm:flex-row sm:text-base'>
              <span className='text-gray-600'>Subtotal:</span>
              <span className='font-medium'>{formatPrice(subtotal)}</span>
            </div>
            
            <div className='flex flex-col items-start gap-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:text-base'>
              <span className='text-gray-600'>Discount:</span>
              <Input
                type='number'
                min='0'
                max={subtotal}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className='w-full text-sm sm:w-32 sm:text-base'
              />
            </div>
            
            <div className='flex flex-col justify-between border-t pt-2 text-base font-bold sm:flex-row sm:text-lg'>
              <span>Grand Total:</span>
              <span className='text-blue-600 dark:text-blue-400'>
                {formatPrice(grandTotal)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className='space-y-2'>
            <Label htmlFor='notes' className='text-sm sm:text-base'>
              Order Notes (Optional)
            </Label>
            <Textarea
              id='notes'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Add any special instructions or notes for this order...'
              className='min-h-20 w-full text-sm sm:text-base'
              rows={3}
            />
          </div>
        </CardContent>

        <CardFooter className='px-3 py-3 sm:px-4 sm:py-4'>
          <Button
            className='w-full py-2 text-sm sm:py-2.5 sm:text-base'
            disabled={items.length === 0 || loading}
            onClick={handleConfirmOrder}
          >
            {loading ? 'Processing...' : 'Proceed to Checkout'}
          </Button>
        </CardFooter>

        {isCustomerModalOpen && (
          <CreateCustomerModal
            closeModal={() => setIsCustomerModalOpen(false)}
            onSuccess={handleRefreshCustomers}
          />
        )}
      </Card>

      {/* Order Confirmation Modal */}
      <Modal
        title='Confirm Order'
        description='Please review your order details before confirming'
        isOpen={isOrderConfirmModalOpen}
        onClose={() => setIsOrderConfirmModalOpen(false)}
        size='lg'
      >
        <div className='max-h-[70vh] space-y-4 overflow-y-auto py-2 sm:py-4'>
          {/* Customer Information */}
          <div className='rounded-md bg-gray-50 p-3 sm:p-4 dark:bg-gray-800'>
            <h3 className='mb-2 text-sm font-semibold text-gray-900 sm:text-base dark:text-gray-100'>
              Customer Information
            </h3>
            {selectedCustomerDetails ? (
              <div className='space-y-1 text-xs sm:text-sm'>
                <p>
                  <span className='font-medium'>Name:</span>{' '}
                  {selectedCustomerDetails.name}
                </p>
                {selectedCustomerDetails.companyName && (
                  <p>
                    <span className='font-medium'>Company:</span>{' '}
                    {selectedCustomerDetails.companyName}
                  </p>
                )}
                {selectedCustomerDetails.phone1 && (
                  <p>
                    <span className='font-medium'>Phone:</span>{' '}
                    {selectedCustomerDetails.phone1}
                  </p>
                )}
              </div>
            ) : (
              <p className='text-xs text-red-500 sm:text-sm'>
                No customer selected
              </p>
            )}
          </div>

          {/* Delivery Date */}
          <div className='rounded-md bg-blue-50 p-3 sm:p-4 dark:bg-blue-900/20'>
            <h3 className='mb-2 text-sm font-semibold text-blue-900 sm:text-base dark:text-blue-100'>
              📦 Delivery Information
            </h3>
            <p className='text-sm text-blue-800 dark:text-blue-200'>
              <span className='font-medium'>Delivery Date:</span>{' '}
              {deliveryDate ? new Date(deliveryDate).toLocaleDateString() : 'Not set'}
            </p>
          </div>

          {/* Order Items Summary */}
          <div className='overflow-hidden rounded-md border border-gray-200 dark:border-gray-700'>
            <Table>
              <TableHeader>
                <TableRow className='bg-gray-50 dark:bg-gray-800'>
                  <TableHead className='text-xs'>#</TableHead>
                  <TableHead className='text-xs'>Product</TableHead>
                  <TableHead className='text-xs'>Location</TableHead>
                  <TableHead className='text-right text-xs'>Qty</TableHead>
                  <TableHead className='text-right text-xs'>Price</TableHead>
                  <TableHead className='text-right text-xs'>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => {
                  const location = getLocationDetails(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className='text-xs'>{index + 1}</TableCell>
                      <TableCell className='text-xs'>
                        <div>
                          <div className='font-medium'>{item.item.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className='text-xs'>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${location.bgColor} ${location.color}`}>
                          <span>{location.icon}</span>
                          <span>{location.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className='text-right text-xs'>
                        {item.quantity}
                      </TableCell>
                      <TableCell className='text-right text-xs'>
                        {formatPrice(item.unitPrice)}
                      </TableCell>
                      <TableCell className='text-right text-xs font-medium'>
                        {formatPrice(item.totalPrice)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className='bg-gray-50 dark:bg-gray-800'>
                  <TableCell colSpan={5} className='text-right font-medium'>
                    Subtotal:
                  </TableCell>
                  <TableCell className='text-right'>{formatPrice(subtotal)}</TableCell>
                </TableRow>
                {discount > 0 && (
                  <TableRow className='bg-gray-50 dark:bg-gray-800'>
                    <TableCell colSpan={5} className='text-right font-medium'>
                      Discount:
                    </TableCell>
                    <TableCell className='text-right text-red-600'>
                      -{formatPrice(discount)}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow className='bg-gray-50 dark:bg-gray-800'>
                  <TableCell colSpan={5} className='text-right font-bold'>
                    Grand Total:
                  </TableCell>
                  <TableCell className='text-right font-bold text-blue-600'>
                    {formatPrice(grandTotal)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {/* Notes Preview */}
          {notes && (
            <div className='rounded-md bg-blue-50 p-3 sm:p-4 dark:bg-blue-900/20'>
              <h3 className='mb-1 text-xs font-semibold text-blue-900 sm:text-sm dark:text-blue-100'>
                Order Notes
              </h3>
              <p className='text-xs text-blue-800 sm:text-sm dark:text-blue-200'>
                {notes}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex flex-col gap-2 pt-4 sm:flex-row sm:gap-3'>
            <Button
              variant='outline'
              onClick={() => setIsOrderConfirmModalOpen(false)}
              className='w-full sm:w-1/2'
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={loading}
              className='w-full sm:w-1/2'
            >
              {loading ? 'Creating Order...' : 'Confirm Order'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// ==================== MAIN PRODUCT SEARCH COMPONENT ====================
interface SearchFilters {
  itemName: string;
  categoryId: string;
  sizeId: string;
  typeId: string;
}

interface ProductSearchProps {
  items: IItem[];
  categories?: IProductCategory[];
  sizes?: ISize[];
  types?: IProductType[];
}

export const ProductSearch = ({ items, categories = [], sizes = [], types = [] }: ProductSearchProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    itemName: searchParams?.get('searchTerm') || '',
    categoryId: searchParams?.get('category') || '',
    sizeId: searchParams?.get('size') || '',
    typeId: searchParams?.get('type') || ''
  });
  
  const [selectedItem, setSelectedItem] = useState<IItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Get available sizes based on selected category (DECLARE FIRST)
  const availableSizes = useMemo(() => {
    if (!searchFilters.categoryId) return [];
    return sizes.filter(size => size.categoryId === searchFilters.categoryId);
  }, [sizes, searchFilters.categoryId]);

  // Get available types based on selected category and size (DECLARE SECOND)
  const typesForSelectedSize = useMemo(() => {
    let filtered = [...types];
    
    if (searchFilters.categoryId) {
      filtered = filtered.filter(type => {
        const size = sizes.find(s => s.id === type.sizeId);
        return size?.categoryId === searchFilters.categoryId;
      });
    }
    
    if (searchFilters.sizeId) {
      filtered = filtered.filter(type => type.sizeId === searchFilters.sizeId);
    }
    
    return filtered;
  }, [types, sizes, searchFilters.categoryId, searchFilters.sizeId]);

  // Prepare options for react-select (USE AVAILABLESIZES AND TYPESFORSELECTEDSIZE HERE)
  const categoryOptions = useMemo(() => {
    return [
      { value: '', label: 'All Categories' },
      ...categories.map(category => ({
        value: category.id,
        label: category.name
      }))
    ];
  }, [categories]);

  const sizeOptions = useMemo(() => {
    const options = [
      { value: '', label: 'All Sizes' }
    ];
    
    if (searchFilters.categoryId) {
      availableSizes.forEach(size => {
        options.push({
          value: size.id,
          label: size.name
        });
      });
    }
    
    return options;
  }, [availableSizes, searchFilters.categoryId]);

  const typeOptions = useMemo(() => {
    const options = [
      { value: '', label: 'All Types' }
    ];
    
    if (searchFilters.categoryId) {
      typesForSelectedSize.forEach(type => {
        options.push({
          value: type.id,
          label: type.name
        });
      });
    }
    
    return options;
  }, [typesForSelectedSize, searchFilters.categoryId]);

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = items || [];
    
    // Filter by name
    if (searchFilters.itemName) {
      const searchTerm = searchFilters.itemName.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filter by category
    if (searchFilters.categoryId) {
      filtered = filtered.filter(item => {
        const itemCategoryId = item.categoryId || item.category?.id;
        return itemCategoryId === searchFilters.categoryId;
      });
    }
    
    // Filter by size
    if (searchFilters.sizeId) {
      filtered = filtered.filter(item => {
        const itemSizeId = item.sizeId || item.size?.id;
        return itemSizeId === searchFilters.sizeId;
      });
    }
    
    // Filter by type
    if (searchFilters.typeId) {
      filtered = filtered.filter(item => {
        const itemTypeId = item.typeId || item.type?.id;
        return itemTypeId === searchFilters.typeId;
      });
    }
    
    return filtered;
  }, [searchFilters, items]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
    
    // Update URL
    const params = new URLSearchParams(searchParams?.toString());
    if (value) {
      params.set(key === 'itemName' ? 'searchTerm' : key, value);
    } else {
      params.delete(key === 'itemName' ? 'searchTerm' : key);
    }
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCategoryChange = (selectedOption: any) => {
    const value = selectedOption?.value || '';
    handleFilterChange('categoryId', value);
    // Reset dependent filters
    setSearchFilters(prev => ({
      ...prev,
      sizeId: '',
      typeId: ''
    }));
    // Update URL for size and type too
    const params = new URLSearchParams(searchParams?.toString());
    params.delete('size');
    params.delete('type');
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSizeChange = (selectedOption: any) => {
    const value = selectedOption?.value || '';
    handleFilterChange('sizeId', value);
    // Reset type filter when size changes
    if (searchFilters.typeId) {
      setSearchFilters(prev => ({ ...prev, typeId: '' }));
      const params = new URLSearchParams(searchParams?.toString());
      params.delete('type');
      router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const handleTypeChange = (selectedOption: any) => {
    const value = selectedOption?.value || '';
    handleFilterChange('typeId', value);
  };

  const clearFilters = () => {
    setSearchFilters({
      itemName: '',
      categoryId: '',
      sizeId: '',
      typeId: ''
    });
    setCurrentPage(1);
    router.push(window.location.pathname, { scroll: false });
  };

  const handleSelectItem = (item: IItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

 // In the parent component (where ProductSearch or Shop component is)
const handleAddToCart = (
  item: IItem, 
  quantity: number, 
  customPrice?: number, 
  storeId?: string, 
  showroomId?: string,
  locationName?: string,
  locationType?: 'store' | 'showroom'
) => {
  const unitPrice = customPrice || item.price;
  
  // Create cart item with location info
  const cartItem: CartItem = {
    id: `${Date.now()}-${item.id}`,
    item,
    quantity,
    unitPrice,
    totalPrice: unitPrice * quantity,
    storeId: storeId || undefined,
    showroomId: showroomId || undefined,
    locationName: locationName || '', // Store the location name
    locationType: locationType || undefined,
  };
  
  // Check if item already exists in cart
  const existingItemIndex = cartItems.findIndex(
    (cartItem) => cartItem.item.id === item.id
  );

  if (existingItemIndex >= 0) {
    const updatedItems = [...cartItems];
    updatedItems[existingItemIndex].quantity += quantity;
    updatedItems[existingItemIndex].totalPrice =
      updatedItems[existingItemIndex].unitPrice * updatedItems[existingItemIndex].quantity;
    setCartItems(updatedItems);
    toast.success(`Updated ${item.name} quantity`);
  } else {
    setCartItems([...cartItems, cartItem]);
    toast.success(`Added ${item.name} to cart`);
  }
};

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
          : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    const item = cartItems.find(i => i.id === id);
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    if (item) {
      toast.success(`Removed ${item.item.name} from cart`);
    }
  };

  const handleResetCart = () => {
    setCartItems([]);
    toast.success('Cart has been reset');
  };

  const handleCreateOrderSuccess = () => {
    setOrderSuccess(true);
    setTimeout(() => setOrderSuccess(false), 3000);
  };

  const hasActiveFilters = 
    searchFilters.itemName || 
    searchFilters.categoryId || 
    searchFilters.sizeId || 
    searchFilters.typeId;

  // Get current selected values
  const selectedCategory = searchFilters.categoryId ? searchFilters.categoryId : null;
  const selectedSize = searchFilters.sizeId ? searchFilters.sizeId : null;
  const selectedType = searchFilters.typeId ? searchFilters.typeId : null;

  return (
    <div className='flex flex-col space-y-6 lg:flex-row lg:space-y-0 lg:space-x-6'>
      {/* Products Section */}
      <div className='flex-1 space-y-4'>
        {/* Search and Filters */}
        <div className='w-full rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-900'>
          <h2 className='mb-3 text-xl font-bold'>Search Products</h2>
          
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {/* Search Input */}
            <div>
              <Label className='text-sm font-medium mb-2 block'>Search</Label>
              <Input
                type='text'
                placeholder='Search by product name...'
                value={searchFilters.itemName}
                onChange={(e) => handleFilterChange('itemName', e.target.value)}
                className='w-full'
              />
            </div>
            
            {/* Category Filter */}
            <div>
              <Label className='text-sm font-medium mb-2 block'>Category</Label>
              <Select
                options={categoryOptions}
                value={categoryOptions.find(option => option.value === selectedCategory) || null}
                onChange={handleCategoryChange}
                placeholder="All Categories"
                isClearable
                isSearchable
                noOptionsMessage={() => 'No categories found'}
                className="react-select-container"
                classNamePrefix="react-select"
                formatOptionLabel={(option: any) => {
                  const category = categories.find(c => c.id === option.value);
                  if (!category || !option.value) return option.label;
                  return (
                    <div className="flex flex-col">
                      <span className="font-medium dark:text-gray-100">
                        {category.name}
                      </span>
                    </div>
                  );
                }}
              />
            </div>
            
            {/* Size Filter */}
            <div>
              <Label className='text-sm font-medium mb-2 block'>Size</Label>
              <Select
                options={sizeOptions}
                value={sizeOptions.find(option => option.value === selectedSize) || null}
                onChange={handleSizeChange}
                placeholder={searchFilters.categoryId ? "All Sizes" : "Select category first"}
                isClearable
                isSearchable
                isDisabled={!searchFilters.categoryId}
                noOptionsMessage={() => searchFilters.categoryId ? 'No sizes available' : 'Please select a category first'}
                className="react-select-container"
                classNamePrefix="react-select"
                formatOptionLabel={(option: any) => {
                  const size = sizes.find(s => s.id === option.value);
                  if (!size || !option.value) return option.label;
                  return (
                    <div className="flex flex-col">
                      <span className="font-medium dark:text-gray-100">
                        {size.name}
                      </span>
                    </div>
                  );
                }}
              />
            </div>
            
            {/* Type Filter */}
            <div>
              <Label className='text-sm font-medium mb-2 block'>Product Type</Label>
              <Select
                options={typeOptions}
                value={typeOptions.find(option => option.value === selectedType) || null}
                onChange={handleTypeChange}
                placeholder={searchFilters.categoryId ? "All Types" : "Select category first"}
                isClearable
                isSearchable
                isDisabled={!searchFilters.categoryId}
                noOptionsMessage={() => searchFilters.categoryId ? 'No types available' : 'Please select a category first'}
                className="react-select-container"
                classNamePrefix="react-select"
                formatOptionLabel={(option: any) => {
                  const type = types.find(t => t.id === option.value);
                  if (!type || !option.value) return option.label;
                  return (
                    <div className="flex flex-col">
                      <span className="font-medium dark:text-gray-100">
                        {type.name}
                      </span>
                    </div>
                  );
                }}
              />
            </div>
          </div>
          
          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className='mt-4'>
              <Button onClick={clearFilters} variant='outline' className='w-full md:w-auto'>
                Clear All Filters
              </Button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className='w-full rounded-lg border bg-white p-3 shadow-sm dark:bg-gray-900'>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            Showing {filteredItems.length > 0 ? indexOfFirstItem + 1 : 0}-
            {Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} products
          </p>
        </div>

        {/* Products Grid */}
        <div className='grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3'>
          {currentItems.length > 0 ? (
            currentItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onSelectItem={handleSelectItem}
              />
            ))
          ) : (
            <div className='col-span-full py-12 text-center'>
              <p className='text-gray-500'>No products found matching your criteria.</p>
              <Button onClick={clearFilters} variant='link' className='mt-2'>
                Clear filters
              </Button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='mt-6 flex flex-wrap items-center justify-center gap-2'>
            <Button
              variant='outline'
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
              variant='outline'
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Cart Section */}
      <div className='mt-6 w-full lg:mt-0 lg:w-96'>
        <Cart
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onResetCart={handleResetCart}
          onCreateOrderSuccess={handleCreateOrderSuccess}
        />
      </div>

      {/* Item Selection Modal */}
      <ItemModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleAddToCart}
      />

      {/* Order Success Toast Notification */}
      {orderSuccess && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-5">
          <div className="rounded-lg bg-green-500 px-6 py-3 text-white shadow-lg">
            ✅ Order created successfully!
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;