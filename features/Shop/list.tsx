/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import Image from 'next/image';
import { Modal } from '@/components/ui/modal';
import { IProduct, IAdditionalPrice } from '@/models/Product';
import { ICategory } from '@/models/Category';
import { ISell, ISellItem, SaleStatus } from '@/models/Sell';
import { ICustomer } from '@/models/customer';
import { getCustomer } from '@/service/customer';
import { IShop } from '@/models/shop';
import { getShopsBasedOnUser } from '@/service/shop';
import { createSell } from '@/service/Sell';
import CreateCustomerModal from './customer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { getProductByShops } from '@/service/Product';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import SelectReac from 'react-select';
import { Package, PackageOpen, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { IBrand } from '@/models/brand';
import { 
  viscosityOptions, 
  oilTypeOptions, 
  additiveTypeOptions 
} from '@/models/Branch'
const BACKEND_URL = 'http://store.smartdent.online';

// Helper functions
const normalizeImagePath = (path?: string | File) => {
  if (!path) return '/placeholder-image.jpg';
  if (typeof path !== 'string') return '/placeholder-image.jpg';

  const normalizedPath = path.replace(/\\/g, '/');
  if (normalizedPath.startsWith('http')) return normalizedPath;

  const cleanPath = normalizedPath.replace(/^\/+/, '');
  return `${BACKEND_URL}/${cleanPath}`;
};

const formatPrice = (price: unknown): string => {
  if (price === null || price === undefined) return '0.00';
  const numericPrice =
    typeof price === 'string' ? parseFloat(price) : Number(price);
  return isNaN(numericPrice) ? '0.00' : `${numericPrice.toFixed(2)}`;
};

// Props interfaces
interface ProductCardProps {
  product: IProduct;
  onSelectProduct: (product: IProduct) => void;
}



interface CartItem extends ISellItem {
  product: IProduct;
  shop: IShop;
  selectedPrice: number;
  availableQuantity: number;
  isBox: boolean;
  boxQuantity?: number;
}

// Shop stock interface based on getProductByShops response
interface IShopStockInfo {
  shopId: string;
  shopName: string;
  branchName: string;
  quantity: number;
  availableBoxes: number;
  remainingPieces: number;
  boxSize: number | null;
  hasBox: boolean;
  additionalPrices: IAdditionalPrice[];
  totalPrice?: number;
  UnitOfMeasure?: string;
}

export interface IProductShopAvailability {
  totalAvailableQuantity: number;
  shops: IShopStockInfo[];
  hasStock: boolean;
  product: {
    hasBox: boolean;
    boxSize: number | null;
    UnitOfMeasure: string;
    name: string;
    productCode: string;
  };
}

const ProductCard = ({ product, onSelectProduct }: ProductCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false); // Add modal state

  const getImageUrls = (): string[] => {
    if (!product.imageUrl) return ['/placeholder-image.jpg'];
    if (Array.isArray(product.imageUrl)) {
      return product.imageUrl.map((url) => normalizeImagePath(url));
    }
    return [normalizeImagePath(product.imageUrl)];
  };

  const imageUrls = getImageUrls();
  const currentImageUrl = imageError ? '/placeholder-image.jpg' : imageUrls[currentImageIndex];
  const hasMultipleImages = imageUrls.length > 1;
  const formattedPrice = formatPrice(product.sellPrice);

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  const handleViewImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
  <>
    <Card
      className="group flex h-full w-full flex-col cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
      onClick={() => onSelectProduct(product)}
    >
      <CardHeader className="relative p-0">
        <div className="relative aspect-video w-full overflow-hidden bg-gray-50 dark:bg-gray-800">
          <Image
            src={currentImageUrl}
            alt={product.name}
            fill
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={() => setImageError(true)}
          />

          {hasMultipleImages && (
            <>
              <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  className="rounded-full bg-white/80 dark:bg-gray-900/80 p-1 shadow-sm backdrop-blur-sm transition hover:bg-white dark:hover:bg-gray-800"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="h-4 w-4 text-gray-800 dark:text-gray-200" />
                </button>

                <button
                  className="rounded-full bg-white/80 dark:bg-gray-900/80 p-1 shadow-sm backdrop-blur-sm transition hover:bg-white dark:hover:bg-gray-800"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-4 w-4 text-gray-800 dark:text-gray-200" />
                </button>
              </div>

              <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
                {imageUrls.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 transition-all duration-300 rounded-full ${
                      index === currentImageIndex
                        ? 'w-3 bg-white dark:bg-gray-200'
                        : 'w-1 bg-white/60 dark:bg-gray-500'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-3 pb-1">
        {/* Brand & Name Section */}
        <div className="flex flex-col mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            {product?.brand?.name || 'Brand'}
          </span>

          <h3 className="line-clamp-1 text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {product.name}
          </h3>

          {/* Product specs */}
          {(product.viscosity || product.additiveType || product.oilType || product.generic) && (
            <p className="mb-2 line-clamp-2 text-[12px] leading-relaxed text-gray-700 dark:text-gray-300">
              {[product.viscosity, product.additiveType, product.oilType]
                .filter(Boolean)
                .join(' • ')}
              {product.generic && (
                <span className="italic text-gray-600 dark:text-gray-400">
                  {` • ${product.generic}`}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <p className="mb-2 line-clamp-2 text-[11px] leading-relaxed text-gray-600 dark:text-gray-400">
            {product.description}
          </p>
        )}

        {/* Category & Unit */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="rounded-md bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[12px] font-medium text-gray-900 dark:text-gray-100">
            {product?.category?.name || 'Category'}
          </span>

          {product.unitOfMeasure?.name && (
            <div className="flex items-center gap-1 border-l border-gray-300 dark:border-gray-700 pl-2">
              <Package className="h-3 w-3 text-gray-700 dark:text-gray-300" />
              <span className="text-[12px] text-gray-700 dark:text-gray-300">
                                {product.numberunitOfMeasure}
{product.unitOfMeasure?.symbol}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between p-3 pt-2">
        <span className="text-lg font-extrabold text-gray-900 dark:text-gray-100">
          {formattedPrice}
        </span>

        <button
          className="rounded-lg bg-[#0f172a] dark:bg-blue-600 px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-gray-800 dark:hover:bg-blue-500"
          onClick={handleViewImage}
        >
          View
        </button>
      </CardFooter>
    </Card>

    {/* Modal */}
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

          <div className="relative bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
            <div className="relative aspect-video w-full bg-gray-900 dark:bg-black">
              <Image
                src={currentImageUrl}
                alt={product.name}
                fill
                className="object-contain"
                sizes="90vw"
              />

              {hasMultipleImages && (
                <>
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 dark:bg-gray-900/80 p-2 shadow-sm backdrop-blur-sm transition hover:bg-white dark:hover:bg-gray-800"
                    onClick={handlePrevImage}
                  >
                    <ChevronLeft className="h-6 w-6 text-gray-800 dark:text-gray-200" />
                  </button>

                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 dark:bg-gray-900/80 p-2 shadow-sm backdrop-blur-sm transition hover:bg-white dark:hover:bg-gray-800"
                    onClick={handleNextImage}
                  >
                    <ChevronRight className="h-6 w-6 text-gray-800 dark:text-gray-200" />
                  </button>

                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                    {imageUrls.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 transition-all duration-300 rounded-full ${
                          index === currentImageIndex
                            ? 'w-4 bg-white dark:bg-gray-200'
                            : 'w-1.5 bg-white/60 dark:bg-gray-500'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-white dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
interface ShopBatchModalProps {
  product: IProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}
// Shop and Batch Selection Modal - Updated with isBox
const ShopBatchModal = ({
  product,
  isOpen,
  onClose,
  onAddToCart
}: ShopBatchModalProps) => {
  const [shops, setShops] = useState<IShop[]>([]);
  const [selectedShop, setSelectedShop] = useState<IShop | null>(null);
  const [shopAvailability, setShopAvailability] =
    useState<IProductShopAvailability | null>(null);
  const [selectedPriceOption, setSelectedPriceOption] =
    useState<string>('custom');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isBox, setIsBox] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setCustomers] = useState<ICustomer[]>([]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const customersData = await getCustomer();
      setCustomers(customersData);
    } catch (err) {
      toast.error(err as string);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        const shopsData = await getShopsBasedOnUser();
        setShops(shopsData);
      } catch {
        setError('Failed to fetch shops');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && product) {
      fetchShops();
    }
  }, [isOpen, product]);

  useEffect(() => {
    const fetchShopAvailability = async () => {
      if (!product) return;

      try {
        setLoading(true);
        setError(null);
        const availabilityData = await getProductByShops(product.id);
        setShopAvailability(availabilityData);

        if (availabilityData?.shops?.length > 0) {
          const firstAvailableShop = shops.find((shop) =>
            availabilityData.shops.some(
              (avail: IShopStockInfo) =>
                avail.shopId === shop.id && avail.quantity > 0
            )
          );
          if (firstAvailableShop) {
            setSelectedShop(firstAvailableShop);
          }
        }
      } catch {
        setError('Failed to fetch product availability');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && product && shops.length > 0) {
      fetchShopAvailability();
    }
  }, [isOpen, product, shops]);

  const getAvailableStockInPieces = (): number => {
    if (!selectedShop || !shopAvailability) return 0;

    const shopStock = shopAvailability.shops.find(
      (shop) => shop.shopId === selectedShop.id
    );
    return shopStock?.quantity || 0;
  };

  const getAvailableStockInBoxes = (): number => {
    const pieces = getAvailableStockInPieces();
    if (!product?.hasBox || !product?.boxSize || product.boxSize <= 0) {
      return pieces;
    }
    return Math.floor(pieces / product.boxSize);
  };

  const getMaxAvailableQuantity = (): number => {
    if (isBox) {
      return getAvailableStockInBoxes();
    } else {
      return getAvailableStockInPieces();
    }
  };

  const getAvailableStockDisplay = (): string => {
    const pieces = getAvailableStockInPieces();
    
    if (isBox) {
      if (!product?.hasBox || !product?.boxSize || product.boxSize <= 0) {
        return `${pieces} pieces (Box not supported)`;
      }
      const boxes = Math.floor(pieces / product.boxSize);
      const remainingPieces = pieces % product.boxSize;
      if (boxes === 0) {
        return `${pieces} pieces available`;
      }
      if (remainingPieces === 0) {
        return `${boxes} box(es) available`;
      }
      return `${boxes} box(es) + ${remainingPieces} pieces available`;
    } else {
      return `${pieces} pieces available`;
    }
  };

  const getAdditionalPricesForSelectedShop = (): IAdditionalPrice[] => {
    if (!selectedShop || !shopAvailability) return [];

    const shopStock = shopAvailability.shops.find(
      (shop) => shop.shopId === selectedShop.id
    );
    return shopStock?.additionalPrices || [];
  };

  // Filter additional prices based on isBox toggle
  const getFilteredAdditionalPrices = (): IAdditionalPrice[] => {
    const allPrices = getAdditionalPricesForSelectedShop();
    
    // Filter prices that match the current isBox state
    return allPrices.filter(price => price.isBox === isBox);
  };

  const getUnitPrice = (): number | null => {
    if (!product) return null;

    if (selectedPriceOption === 'custom') {
      // Return null for empty string to indicate no price set
      if (customPrice === '') {
        return null;
      }
      const price = parseFloat(customPrice);
      return isNaN(price) ? null : price;
    } else {
      const filteredPrices = getFilteredAdditionalPrices();
      const additionalPrice = filteredPrices.find(
        (option) => option.id === selectedPriceOption
      );
      return additionalPrice?.price || null;
    }
  };

  const handlePriceChange = (value: string) => {
    setSelectedPriceOption('custom');
    setCustomPrice(value);
  };

  const handleSuggestedPriceClick = (option: IAdditionalPrice) => {
    // Allow using any price regardless of isBox type, just show a warning
    if (option.isBox !== isBox) {
      const priceType = option.isBox ? 'box' : 'piece';
      const currentType = isBox ? 'box' : 'piece';
      toast.warning(`Using ${priceType} price for ${currentType} sales. You can still edit the price.`);
    }
    
    setSelectedPriceOption(option.id);
    setCustomPrice(option.price.toString());
  };

  const handleAddToCart = () => {
    if (!product || !selectedShop) return;

    const unitPrice = getUnitPrice();
    
    // Only check if price is valid (greater than 0 and not null)
    if (!unitPrice || unitPrice <= 0) {
      toast.error('Please enter a valid price greater than 0');
      return;
    }
    
    const availableQuantity = getMaxAvailableQuantity();

    // Validate stock based on isBox flag
    if (quantity > availableQuantity) {
      toast.error(`Not enough stock. Only ${getAvailableStockDisplay()} available.`);
      return;
    }

    // Calculate total pieces for display and validation in the backend
    const totalPieces = isBox && product.boxSize 
      ? quantity * product.boxSize 
      : quantity;

    const cartItem: CartItem = {
      id: `temp-${Date.now()}`,
      sellId: '',
      shopId: selectedShop.id,
      productId: product.id,
      itemSaleStatus: 'PENDING' as any,
      quantity: quantity, // Send raw quantity (boxes or pieces)
      unitPrice,
      totalPrice: unitPrice * totalPieces, // Total price based on pieces for consistency
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      product,
      shop: selectedShop,
      selectedPrice: unitPrice,
      availableQuantity: availableQuantity,
      isBox, // Send isBox flag so backend knows how to interpret quantity
      boxQuantity: isBox ? quantity : 0
    };

    onAddToCart(cartItem);
    onClose();
    resetModal();
  };

  const resetModal = () => {
    setSelectedShop(null);
    setSelectedPriceOption('custom');
    setCustomPrice('');
    setShopAvailability(null);
    setQuantity(1);
    setIsBox(false);
    setError(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleShopSelect = (shop: IShop) => {
    setSelectedShop(shop);
    setQuantity(1);
    setIsBox(false);
    setSelectedPriceOption('custom');
    setCustomPrice('');
  };

  const handleQuantityChange = (value: string) => {
    if (value === '') {
      setQuantity(0);
    } else {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        setQuantity(numValue);
      }
    }
  };

  const availableStock = getMaxAvailableQuantity();
  const unitPrice = getUnitPrice();
  const displayQuantity = quantity > 0 ? quantity : '';
  
  // Calculate total pieces for display only (price calculation)
  const totalPieces = (isBox && product?.hasBox && product?.boxSize) 
    ? quantity * product.boxSize 
    : quantity;
  const totalPrice = unitPrice && unitPrice > 0 ? unitPrice * totalPieces : 0;
  
  const allAdditionalPrices = getAdditionalPricesForSelectedShop();
  const filteredAdditionalPrices = getFilteredAdditionalPrices();
  const canShowBoxes = product?.hasBox && product?.boxSize && product.boxSize > 0;

  // Reset price when isBox toggles
  useEffect(() => {
    if (selectedShop) {
      setSelectedPriceOption('custom');
      setCustomPrice('');
    }
  }, [isBox, selectedShop]);

  return (
    <Modal
      title={`Select Shop for ${product?.name || ''}`}
      description='Choose a shop and set the price for this product'
      isOpen={isOpen}
      onClose={handleClose}
      size='lg'
      className='w-full max-w-[95vw] sm:max-w-[80vw] md:max-w-4xl'
    >
      <div className='max-h-[80vh] space-y-4 overflow-y-auto py-2 sm:py-4'>
        {shopAvailability && (
          <div className='space-y-3'>
            <Label className='text-sm font-semibold sm:text-base'>
              Available Shops
            </Label>

            <div className='overflow-hidden rounded-md border border-gray-300 dark:border-gray-600'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-gray-50 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800'>
                    <TableHead className='w-10'>Select</TableHead>
                    <TableHead>Shop Name</TableHead>
                    <TableHead>Available Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shopAvailability.shops.map((shopAvail) => {
                    const shop = shops.find((s) => s.id === shopAvail.shopId);
                    const isSelected = selectedShop?.id === shopAvail.shopId;
                    const isAvailable = shopAvail.quantity > 0;
                    const pieces = shopAvail.quantity;
                    const boxes = shopAvail.availableBoxes;
                    const remainingPieces = shopAvail.remainingPieces;
                    const hasBox = shopAvail.hasBox;

                    return (
                      <TableRow
                        key={shopAvail.shopId}
                        className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          isSelected
                            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                            : ''
                        } ${!isAvailable ? 'opacity-50' : ''}`}
                        onClick={() =>
                          isAvailable && shop && handleShopSelect(shop)
                        }
                      >
                        <TableCell>
                          <div className='flex items-center justify-center'>
                            <input
                              type='radio'
                              checked={isSelected}
                              onChange={() =>
                                isAvailable && shop && handleShopSelect(shop)
                              }
                              className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700'
                              disabled={!isAvailable}
                            />
                          </div>
                        </TableCell>
                        <TableCell className='font-medium'>
                          <div>
                            <div className='font-semibold'>
                              {shopAvail.shopName}
                            </div>
                            {shop?.branch?.name && (
                              <div className='text-xs text-gray-500'>
                                {shop.branch.name}
                              </div>
                            )}
                            {isSelected && (
                              <div className='mt-1 text-xs font-semibold text-green-600'>
                                ✓ Selected
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span
                              className={`font-bold ${
                                pieces > 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {pieces} pieces
                            </span>
                            {hasBox && boxes > 0 && (
                              <div className='text-xs text-gray-500'>
                                ({boxes} box(es) + {remainingPieces} pieces)
                              </div>
                            )}
                            {shopAvail.UnitOfMeasure && (
                              <div className='text-xs text-gray-400'>
                                Unit: {shopAvail.UnitOfMeasure}
                              </div>
                            )}
                            {!isAvailable && (
                              <div className='mt-1 text-xs text-red-500'>
                                Out of stock
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {loading && !shopAvailability && (
          <div className='flex justify-center py-8'>
            <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
          </div>
        )}

        {/* Box/Piece Toggle */}
        {selectedShop && canShowBoxes && (
          <div className='space-y-2 border-t border-gray-200 pt-4'>
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='flex items-center gap-2'>
                {isBox ? (
                  <Package className='h-5 w-5 text-blue-500' />
                ) : (
                  <PackageOpen className='h-5 w-5 text-green-500' />
                )}
                <span className='text-sm font-medium'>
                  {isBox ? 'Selling as Boxes' : 'Selling as Pieces'}
                </span>
              </div>
              <div className='flex items-center gap-3'>
                <span className='text-xs text-gray-500'>Pieces</span>
                <Switch
                  checked={isBox}
                  onCheckedChange={(checked) => {
                    setIsBox(checked);
                    setQuantity(1);
                  }}
                  className='data-[state=checked]:bg-primary'
                />
                <span className='text-xs text-gray-500'>Boxes</span>
              </div>
            </div>
            {isBox && (
              <p className='text-xs text-gray-500'>
                Box size: {product?.boxSize} pieces per box
              </p>
            )}
          </div>
        )}

        {/* Price Selection - Fully Editable, No Default */}
        <div className='space-y-4 border-t border-gray-200 pt-4'>
          <div className='space-y-2'>
            <Label
              htmlFor='unitPrice'
              className='flex items-center gap-2 text-sm'
            >
              Unit Price (per {isBox ? 'box' : 'piece'})
              {!selectedShop && (
                <span className='text-xs text-gray-500'>
                  (Select a shop first)
                </span>
              )}
            </Label>
            <Input
              type='number'
              id='unitPrice'
              min='0'
              step='0.01'
              value={customPrice}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder={`Enter price per ${isBox ? 'box' : 'piece'}`}
              className='w-full'
              disabled={!selectedShop}
            />
        
          </div>

          {/* Display filtered additional prices based on isBox - Optional suggestions */}
          {selectedShop && filteredAdditionalPrices.length > 0 && (
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>
                Suggested Prices 
              </Label>
              <div className='flex flex-wrap gap-2'>
                {filteredAdditionalPrices.map((option) => (
                  <Button
                    key={option.id}
                    type='button'
                    variant={
                      selectedPriceOption === option.id ? 'default' : 'outline'
                    }
                    size='sm'
                    onClick={() => handleSuggestedPriceClick(option)}
                    className='text-xs'
                  >
                    {option.label || 'Price'}: {formatPrice(option.price)} per {isBox ? 'box' : 'piece'}
                  </Button>
                ))}
              </div>
           
            </div>
          )}

          {/* Informational message when no additional prices */}
          {selectedShop && allAdditionalPrices.length > 0 && filteredAdditionalPrices.length === 0 && (
            <div className='rounded-md bg-blue-50 p-3 text-sm text-blue-800'>
              <p className='font-medium'>No suggested prices for {isBox ? 'box' : 'piece'} sales</p>
              <p className='text-xs mt-1'>
                Please enter a custom price in the field above.
              </p>
            </div>
          )}
        </div>

        {/* Quantity Input */}
        <div className='space-y-2'>
          <Label
            htmlFor='quantity'
            className='flex items-center gap-2 text-sm'
          >
            Quantity ({isBox ? 'Boxes' : 'Pieces'})
            {!selectedShop && (
              <span className='text-xs text-gray-500'>
                (Select a shop first)
              </span>
            )}
          </Label>
          <Input
            type='number'
            id='quantity'
            min='1'
            max={availableStock}
            step='1'
            value={displayQuantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            placeholder={`Enter number of ${isBox ? 'boxes' : 'pieces'}`}
            className={`w-full ${
              quantity > availableStock && selectedShop && availableStock > 0
                ? 'border-red-500 bg-red-50'
                : ''
            }`}
            disabled={!selectedShop || availableStock === 0}
          />
          <p
            className={`text-xs ${
              quantity > availableStock && selectedShop && availableStock > 0
                ? 'font-semibold text-red-600'
                : 'text-gray-500'
            }`}
          >
            {selectedShop ? (
              <>
                {getAvailableStockDisplay()}
                {quantity > availableStock && availableStock > 0 && (
                  <span className='ml-2 block'>
                    ⚠️ Quantity exceeds available stock!
                  </span>
                )}
                {availableStock === 0 && (
                  <span className='block text-red-500'>Out of stock</span>
                )}
              </>
            ) : (
              'Select a shop to see available quantity'
            )}
          </p>
        </div>

        {/* Order Summary */}
        <div className='rounded-md borderp-3'>
          <h4 className='mb-3 text-sm font-semibold'>Order Summary</h4>

          <div className='space-y-2'>
            {selectedShop ? (
              <>
                <div className='flex items-center justify-between text-sm'>
                  <span className='font-medium text-gray-700'>
                    Unit Price (per {isBox ? 'box' : 'piece'}):
                  </span>
                  <span className={`font-bold ${unitPrice && unitPrice > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {unitPrice && unitPrice > 0 ? formatPrice(unitPrice) : 'Not set'}
                  </span>
                </div>

                <div className='flex items-center justify-between text-sm'>
                  <span className='font-medium text-gray-700'>
                    Quantity ({isBox ? 'Boxes' : 'Pieces'}):
                  </span>
                  <span>{quantity > 0 ? quantity : 'Enter quantity'}</span>
                </div>

                {isBox && product?.boxSize && (
                  <div className='flex items-center justify-between text-sm'>
                    <span className='font-medium text-gray-700'>
                      Total Pieces:
                    </span>
                    <span>{quantity * product.boxSize} pieces</span>
                  </div>
                )}

                <div className='mt-2 border-t pt-2'>
                  <div className='flex items-center justify-between text-sm font-bold'>
                    <span>Total:</span>
                    <span className='text-blue-600'>
                      {quantity > 0 && unitPrice && unitPrice > 0 ? formatPrice(totalPrice) : '--'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className='py-4 text-center text-sm text-gray-500'>
                Select a shop to see order summary
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className='rounded-md bg-red-100 p-2 text-sm text-red-700'>
            {error}
          </div>
        )}

        <div className='flex flex-col justify-end space-y-2 pt-4 sm:flex-row sm:space-y-0 sm:space-x-2'>
          <Button
            variant='outline'
            onClick={handleClose}
            className='w-full sm:w-auto'
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={
              !selectedShop ||
              loading ||
              quantity > availableStock ||
              quantity <= 0 ||
              availableStock === 0 ||
              !unitPrice ||
              unitPrice <= 0
            }
            className='w-full sm:w-auto'
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Cart Component remains the same (omitted for brevity - keep your existing Cart component)
// Cart Component
interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCreateOrder: (orderData: Partial<ISell>) => Promise<void>;
  onResetCart: () => void;
}

const Cart = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCreateOrder,
  onResetCart
}: CartProps) => {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isOrderConfirmModalOpen, setIsOrderConfirmModalOpen] = useState(false);
  const [customerError, setCustomerError] = useState<string>('');

  const validateForm = () => {
    if (!selectedCustomer) {
      setCustomerError('Customer selection is required');
      return false;
    }
    setCustomerError('');
    return true;
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersData = await getCustomer();
        setCustomers(customersData);
      } catch (err) {
        toast.error(err as string);
      }
    };

    fetchCustomers();
  }, []);

  const handleRefreshCustomers = async () => {
    try {
      setLoading(true);
      const customersData = await getCustomer();
      setCustomers(customersData);
    } catch  {
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
    if (items.length === 0) return;

    const sellItems: ISellItem[] = items.map((item) => ({
      id: item.id,
      sellId: item.sellId,
      shopId: item.shop.id,
      productId: item.product.id,
      isBox: item.isBox,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      itemSaleStatus: 'PENDING' as any
    }));

    const orderData: Partial<ISell> = {
      customerId: selectedCustomer || undefined,
      totalProducts: items.length,
      subTotal: subtotal,
      discount,
      grandTotal,
      saleStatus: SaleStatus.NOT_APPROVED,
      notes: notes || undefined,
      saleDate: new Date().toISOString(),
      items: sellItems
    };

    setLoading(true);
    try {
      await onCreateOrder(orderData);
      setSelectedCustomer('');
      setDiscount(0);
      setNotes('');
      onResetCart();
      setIsOrderConfirmModalOpen(false);
    } catch  {
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = () => {
    if (items.length === 0) return;
    setIsOrderConfirmModalOpen(true);
  };


  const selectedCustomerDetails = customers.find(
    (c) => c.id === selectedCustomer
  );
  // SIMPLIFIED CUSTOMER OPTIONS - This will make search work
  const customerOptions = useMemo(() => {
    return customers
      .filter(customer => customer.id && customer.name)
      .map((customer) => ({
        value: customer.id!,
        // Put ALL searchable text in the label
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

  return (
    <>
      <Card className='mx-auto w-full max-w-screen sm:max-w-4xl lg:max-w-5xl'>
        <CardHeader className='py-3 sm:py-4'>
          <h2 className='text-lg font-bold sm:text-xl'>Order Summary</h2>
        </CardHeader>
        <CardContent className='space-y-3 px-2 sm:space-y-4 sm:px-4'>
          {/* Customer Selection */}
          <div className='flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-3'>
            <div className='w-full flex-1'>
              <Label htmlFor='customer' className='text-sm sm:text-base dark:text-gray-300'>
                Customer <span className='text-red-500'>*</span>
              </Label>
              
              {/* SIMPLIFIED SELECT - REMOVE CUSTOM FILTER OPTION */}
              <SelectReac
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
                // REMOVE the custom filterOption - let React Select handle it
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
                styles={{
  control: (base, state) => ({
    ...base,
    minHeight: '40px',
    borderColor: customerError 
      ? '#ef4444' 
      : state.isFocused 
        ? '#3b82f6' 
        : '#e5e7eb',
    backgroundColor: 'white',
    '&:hover': {
      borderColor: customerError ? '#ef4444' : '#9ca3af',
    },
    boxShadow: state.isFocused 
      ? customerError 
        ? '0 0 0 1px #ef4444' 
        : '0 0 0 1px #3b82f6'
      : 'none',
    // Dark mode
    '.dark &': {
      borderColor: customerError 
        ? '#ef4444' 
        : state.isFocused 
          ? '#3b82f6' 
          : '#4b5563',
      backgroundColor: '#1f2937',
      color: '#f3f4f6',
      '&:hover': {
        borderColor: customerError ? '#ef4444' : '#6b7280',
      },
    },
  }),
  placeholder: (base) => ({
    ...base,
    fontSize: '14px',
    color: '#6b7280',
    '@media (min-width: 640px)': {
      fontSize: '16px',
    },
    // Dark mode
    '.dark &': {
      color: '#9ca3af',
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: '#111827',
    // Dark mode
    '.dark &': {
      color: '#f3f4f6',
    },
  }),
  input: (base) => ({
    ...base,
    color: '#111827',
    // Dark mode
    '.dark &': {
      color: '#f3f4f6',
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
    backgroundColor: 'white',
    borderColor: '#e5e7eb',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    // Dark mode
    '.dark &': {
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    },
  }),
  menuList: (base) => ({
    ...base,
    padding: 0,
    // Dark mode
    '.dark &': {
      backgroundColor: '#1f2937',
    },
  }),
  option: (base, state) => ({
    ...base,
    fontSize: '14px',
    padding: '8px 12px',
    backgroundColor: state.isSelected 
      ? '#3b82f6' 
      : state.isFocused 
        ? '#f3f4f6' 
        : 'transparent',
    color: state.isSelected ? '#ffffff' : '#111827',
    '&:active': {
      backgroundColor: state.isSelected ? '#2563eb' : '#e5e7eb',
    },
    // Dark mode
    '.dark &': {
      backgroundColor: state.isSelected 
        ? '#3b82f6' 
        : state.isFocused 
          ? '#374151' 
          : 'transparent',
      color: state.isSelected ? '#ffffff' : '#f3f4f6',
      '&:active': {
        backgroundColor: state.isSelected ? '#2563eb' : '#4b5563',
      },
    },
  }),
  dropdownIndicator: (base, ) => ({
    ...base,
    color: '#6b7280',
    padding: '8px',
    transition: 'color 0.2s',
    '&:hover': {
      color: '#374151',
    },
    // Dark mode
    '.dark &': {
      color: '#9ca3af',
      '&:hover': {
        color: '#f3f4f6',
      },
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: '#6b7280',
    padding: '8px',
    transition: 'color 0.2s',
    '&:hover': {
      color: '#374151',
    },
    // Dark mode
    '.dark &': {
      color: '#9ca3af',
      '&:hover': {
        color: '#f3f4f6',
      },
    },
  }),
  indicatorSeparator: (base, state) => ({
    ...base,
    backgroundColor: state.isDisabled ? 'transparent' : '#e5e7eb',
    // Dark mode
    '.dark &': {
      backgroundColor: state.isDisabled ? 'transparent' : '#4b5563',
    },
  }),
  noOptionsMessage: (base) => ({
    ...base,
    color: '#6b7280',
    padding: '16px',
    // Dark mode
    '.dark &': {
      color: '#9ca3af',
    },
  }),
  loadingMessage: (base) => ({
    ...base,
    color: '#6b7280',
    padding: '16px',
    // Dark mode
    '.dark &': {
      color: '#9ca3af',
    },
  }),
  loadingIndicator: (base) => ({
    ...base,
    color: '#6b7280',
    // Dark mode
    '.dark &': {
      color: '#9ca3af',
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '0 12px',
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#e5e7eb',
    // Dark mode
    '.dark &': {
      backgroundColor: '#374151',
    },
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#111827',
    // Dark mode
    '.dark &': {
      color: '#f3f4f6',
    },
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#6b7280',
    '&:hover': {
      backgroundColor: '#d1d5db',
      color: '#374151',
    },
    // Dark mode
    '.dark &': {
      color: '#9ca3af',
      '&:hover': {
        backgroundColor: '#4b5563',
        color: '#f3f4f6',
      },
    },
  }),
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
                className='w-full py-2 text-sm sm:w-auto sm:py-2.5 sm:text-base dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                onClick={() => setIsCustomerModalOpen(true)}
                className='w-full py-2 text-sm sm:w-auto sm:py-2.5 sm:text-base dark:bg-blue-700 dark:hover:bg-blue-800'
              >
                + New
              </Button>
            </div>
          </div>

          {/* Cart Items */}
          {items.length === 0 ? (
            <p className='py-4 text-center text-sm text-gray-500 sm:text-base'>
              Your cart is empty
            </p>
          ) : (
            <div className='overflow-x-auto'>
              <Table className='min-w-full text-xs sm:text-sm md:text-base'>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-10'>No</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Shop</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className='text-right'>Total</TableHead>
                    <TableHead className='text-center'>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className='font-medium'>{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <div className='font-medium'>{item.product.name}</div>
                          <div className='text-xs text-gray-500'>
                            {item.product.productCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='text-xs sm:text-sm'>
                          <div className='font-medium'>{item.shop.name}</div>
                          {item.shop.branch?.name && (
                            <div className='text-gray-500'>
                              Branch: {item.shop.branch.name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatPrice(item.unitPrice)}</TableCell>
                      <TableCell>
                        <Input
                          type='number'
                          min='1'
                          max={item.availableQuantity}
                          value={item.quantity}
                          onChange={(e) =>
                            onUpdateQuantity(item.id, Number(e.target.value))
                          }
                          className='w-16 text-sm sm:w-20 sm:text-base'
                        />
                      </TableCell>
                      <TableCell className='text-right'>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Order Totals */}
          {items.length > 0 && (
            <div className='space-y-2 pt-3 sm:pt-4'>
              <div className='flex flex-col text-sm sm:flex-row sm:justify-between sm:text-base'>
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className='flex flex-col items-start gap-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:text-base'>
                <span>Discount:</span>
                <Input
                  type='number'
                  min='0'
                  max={subtotal}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className='w-full text-sm sm:w-24 sm:text-base'
                />
              </div>
              <div className='flex flex-col border-t pt-2 text-base font-bold sm:flex-row sm:justify-between sm:text-lg'>
                <span>Grand Total:</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {items.length > 0 && (
            <div className='space-y-2'>
              <Label htmlFor='notes' className='text-sm sm:text-base'>
                Notes (Optional)
              </Label>
              <Textarea
                id='notes'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Add any notes for this order'
                className='min-h-20 w-full text-sm sm:text-base'
                rows={3}
              />
            </div>
          )}
        </CardContent>

        <CardFooter className='px-3 py-3 sm:px-4 sm:py-4'>
          <Button
            className='w-full py-2 text-sm sm:py-2.5 sm:text-base'
            disabled={items.length === 0 || loading}
            onClick={handleConfirmOrder}
          >
            {loading ? 'Processing...' : 'Create Order'}
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
        title='Order Confirmation'
        description='Please review your order before confirming'
        isOpen={isOrderConfirmModalOpen}
        onClose={() => setIsOrderConfirmModalOpen(false)}
        size='xxl'
      >
        <div className='max-h-[70vh] space-y-4 overflow-y-auto py-2 sm:py-4'>
          {/* Customer Information */}
          <div className='rounded-md bg-gray-50 p-3 sm:p-4 dark:bg-gray-800'>
            <h3 className='mb-2 text-sm font-semibold text-gray-900 sm:text-base dark:text-gray-100'>
              Customer Information
            </h3>
            {selectedCustomerDetails ? (
              <div className='space-y-1 text-xs sm:text-sm'>
                <p className='text-gray-700 dark:text-gray-300'>
                  <span className='font-medium'>Name:</span>{' '}
                  {selectedCustomerDetails.name}
                </p>
                {selectedCustomerDetails.companyName && (
                  <p className='text-gray-700 dark:text-gray-300'>
                    <span className='font-medium'>Company:</span>{' '}
                    {selectedCustomerDetails.companyName}
                  </p>
                )}
                {selectedCustomerDetails.phone1 && (
                  <p className='text-gray-700 dark:text-gray-300'>
                    <span className='font-medium'>Phone:</span>{' '}
                    {selectedCustomerDetails.phone1}
                  </p>
                )}
              </div>
            ) : (
              <p className='text-xs text-gray-500 sm:text-sm dark:text-gray-400'>
                No customer selected
              </p>
            )}
          </div>

          {/* Order Items Summary */}
          <div className='overflow-hidden rounded-md border border-gray-300 dark:border-gray-600'>
            <Table>
              <TableHeader>
                <TableRow className='bg-gray-50 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800'>
                  <TableHead className='w-8 text-xs text-gray-900 sm:text-sm dark:text-gray-100'>
                    #
                  </TableHead>
                  <TableHead className='text-xs text-gray-900 sm:text-sm dark:text-gray-100'>
                    Product
                  </TableHead>
                  <TableHead className='text-xs text-gray-900 sm:text-sm dark:text-gray-100'>
                    Shop
                  </TableHead>
                  <TableHead className='text-right text-xs text-gray-900 sm:text-sm dark:text-gray-100'>
                    Qty
                  </TableHead>
                  <TableHead className='text-right text-xs text-gray-900 sm:text-sm dark:text-gray-100'>
                    Price
                  </TableHead>
                  <TableHead className='text-right text-xs text-gray-900 sm:text-sm dark:text-gray-100'>
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className='hover:bg-gray-50 dark:hover:bg-gray-700'
                  >
                    <TableCell className='text-xs text-gray-900 sm:text-sm dark:text-gray-100'>
                      {index + 1}
                    </TableCell>
                    <TableCell className='text-xs sm:text-sm'>
                      <div>
                        <div className='font-medium text-gray-900 dark:text-gray-100'>
                          {item.product.name}
                        </div>
                        <div className='text-gray-500 dark:text-gray-400'>
                          {item.product.productCode}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='text-xs sm:text-sm'>
                      <div>
                        <div className='font-medium text-gray-900 dark:text-gray-100'>
                          {item.shop.name}
                        </div>
                        {item.shop.branch?.name && (
                          <div className='text-xs text-gray-500 dark:text-gray-400'>
                            Branch: {item.shop.branch.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='text-right text-xs text-gray-900 sm:text-sm dark:text-gray-100'>
                      {item.quantity}
                    </TableCell>
                    <TableCell className='text-right text-xs sm:text-sm'>
                      <span className='text-gray-900 dark:text-gray-100'>
                        {formatPrice(item.unitPrice)}
                      </span>
                    </TableCell>
                    <TableCell className='text-right text-xs text-gray-900 sm:text-sm dark:text-gray-100'>
                      {formatPrice(item.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Order Summary */}
          <div className='space-y-2 rounded-md bg-gray-50 p-3 sm:p-4 dark:bg-gray-800'>
            <div className='flex justify-between text-xs sm:text-sm'>
              <span className='text-gray-700 dark:text-gray-300'>
                Subtotal:
              </span>
              <span className='text-gray-900 dark:text-gray-100'>
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className='flex justify-between text-xs sm:text-sm'>
              <span className='text-gray-700 dark:text-gray-300'>
                Discount:
              </span>
              <span className='text-red-600 dark:text-red-400'>
                -{formatPrice(discount)}
              </span>
            </div>
            <div className='flex justify-between border-t border-gray-200 pt-2 text-sm font-bold sm:text-base dark:border-gray-600'>
              <span className='text-gray-900 dark:text-gray-100'>
                Grand Total:
              </span>
              <span className='text-blue-600 dark:text-blue-400'>
                {formatPrice(grandTotal)}
              </span>
            </div>
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
              className='w-full border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50 sm:w-1/2 sm:py-2.5 sm:text-base dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={loading}
              className='w-full py-2 text-sm sm:w-1/2 sm:py-2.5 sm:text-base'
            >
              {loading ? (
                <div className='flex items-center justify-center'>
                  <svg
                    className='mr-2 -ml-1 h-4 w-4 animate-spin text-white'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                  Creating Order...
                </div>
              ) : (
                'Confirm Order'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// ... (keep all the helper functions and other components like ProductCard, ShopBatchModal, Cart)

// Update ProductSearchProps interface
interface ProductSearchProps {
  products: any[];
  categories: ICategory[];
  brands: IBrand[]; // Add brands prop
  initialSearchTerm?: string;
  initialCategoryName?: string;
  initialBrandName?: string; // Changed from initialSubCategoryName
}

interface SearchFilters {
  category: string;
  brand: string; // Changed from subCategory to brand
  productName: string;
  viscosity: string;
    oilType: string;

      additiveType: string;

        generic: string;

}




export const ProductSearch = ({
  products,
  categories,
  brands,
  initialSearchTerm = '',
  initialCategoryName = 'all',
  initialBrandName = 'all'
}: ProductSearchProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dark mode detection
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

  // Dark mode styles for react-select
  const darkStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      color: '#f9fafb',
      '&:hover': {
        borderColor: '#4b5563'
      }
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: '#1f2937',
      color: '#f9fafb'
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#374151' : '#1f2937',
      color: '#f9fafb',
      '&:active': {
        backgroundColor: '#4b5563'
      }
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
      '&:hover': {
        color: '#f9fafb'
      }
    }),
    clearIndicator: (base: any) => ({
      ...base,
      color: '#9ca3af',
      '&:hover': {
        color: '#f87171'
      }
    }),
    indicatorSeparator: (base: any) => ({
      ...base,
      backgroundColor: '#374151'
    }),
    noOptionsMessage: (base: any) => ({
      ...base,
      color: '#9ca3af'
    }),
    loadingMessage: (base: any) => ({
      ...base,
      color: '#9ca3af'
    })
  };

  // Light mode styles for react-select
  const lightStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      color: '#111827',
      '&:hover': {
        borderColor: '#9ca3af'
      }
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: '#ffffff',
      color: '#111827'
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#f3f4f6' : '#ffffff',
      color: '#111827',
      '&:active': {
        backgroundColor: '#e5e7eb'
      }
    }),
    singleValue: (base: any) => ({
      ...base,
      color: '#111827'
    }),
    input: (base: any) => ({
      ...base,
      color: '#111827'
    }),
    placeholder: (base: any) => ({
      ...base,
      color: '#9ca3af'
    })
  };

  const selectStyles = isDark ? darkStyles : lightStyles;

  // Convert options for react-select format
  const categorySelectOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(category => ({ value: category.name, label: category.name }))
  ];

  const brandSelectOptions = [
    { value: 'all', label: 'All Brands' },
    ...brands.map(brand => ({ value: brand.name, label: brand.name }))
  ];

  const viscositySelectOptions = [
    { value: 'all', label: 'All Viscosities' },
    ...viscosityOptions
  ];

  const oilTypeSelectOptions = [
    { value: 'all', label: 'All Oil Types' },
    ...oilTypeOptions
  ];

  const additiveTypeSelectOptions = [
    { value: 'all', label: 'All Additive Types' },
    ...additiveTypeOptions
  ];

  // Initialize state with props directly
  const [searchFilters, setSearchFilters] = useState<SearchFilters>(() => {
    // Use URL params first, then fall back to initial props
    const urlCategory = searchParams.get('categoryName') || searchParams.get('categoryId');
    const urlBrand = searchParams.get('brandName') || searchParams.get('brandId');
    const urlSearchTerm = searchParams.get('searchTerm');
    const urlViscosity = searchParams.get('viscosity');
    const urlOilType = searchParams.get('oilType');
    const urlAdditiveType = searchParams.get('additiveType');
    const urlGeneric = searchParams.get('generic');
    
    return {
      category: urlCategory || initialCategoryName || 'all',
      brand: urlBrand || initialBrandName || 'all',
      productName: urlSearchTerm || initialSearchTerm || '',
      viscosity: urlViscosity || 'all',
      oilType: urlOilType || 'all',
      additiveType: urlAdditiveType || 'all',
      generic: urlGeneric || 'all'
    };
  });

  // Compute filteredProducts directly from state and props
  const filteredProducts = useMemo(() => {
    let filtered = products || [];

    // Filter by category name
    if (searchFilters.category !== 'all') {
      filtered = filtered.filter((product) => {
        const productCategoryName = product.category?.name || product.category;
        return productCategoryName === searchFilters.category;
      });
    }

    // Filter by brand name
    if (searchFilters.brand !== 'all') {
      filtered = filtered.filter((product) => {
        const productBrandName = product.brand?.name || product.brand;
        return productBrandName === searchFilters.brand;
      });
    }

    // Filter by viscosity
    if (searchFilters.viscosity !== 'all') {
      filtered = filtered.filter((product) => {
        return product.viscosity === searchFilters.viscosity;
      });
    }

    // Filter by oil type
    if (searchFilters.oilType !== 'all') {
      filtered = filtered.filter((product) => {
        return product.oilType === searchFilters.oilType;
      });
    }

    // Filter by additive type
    if (searchFilters.additiveType !== 'all') {
      filtered = filtered.filter((product) => {
        return product.additiveType === searchFilters.additiveType;
      });
    }

    // Filter by generic (ACEA standards)
    if (searchFilters.generic !== 'all') {
      filtered = filtered.filter((product) => {
        return product.generic === searchFilters.generic;
      });
    }

    // Filter by product name or generic name
    if (searchFilters.productName) {
      filtered = filtered.filter((product) => {
        const searchTerm = searchFilters.productName.toLowerCase();
        return (
          product.name.toLowerCase().includes(searchTerm) ||
          product.productCode.toLowerCase().includes(searchTerm) ||
          (product.generic &&
            product.generic.toLowerCase().includes(searchTerm)) ||
          (product.viscosity &&
            product.viscosity.toLowerCase().includes(searchTerm)) ||
          (product.oilType &&
            product.oilType.toLowerCase().includes(searchTerm)) ||
          (product.additiveType &&
            product.additiveType.toLowerCase().includes(searchTerm))
        );
      });
    }

    return filtered;
  }, [searchFilters, products]);

  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);

  // Update URL when filters change
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (searchFilters.productName) {
      params.set('searchTerm', searchFilters.productName);
    } else {
      params.delete('searchTerm');
    }

    if (searchFilters.category !== 'all') {
      params.set('categoryName', searchFilters.category);
    } else {
      params.delete('categoryName');
    }

    if (searchFilters.brand !== 'all') {
      params.set('brandName', searchFilters.brand);
    } else {
      params.delete('brandName');
    }

    if (searchFilters.viscosity !== 'all') {
      params.set('viscosity', searchFilters.viscosity);
    } else {
      params.delete('viscosity');
    }

    if (searchFilters.oilType !== 'all') {
      params.set('oilType', searchFilters.oilType);
    } else {
      params.delete('oilType');
    }

    if (searchFilters.additiveType !== 'all') {
      params.set('additiveType', searchFilters.additiveType);
    } else {
      params.delete('additiveType');
    }

    if (searchFilters.generic !== 'all') {
      params.set('generic', searchFilters.generic);
    } else {
      params.delete('generic');
    }

    // Update URL without page refresh using Next.js router
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.push(newUrl, { scroll: false });
  }, [searchFilters, router, searchParams]);

  // Effect to update URL when filters change
  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  // Get current products for pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setSearchFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      return newFilters;
    });
    // Reset to page 1 when filters change
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchFilters({
      category: 'all',
      brand: 'all',
      productName: '',
      viscosity: 'all',
      oilType: 'all',
      additiveType: 'all',
      generic: 'all'
    });
    setCurrentPage(1);
    // Also clear URL parameters
    router.push(window.location.pathname, { scroll: false });
  };

  const handleSelectProduct = (product: IProduct) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAddToCart = (item: CartItem) => {
    // Check if the same product from the same shop already exists in cart
    const existingItemIndex = cartItems.findIndex(
      (cartItem) =>
        cartItem.product.id === item.product.id &&
        cartItem.shop.id === item.shop.id
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += item.quantity;
      updatedItems[existingItemIndex].totalPrice =
        updatedItems[existingItemIndex].unitPrice *
        updatedItems[existingItemIndex].quantity;
      setCartItems(updatedItems);
    } else {
      // Add new item to cart
      setCartItems([...cartItems, item]);
    }
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity,
              totalPrice: item.unitPrice * quantity
            }
          : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const handleCreateOrder = async (orderData: Partial<ISell>) => {
    try {
      await createSell(orderData);
      toast.success('Order created successfully!');
      return Promise.resolve();
    } catch (error) {
      toast.error('Failed to create order. Please try again.');
      return Promise.reject(error);
    }
  };

  const handleResetCart = () => {
    setCartItems([]);
  };

  // Get selected values for react-select
  const getSelectedCategory = () => {
    return categorySelectOptions.find(option => option.value === searchFilters.category);
  };

  const getSelectedBrand = () => {
    return brandSelectOptions.find(option => option.value === searchFilters.brand);
  };

  const getSelectedViscosity = () => {
    return viscositySelectOptions.find(option => option.value === searchFilters.viscosity);
  };

  const getSelectedOilType = () => {
    return oilTypeSelectOptions.find(option => option.value === searchFilters.oilType);
  };

  const getSelectedAdditiveType = () => {
    return additiveTypeSelectOptions.find(option => option.value === searchFilters.additiveType);
  };

  return (
    <div className='flex flex-col space-y-6 lg:flex-row lg:space-y-0 lg:space-x-6'>
      <div className='flex-1 space-y-4 sm:space-y-6'>
        {/* Search Filters */}
        <div className='w-full rounded-lg p-4 shadow-md sm:p-6'>
          <h2 className='mb-3 text-xl font-bold sm:mb-4 sm:text-2xl'>
            Search Products
          </h2>

          <div className='mb-3 grid grid-cols-1 gap-3 sm:mb-4 sm:grid-cols-2 lg:grid-cols-3'>
            {/* Category Select with Search */}
            <div>
              <label className='mb-1 block text-xs font-medium sm:mb-2 sm:text-sm'>
                Category
              </label>
              <SelectReac
                value={getSelectedCategory()}
                onChange={(option) => handleFilterChange('category', option?.value || 'all')}
                options={categorySelectOptions}
                isSearchable={true}
                placeholder="Search category..."
                className="text-xs sm:text-sm"
                classNamePrefix="react-select"
                styles={selectStyles}
              />
            </div>

            {/* Brand Select with Search */}
            <div>
              <label className='mb-1 block text-xs font-medium sm:mb-2 sm:text-sm'>
                Brand
              </label>
              <SelectReac
                value={getSelectedBrand()}
                onChange={(option) => handleFilterChange('brand', option?.value || 'all')}
                options={brandSelectOptions}
                isSearchable={true}
                placeholder="Search brand..."
                className="text-xs sm:text-sm"
                classNamePrefix="react-select"
                styles={selectStyles}
              />
            </div>

            {/* Viscosity Select with Search */}
            <div>
              <label className='mb-1 block text-xs font-medium sm:mb-2 sm:text-sm'>
                Viscosity
              </label>
              <SelectReac
                value={getSelectedViscosity()}
                onChange={(option) => handleFilterChange('viscosity', option?.value || 'all')}
                options={viscositySelectOptions}
                isSearchable={true}
                placeholder="Search viscosity..."
                className="text-xs sm:text-sm"
                classNamePrefix="react-select"
                styles={selectStyles}
              />
            </div>

            {/* Oil Type Select with Search */}
            <div>
              <label className='mb-1 block text-xs font-medium sm:mb-2 sm:text-sm'>
                Oil Type
              </label>
              <SelectReac
                value={getSelectedOilType()}
                onChange={(option) => handleFilterChange('oilType', option?.value || 'all')}
                options={oilTypeSelectOptions}
                isSearchable={true}
                placeholder="Search oil type..."
                className="text-xs sm:text-sm"
                classNamePrefix="react-select"
                styles={selectStyles}
              />
            </div>

            {/* Additive Type Select with Search */}
            <div>
              <label className='mb-1 block text-xs font-medium sm:mb-2 sm:text-sm'>
                Additive Type
              </label>
              <SelectReac
                value={getSelectedAdditiveType()}
                onChange={(option) => handleFilterChange('additiveType', option?.value || 'all')}
                options={additiveTypeSelectOptions}
                isSearchable={true}
                placeholder="Search additive type..."
                className="text-xs sm:text-sm"
                classNamePrefix="react-select"
                styles={selectStyles}
              />
            </div>

            {/* Product Name Search */}
            <div>
              <label className='mb-1 block text-xs font-medium sm:mb-2 sm:text-sm'>
                Product Name/Code/Generic
              </label>
              <Input
                type='text'
                placeholder='Search by name, code or generic...'
                value={searchFilters.productName}
                onChange={(e) =>
                  handleFilterChange('productName', e.target.value)
                }
                className='w-full text-xs sm:text-sm'
              />
            </div>
          </div>

          <Button
            onClick={clearFilters}
            variant='outline'
            className='w-full py-2 text-xs sm:w-auto sm:py-2.5 sm:text-sm'
          >
            Clear Filters
          </Button>
        </div>

        {/* Results Count */}
        <div className='w-full rounded-lg p-3 shadow-md sm:p-4'>
          <p className='text-xs text-gray-600 sm:text-sm dark:text-gray-400'>
            Showing {indexOfFirstProduct + 1}-
            {Math.min(indexOfLastProduct, filteredProducts.length)} of{' '}
            {filteredProducts.length} products
          </p>
        </div>

        {/* Product Grid */}
        <div className='grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3'>
          {currentProducts.length > 0 ? (
            currentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={handleSelectProduct}
              />
            ))
          ) : (
            <div className='col-span-full py-8 text-center sm:py-12'>
              <p className='text-base text-gray-500 sm:text-lg dark:text-gray-400'>
                No products found matching your criteria.
              </p>
              <Button
                onClick={clearFilters}
                variant='link'
                className='mt-2 text-xs sm:text-sm'
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className='mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-8 sm:gap-3'>
            <Button
              key='prev'
              variant='outline'
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className='px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm'
            >
              Previous
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={`page-${page}`}
                variant={currentPage === page ? 'default' : 'outline'}
                onClick={() => paginate(page)}
                className='px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm'
              >
                {page}
              </Button>
            ))}

            <Button
              key='next'
              variant='outline'
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className='px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm'
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <div className='mt-6 w-full lg:mt-0 lg:w-140'>
        <Cart
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCreateOrder={handleCreateOrder}
          onResetCart={handleResetCart}
        />
      </div>

      {/* Shop Selection Modal */}
      <ShopBatchModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
};
export default ProductSearch;