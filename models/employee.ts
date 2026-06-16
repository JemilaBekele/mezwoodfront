import { IRole } from '@/service/roleService';
import { IStore } from './store';
import { IShowroom } from './showroom';

export interface IEmployee {
  id?: string; // UUID
  name: string;
  phone?: string;
  userCode?: string;
  email: string;
  password: string;

  roleId: string;
  role?: IRole;
  status: 'Active' | 'Inactive' | 'Suspended';
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
  lastLoginAt?: string;
  shopIds?: string[]; // for assigning shops
  storeIds?: string[]; 
    storeId?: string;

  // Showroom Assignment
  showroomId?: string;

  store?: IStore; // for assigning stores

  showroom?: IShowroom; // for assigning showrooms
 
}
export interface Imployee {
  id: string; // UUID
  name: string;
  phone?: string;
  userCode?: string;
  email: string;
  password: string;
  roleId: string;
  role?: IRole;
  status: 'Active' | 'Inactive' | 'Suspended';
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
  lastLoginAt?: string;
   // Optional populated relations
     // Store Assignment
  storeId?: string;

  // Showroom Assignment
  showroomId?: string;

  store?: {
    id: string;
    name: string;
  };

  showroom?: {
    id: string;
    name: string;
  };
// ISO date string
}

export interface Iupdate {
  id?: string;
  name: string;
  email: string;
  role:
    | 'Resident'
    | 'Owner'
    | 'Renter'
    | 'ShopOwner'
    | 'Maintenance'
    | 'Accountant'
    | 'Admin'
    | 'None';
  phone: string;
  status: 'Active' | 'Inactive' | 'Suspended'; // Extended status options
  confirm?: boolean; // Optional confirm field added
}
export interface ITenant {
  id?: string; // Corresponds to _id from MongoDB
  name: string;
  email: string;
  password: string;
  role: 'Owner' | 'Renter' | 'None';
  phone?: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  createdAt?: string;
  updatedAt?: string;
}

export interface ICompany {
  id?: string;

  name: string;
  email?: string;
  phone?: string;

  address?: string;
  addressTow?: string;
  tiktok?: string;
  logo?: string | File;


  
  description?: string;

  tinAddress?: string;
  TIN?: string;
  From?: string;




  // Timestamps
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
