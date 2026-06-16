'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { buttonVariants, Button } from '@/components/ui/button';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { ICompany } from '@/models/employee';
import { getCompanies, deleteCompany } from '@/service/companyService';
import { normalizeImagePath } from '@/lib/norm';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCompanies = async () => {
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch {
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const onConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await deleteCompany(deleteId);
      toast.success('Company deleted successfully');
      fetchCompanies();
    } catch {
      toast.error('Failed to delete company');
    } finally {
      setIsDeleting(false);
      setIsModalOpen(false);
      setDeleteId(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-sm text-gray-500">Loading companies...</div>;
  if (error) return <div className='p-8 text-center text-red-500'>Error: {error}</div>;

  return (
    <div className='p-4 md:p-6 heavy-duty-container w-full'>
      {/* Delete Confirmation Modal */}
      <AlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={onConfirmDelete}
        loading={isDeleting}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Companies</h1>
          <p className="text-sm text-muted-foreground">Manage your company profiles and details.</p>
        </div>
        <PermissionGuard requiredPermission={PERMISSIONS.COMPANY.CREATE.name}>
          <Link
            href='/dashboard/Company/new'
            className={cn(buttonVariants(), 'text-xs md:text-sm shrink-0 bg-amber-800 hover:bg-amber-900 text-white')}
          >
            <IconPlus className='mr-2 h-4 w-4' />
            Add New Company
          </Link>
        </PermissionGuard>
      </div>

      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl bg-gray-50/50 w-full">
          <p className='text-sm text-gray-500 mb-4'>
            No company information available.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 w-full gap-6">
          {companies.map((company) => (
            <Card key={company.id} className="relative flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground hover:shadow-lg transition-all duration-300 w-full">
              
              {/* Top Banner Accent - Full Width Layout Color */}
              <div className="h-32 w-full bg-linear-to-r from-amber-700 to-amber-900 relative">
                {/* Float Action Controls to the top right of the banner */}
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-black/20 p-1 backdrop-blur-sm z-10">
                  <PermissionGuard requiredPermission={PERMISSIONS.COMPANY.UPDATE.name}>
                    <Link
                      href={`/dashboard/Company/${company.id}`}
                      className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-7 w-7 text-white hover:text-white hover:bg-white/20')}
                    >
                      <IconEdit className='h-4 w-4' />
                    </Link>
                  </PermissionGuard>
                  <PermissionGuard requiredPermission={PERMISSIONS.COMPANY.DELETE.name}>
                    <Button
                      variant='ghost'
                      size='icon'
                      className="h-7 w-7 text-white hover:text-red-200 hover:bg-red-500/30"
                      onClick={() => {
                        setDeleteId(company.id!);
                        setIsModalOpen(true);
                      }}
                    >
                      <IconTrash className='h-4 w-4' />
                    </Button>
                  </PermissionGuard>
                </div>
              </div>

              {/* Centered Profile Picture Container */}
              <div className="flex justify-center -mt-12 mb-3 relative z-10">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  {company.logo ? (
                    <AvatarImage
                      src={normalizeImagePath(company.logo as string)}
                      alt={company.name}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-amber-100 text-amber-800 text-xl font-bold">
                      {company.name?.[0] || 'C'}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>

              {/* Card Title Content */}
              <div className="px-6 text-center">
                <CardTitle className="text-xl font-extrabold text-gray-900 tracking-tight line-clamp-1" title={company.name}>
                  {company.name}
                </CardTitle>
                {company.email && (
                  <span className="text-xs font-medium text-muted-foreground block mt-1 truncate" title={company.email}>
                    {company.email}
                  </span>
                )}
              </div>

              {/* Grid System for Analytics Metrics - Spans across wide view
              <div className="grid grid-cols-3 border-y border-gray-100 my-5 py-3 text-center bg-gray-50/50 w-full">
                <div>
                  <span className="block text-base font-bold text-gray-800">17</span>
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Posts</span>
                </div>
                <div className="border-x border-gray-100">
                  <span className="block text-base font-bold text-gray-800">9.7k</span>
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Followers</span>
                </div>
                <div>
                  <span className="block text-base font-bold text-gray-800">274</span>
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Following</span>
                </div>
              </div> */}

              {/* Body Content - Metadata Details */}
              <CardContent className="px-6 pb-6 flex-1 flex flex-col justify-between space-y-4 w-full">
                {company.description && (
                  <p className="text-sm text-gray-500 text-center line-clamp-2 max-w-3xl mx-auto" title={company.description}>
                    {company.description}
                  </p>
                )}

                <div className="space-y-3 pt-2 text-xs border-t border-gray-50 w-full">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left">
                    {company.phone && (
                      <div>
                        <span className="block font-semibold text-gray-400 uppercase text-[10px]">Phone</span>
                        <span className="text-gray-700 truncate block mt-0.5">{company.phone}</span>
                      </div>
                    )}
                    {company.tiktok && (
                      <div>
                        <span className="block font-semibold text-gray-400 uppercase text-[10px]">TikTok</span>
                        <span className="text-gray-700 truncate block mt-0.5">{company.tiktok}</span>
                      </div>
                    )}
                    {company.TIN && (
                      <div>
                        <span className="block font-semibold text-gray-400 uppercase text-[10px]">TIN</span>
                        <span className="text-gray-700 truncate block mt-0.5">{company.TIN}</span>
                      </div>
                    )}
                    {company.From && (
                      <div>
                        <span className="block font-semibold text-gray-400 uppercase text-[10px]">From</span>
                        <span className="text-gray-700 truncate block mt-0.5">{company.From}</span>
                      </div>
                    )}
                  </div>

                  {(company.address  || company.addressTow || company.tinAddress) && (
                    <div className="space-y-2 pt-3 border-t border-gray-100/70 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                      {company.address && (
                        <div>
                          <span className="block font-semibold text-gray-400 uppercase text-[10px]">Address</span>
                          <p className="text-gray-600 truncate mt-0.5" title={company.address}>{company.address}</p>
                        </div>
                      )}
                      {company.tinAddress && (
                        <div>
                          <span className="block font-semibold text-gray-400 uppercase text-[10px]">TIN Address</span>
                          <p className="text-gray-600 truncate mt-0.5" title={company.tinAddress}>{company.tinAddress}</p>
                        </div>
                      )}
                      {( company.addressTow) && (
                        <div className="md:col-span-2">
                          <p className="text-gray-500 truncate italic" title={ company.addressTow}>
                            { company.addressTow}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>

            </Card>
          ))}
        </div>
      )}
    </div>
  );
}