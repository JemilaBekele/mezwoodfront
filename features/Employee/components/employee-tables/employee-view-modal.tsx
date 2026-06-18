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
import { Store, Building2, User, Mail, Phone, Shield } from 'lucide-react';

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
      <DialogContent className='max-w-2xl p-6'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-semibold flex items-center gap-2'>
            <User className="h-6 w-6 text-blue-600" />
            Employee Information
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info - Grid Layout */}
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Role</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.role?.name || 'N/A'}</p>
                </div>
              </div>

              {data.userCode && (
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 text-gray-500 mt-0.5">#</div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">User Code</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.userCode}</p>
                  </div>
                </div>
              )}

              {data.status && (
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 text-gray-500 mt-0.5">●</div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</p>
                    <p className="text-sm font-medium">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        data.status === 'Active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : data.status === 'Inactive'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {data.status}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Showrooms Section - Plural */}
          <div className="rounded-lg border border-blue-100 bg-blue-50/30 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Assigned Showrooms
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                  ({data.showrooms?.length || 0})
                </span>
              </h3>
            </div>
            {data.showrooms && Array.isArray(data.showrooms) && data.showrooms.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {data.showrooms.map((showroom) => (
                  <div
                    key={showroom.id}
                    className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm dark:bg-gray-800"
                  >
                    <Building2 className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {showroom.name}
                    </span>
                    {showroom.isMain && (
                      <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No showrooms assigned</p>
            )}
          </div>

          {/* Assigned Stores Section - Plural */}
          <div className="rounded-lg border border-green-100 bg-green-50/30 p-4 dark:border-green-900/30 dark:bg-green-900/10">
            <div className="mb-3 flex items-center gap-2">
              <Store className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Assigned Stores
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                  ({data.stores?.length || 0})
                </span>
              </h3>
            </div>
            {data.stores && Array.isArray(data.stores) && data.stores.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {data.stores.map((store) => (
                  <div
                    key={store.id}
                    className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm dark:bg-gray-800"
                  >
                    <Store className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {store.name}
                    </span>
                    {store.isMain && (
                      <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No stores assigned</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};