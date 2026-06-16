import { ICategory, IColour } from './Category';

import { IUnitOfMeasure } from './UnitOfMeasure';


export interface IProduct {
  id: string;
  imageUrl?: string;

  productCode: string;
  generic?: string;
  name: string;
  description?: string;
  unitOfMeasureId: string; // foreign key
  unitOfMeasure?: IUnitOfMeasure;
  unit: string;

  sellPrice: number;

  categoryId: string;
  colourId?: string;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: ICategory;
  colour?: IColour;
  // Added overallTotals property
}



