'use client';

import { useEffect, useState } from 'react';
import { getUserById, changePassword, updateUserById } from '@/service/user';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Eye, 
  EyeOff, 
  Edit, 
  Store, 
  LogOut, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { Imployee } from '@/models/employee';
import { logout } from '@/service/authApi';
import { IShowroom } from '@/models/showroom';
import { IStore } from '@/models/store';

interface showroom {
  id: string;
  name: string;
}

interface Store {
  id: string;
  name: string;
}

export default function ProfileViewPage() {
  const authUser = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state._hydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const [profile, setProfile] = useState<Imployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Profile update states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileError, setProfileError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!hydrated || !isAuthenticated || !authUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getUserById();
        
        // Initialize form fields with current data
        setProfile(data);
        setName(data.name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        
        toast.success('Profile loaded successfully');
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast.error('Failed to load profile data');
        
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    if (hydrated && isAuthenticated) {
      fetchProfile();
    } else if (hydrated && !isAuthenticated) {
      setLoading(false);
      setProfile(null);
    }
  }, [authUser, hydrated, isAuthenticated]);

  const handleLogout = async () => {
    try {
      toast.success('Logged out successfully');
      logout();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }

    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setIsPasswordModalOpen(false);
      resetPasswordForm();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to change password';
      toast.error(errorMessage);
    }
  };

  const handleProfileUpdate = async () => {
    if (!name.trim()) {
      setProfileError('Name is required');
      return;
    }

    if (!email.trim()) {
      setProfileError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setProfileError('Please enter a valid email address');
      return;
    }

    if (!profile) {
      toast.error('Profile data not found');
      return;
    }

    setUpdating(true);
    try {
      // Remove password field from update data
      const updatedData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined
      };

      await updateUserById(profile.id, updatedData);

      // Update local profile state
      setProfile({
        ...profile,
        ...updatedData
      });

      if (authUser) {
        setAuthUser({
          ...authUser,
          name: updatedData.name,
          email: updatedData.email,
          phone: updatedData.phone,
        });
      }

      toast.success('Profile updated successfully');
      setIsProfileModalOpen(false);
      setProfileError('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const resetProfileForm = () => {
    setName(profile?.name || '');
    setEmail(profile?.email || '');
    setPhone(profile?.phone || '');
    setProfileError('');
  };

  const handlePasswordModalClose = () => {
    setIsPasswordModalOpen(false);
    resetPasswordForm();
  };

  const handleProfileModalClose = () => {
    setIsProfileModalOpen(false);
    resetProfileForm();
  };

  const openProfileModal = () => {
    resetProfileForm();
    setIsProfileModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'Suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="h-4 w-4" />;
      case 'Inactive':
        return <XCircle className="h-4 w-4" />;
      case 'Suspended':
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Handle auth loading state
  if (!hydrated) {
    return (
      <div className='flex h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
        <div className='text-center'>
          <div className='mb-4 inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='text-lg font-semibold text-gray-600 dark:text-gray-300'>
            Checking authentication...
          </p>
          <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
            Please wait while we verify your session
          </p>
        </div>
      </div>
    );
  }

  // Handle unauthenticated state
  if (!isAuthenticated || !authUser) {
    return (
      <div className='flex h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
        <div className='max-w-md rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-gray-800'>
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-blue-100 p-4 dark:bg-blue-900/20">
              <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 className='mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-300'>
            Authentication Required
          </h2>
          <p className='mb-6 text-gray-600 dark:text-gray-400'>
            Please sign in to access your profile.
          </p>
          <Button
            onClick={() => (window.location.href = '/login')}
            className='w-full'
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Handle loading state with better UX
  if (loading) {
    return (
      <div className='flex h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
        <div className='text-center'>
          <div className='mb-4 inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='text-lg font-semibold text-gray-600 dark:text-gray-300'>
            Loading your profile...
          </p>
          <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
            Fetching your information
          </p>
        </div>
      </div>
    );
  }

  // Handle case when profile data is not available
  if (!profile) {
    return (
      <div className='flex h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
        <div className='max-w-md rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-gray-800'>
          <div className='mb-6 text-center'>
            <div className="inline-block rounded-full bg-red-100 p-4 dark:bg-red-900/20">
              <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className='space-y-3'>
            <Button
              onClick={async () => {
                setLoading(true);
                window.location.reload();
              }}
              className='w-full'
              variant='default'
            >
              Reload
            </Button>
            <Button
              onClick={handleLogout}
              className='w-full'
              variant='outline'
            >
              <LogOut className='mr-2 h-4 w-4' />
              Sign Out & Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Get store and showroom data from profile (plural)
  const stores = profile.stores as IStore[] | undefined;
  const showrooms = profile.showrooms as IShowroom[] | undefined;

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 dark:from-gray-900 dark:to-gray-800'>
      <div className='mx-auto max-w-5xl'>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Manage your personal information and account settings
          </p>
        </div>

        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Profile Card - Left Column */}
          <div className="lg:col-span-1">
            <div className='overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-gray-800'>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-4xl font-bold text-white">
                      {profile.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-green-500 p-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-green-400"></div>
                    </div>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-white">{profile.name}</h2>
                  <p className="text-sm text-blue-100">{profile.role?.name || 'User'}</p>
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(profile.status)}`}>
                      {getStatusIcon(profile.status)}
                      {profile.status || 'Active'}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-blue-100">
                    User Code: {profile.userCode || ''}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 p-6 dark:border-gray-700">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{profile.email}</p>
                    </div>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                        <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{profile.phone}</p>
                      </div>
                    </div>
                  )}
                  {profile.lastLoginAt && (
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Last Login</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {new Date(profile.lastLoginAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={openProfileModal}
                variant="default"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
              <Button
                onClick={() => setIsPasswordModalOpen(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Change Password
              </Button>
            </div>

            {/* Assigned Stores Section */}
            {stores && stores.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
                <div className="mb-4 flex items-center gap-2">
                  <Store className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Assigned Stores ({stores.length})
                  </h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {stores.map((store) => (
                    <div
                      key={store.id}
                      className="rounded-xl border border-green-100 bg-green-50/50 p-4 transition-all hover:shadow-md dark:border-green-900/50 dark:bg-green-900/10"
                    >
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {store.name}
                      </p>
                      {store.isMain && (
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-green-200 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          Main Store
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assigned Showrooms Section */}
            {showrooms && showrooms.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
                <div className="mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Assigned Showrooms ({showrooms.length})
                  </h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {showrooms.map((showroom) => (
                    <div
                      key={showroom.id}
                      className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 transition-all hover:shadow-md dark:border-blue-900/50 dark:bg-blue-900/10"
                    >
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {showroom.name}
                      </p>
                      {showroom.isMain && (
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-400">
                          <CheckCircle className="h-3 w-3" />
                          Main Showroom
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className='rounded-2xl bg-white sm:max-w-md dark:bg-gray-800'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-semibold text-gray-900 dark:text-gray-100'>
              Change Password
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label
                htmlFor='currentPassword'
                className='font-medium text-gray-500 dark:text-gray-400'
              >
                Current Password
              </Label>
              <div className='relative'>
                <Input
                  id='currentPassword'
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className='border-gray-200 pr-10 focus:ring-2 focus:ring-blue-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100'
                  placeholder='Enter current password'
                />
                <button
                  type='button'
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className='absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                >
                  {showCurrentPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            <div className='space-y-2'>
              <Label
                htmlFor='newPassword'
                className='font-medium text-gray-500 dark:text-gray-400'
              >
                New Password
              </Label>
              <div className='relative'>
                <Input
                  id='newPassword'
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className='border-gray-200 pr-10 focus:ring-2 focus:ring-blue-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100'
                  placeholder='Enter new password'
                />
                <button
                  type='button'
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className='absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className='space-y-2'>
              <Label
                htmlFor='confirmPassword'
                className='font-medium text-gray-500 dark:text-gray-400'
              >
                Confirm New Password
              </Label>
              <div className='relative'>
                <Input
                  id='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className='border-gray-200 pr-10 focus:ring-2 focus:ring-blue-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100'
                  placeholder='Confirm new password'
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {passwordError && (
              <p className='rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400'>
                {passwordError}
              </p>
            )}
          </div>
          <DialogFooter className='flex gap-2 sm:gap-0'>
            <Button
              variant='outline'
              onClick={handlePasswordModalClose}
              className='flex-1 sm:flex-none'
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={!currentPassword || !newPassword || !confirmPassword}
              className='flex-1 sm:flex-none'
            >
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Update Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className='rounded-2xl bg-white sm:max-w-md dark:bg-gray-800'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-semibold text-gray-900 dark:text-gray-100'>
              Edit Profile
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label
                htmlFor='name'
                className='font-medium text-gray-500 dark:text-gray-400'
              >
                Name *
              </Label>
              <Input
                id='name'
                type='text'
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setProfileError('');
                }}
                className='border-gray-200 focus:ring-2 focus:ring-blue-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100'
                placeholder='Enter your name'
              />
            </div>

            <div className='space-y-2'>
              <Label
                htmlFor='email'
                className='font-medium text-gray-500 dark:text-gray-400'
              >
                Email *
              </Label>
              <Input
                id='email'
                type='email'
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setProfileError('');
                }}
                className='border-gray-200 focus:ring-2 focus:ring-blue-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100'
                placeholder='Enter your email'
              />
            </div>

            <div className='space-y-2'>
              <Label
                htmlFor='phone'
                className='font-medium text-gray-500 dark:text-gray-400'
              >
                Phone
              </Label>
              <Input
                id='phone'
                type='tel'
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setProfileError('');
                }}
                className='border-gray-200 focus:ring-2 focus:ring-blue-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100'
                placeholder='Enter your phone number'
              />
            </div>


            {profileError && (
              <p className='rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400'>
                {profileError}
              </p>
            )}
          </div>
          <DialogFooter className='flex gap-2 sm:gap-0'>
            <Button
              variant='outline'
              onClick={handleProfileModalClose}
              className='flex-1 sm:flex-none'
            >
              Cancel
            </Button>
            <Button
              onClick={handleProfileUpdate}
              disabled={updating || !name.trim() || !email.trim()}
              className='flex-1 sm:flex-none'
            >
              {updating ? 'Updating...' : 'Update Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}