export interface IProductCategory {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IProductType {
  id: string;
  name: string;

  sizeId: string;        // 👈 now required
  size?: ISize;          // 👈 optional populated relation

  createdAt?: string;
  updatedAt?: string;
}

export interface ISize {
  id: string;
  name: string;

  categoryId: string;    // 👈 required now
  category?: IProductCategory; // 👈 optional populated relation

  types?: IProductType[]; // 👈 for nested fetching

  createdAt?: string;
  updatedAt?: string;
}