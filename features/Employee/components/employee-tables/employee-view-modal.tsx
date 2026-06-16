/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { IEmployee } from '@/models/employee';
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from 'react';

interface EmployeeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: IEmployee | null;
}

export const EmployeeViewModal: React.FC<EmployeeViewModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  if (!data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-lg p-6'>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold'>
            Employee Information
          </DialogTitle>
        </DialogHeader>

        {/* Basic Info */}
        <div className='grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
          <p className='font-medium'>Name:</p>
          <p>{data.name}</p>

          <p className='font-medium'>Email:</p>
          <p>{data.email}</p>

          <p className='font-medium'>Phone:</p>
          <p>{data.phone || 'N/A'}</p>

          <p className='font-medium'>Role:</p>
          <p>{data.role?.name || 'N/A'}</p>
          <p className='font-medium'>Branch:</p>
        </div>

        {/* Shops Section */}
        <div className='mt-5'>
          <h3 className='mb-1 text-sm font-semibold'>Assigned Shops</h3>
          {Array.isArray(data.showroom) && data.showroom.length > 0 ? (
            <ul className='ml-5 list-disc text-sm'>
              {data.showroom.map((shop: { id: Key | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => (
                <li key={shop.id}>{shop.name}</li>
              ))}
            </ul>
          ) : (
            <p className='text-muted-foreground text-sm'>No shops assigned</p>
          )}
        </div>

        {/* Stores Section */}
        <div className='mt-4'>
          <h3 className='mb-1 text-sm font-semibold'>Assigned Stores</h3>
          {data.store && Array.isArray(data.store) && data.store.length > 0 ? (
            <ul className='ml-5 list-disc text-sm'>
              {data.store.map((store: { id: Key | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => (
                <li key={store.id}>{store.name}</li>
              ))}
            </ul>
          ) : (
            <p className='text-muted-foreground text-sm'>No stores assigned</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
