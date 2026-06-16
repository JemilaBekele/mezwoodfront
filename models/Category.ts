/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ICategory {
  id: string; // UUID string
  name: string;

  products?: any[]; // Replace 'any' with IProduct[] if you have a Product model

  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface IColour {
  id: string; // UUID string
  name: string;

  products?: any[]; // Replace 'any' with IProduct[] if you have a Product model

  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

