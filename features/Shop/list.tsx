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
          {item.category && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {item.category.name}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between p-3 pt-2">
          <span className="text-lg font-extrabold text-gray-900 dark:text-gray-100">
            {formattedPrice}
          </span>

          <button
            className="rounded-lg bg-[#0f172a] dark:bg-blue-600 px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-gray-800 dark:hover:bg-blue-500"
            onClick={(e) => {
              e.stopPropagation();
              openModal();
            }}
          >
            View
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
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Stock: {item.stock || 0}
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-2">
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

// ==================== ITEM SELECTION MODAL ====================
interface ItemModalProps {
  item: IItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: IItem, quantity: number, customPrice?: number) => void;
}

const ItemModal = ({ item, isOpen, onClose, onAddToCart }: ItemModalProps) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<string>('');

  const handleAddToCart = () => {
    if (!item) return;
    
    const price = customPrice ? parseFloat(customPrice) : item.price;
    const availableStock = item.stock ?? 0;
    
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }
    
    if (quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    
    if (quantity > availableStock) {
      alert(`Not enough stock. Only ${availableStock} available.`);
      return;
    }
    
    onAddToCart(item, quantity, price);
    onClose();
    setQuantity(1);
    setCustomPrice('');
  };

  if (!item) return null;

  return (
    <Modal
      title={`Add ${item.name} to Cart`}
      description='Set quantity and price'
      isOpen={isOpen}
      onClose={onClose}
      size='md'
    >
      <div className='space-y-4 py-4'>
        <div className='space-y-2'>
          <Label htmlFor='quantity'>Quantity</Label>
          <Input
            id='quantity'
            type='number'
            min='1'
            max={item.stock}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          <p className='text-xs text-gray-500'>Available stock: {item.stock}</p>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='price'>Unit Price (Optional override)</Label>
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

        <div className='flex justify-end space-x-2 pt-4'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAddToCart}>
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
      } catch (err: any) {
        toast.error(err.message || 'Failed to fetch customers');
      }
    };

    fetchCustomers();
  }, []);

  const handleRefreshCustomers = async () => {
    try {
      setLoading(true);
      const customersData = await getCustomer();
      setCustomers(customersData);
      toast.success('Customers refreshed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to refresh customers');
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
    totalProducts: items.length,
    items: items.map(cartItem => ({
      itemId: cartItem.item.id,
      quantity: cartItem.quantity,
      unitPrice: cartItem.unitPrice,
      totalPrice: cartItem.totalPrice,
    })),
  };

  setLoading(true);
  try {
    await createSell(orderData);
    toast.success('Order created successfully!');
    setSelectedCustomer('');
    setDiscount(0);
    setNotes('');
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
          <h2 className='text-lg font-bold sm:text-xl'>Shopping Cart ({items.length} items)</h2>
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

          {/* Cart Items Table */}
          <div className='overflow-x-auto'>
            <Table className='min-w-full text-xs sm:text-sm md:text-base'>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-10'>#</TableHead>
                  <TableHead>Product</TableHead>
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
                        <div className='font-medium'>{item.item.name}</div>
                        <div className='text-xs text-gray-500'>
                          Stock: {item.item.stock}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(item.unitPrice)}</TableCell>
                    <TableCell>
                      <Input
                        type='number'
                        min='1'
                        max={item.item.stock}
                        value={item.quantity}
                        onChange={(e) =>
                          onUpdateQuantity(item.id, Number(e.target.value))
                        }
                        className='w-16 text-sm sm:w-20 sm:text-base'
                      />
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
                ))}
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

          {/* Order Items Summary */}
          <div className='overflow-hidden rounded-md border border-gray-200 dark:border-gray-700'>
            <Table>
              <TableHeader>
                <TableRow className='bg-gray-50 dark:bg-gray-800'>
                  <TableHead className='text-xs'>#</TableHead>
                  <TableHead className='text-xs'>Product</TableHead>
                  <TableHead className='text-right text-xs'>Qty</TableHead>
                  <TableHead className='text-right text-xs'>Price</TableHead>
                  <TableHead className='text-right text-xs'>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className='text-xs'>{index + 1}</TableCell>
                    <TableCell className='text-xs'>
                      <div>
                        <div className='font-medium'>{item.item.name}</div>
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
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className='bg-gray-50 dark:bg-gray-800'>
                  <TableCell colSpan={4} className='text-right font-medium'>
                    Subtotal:
                  </TableCell>
                  <TableCell className='text-right'>{formatPrice(subtotal)}</TableCell>
                </TableRow>
                {discount > 0 && (
                  <TableRow className='bg-gray-50 dark:bg-gray-800'>
                    <TableCell colSpan={4} className='text-right font-medium'>
                      Discount:
                    </TableCell>
                    <TableCell className='text-right text-red-600'>
                      -{formatPrice(discount)}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow className='bg-gray-50 dark:bg-gray-800'>
                  <TableCell colSpan={4} className='text-right font-bold'>
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
interface ProductSearchProps {
  items: IItem[];
}

interface SearchFilters {
  itemName: string;
}

export const ProductSearch = ({ items }: ProductSearchProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    itemName: searchParams?.get('searchTerm') || ''
  });
  
  const [selectedItem, setSelectedItem] = useState<IItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = items || [];
    
    if (searchFilters.itemName) {
      const searchTerm = searchFilters.itemName.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchTerm)
      );
    }
    
    return filtered;
  }, [searchFilters, items]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleFilterChange = (value: string) => {
    setSearchFilters({ itemName: value });
    setCurrentPage(1);
    
    // Update URL
    const params = new URLSearchParams(searchParams?.toString());
    if (value) {
      params.set('searchTerm', value);
    } else {
      params.delete('searchTerm');
    }
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    setSearchFilters({ itemName: '' });
    setCurrentPage(1);
    router.push(window.location.pathname, { scroll: false });
  };

  const handleSelectItem = (item: IItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAddToCart = (item: IItem, quantity: number, customPrice?: number) => {
    const unitPrice = customPrice || item.price;
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
      setCartItems([
        ...cartItems,
        {
          id: `${Date.now()}-${item.id}`,
          item,
          quantity,
          unitPrice,
          totalPrice: unitPrice * quantity
        }
      ]);
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

  return (
    <div className='flex flex-col space-y-6 lg:flex-row lg:space-y-0 lg:space-x-6'>
      {/* Products Section */}
      <div className='flex-1 space-y-4'>
        {/* Search Filters */}
        <div className='w-full rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-900'>
          <h2 className='mb-3 text-xl font-bold'>Search Products</h2>
          
          <div className='mb-3'>
            <Input
              type='text'
              placeholder='Search by product name...'
              value={searchFilters.itemName}
              onChange={(e) => handleFilterChange(e.target.value)}
              className='w-full'
            />
          </div>
          
          {(searchFilters.itemName) && (
            <Button onClick={clearFilters} variant='outline' className='w-full'>
              Clear Filters
            </Button>
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