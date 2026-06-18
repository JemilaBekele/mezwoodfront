import { IShowroom } from "@/models/showroom";
import { IStore } from "@/models/store";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status?: string;
  roleType?: string;
  role?: string;
  permissions: string[]; 
  showrooms?: IShowroom[];
  stores?: IStore[];
  lastLoginAt?: string;
};

export type BackendRole =
  | string
  | {
      id?: string;
      name?: string;
      description?: string;
    }
  | null;

export type BackendAuthUser = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  roleType?: string;
  role?: BackendRole;
  permissions?: string[];
  showrooms?: IShowroom[];
  stores?: IStore[];
  lastLoginAt?: string;
};
