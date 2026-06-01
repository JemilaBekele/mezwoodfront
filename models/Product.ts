import { ICategory, IColour } from './Category';
import { ICurtainMeasurement, ICurtainType } from './curtainType';
import { IShop } from './shop';
import { IShopStock } from './store';
import { IUnitOfMeasure } from './UnitOfMeasure';

export interface IAdditionalPrice {
  id: string;
  label?: string;
  price: number;
  shopId: string;
  shop?: IShop;
  createdAt: string;
  updatedAt: string;
}
export interface IProduct {
  id: string;

  // Core Identity
  productCode: string;
  name: string;
  fabricName?: string;
  thickCurtain?: boolean;
  thinCurtain?: boolean;
  pullsCurtain?: boolean;
  poleCurtain?: boolean;
  bracketsCurtain?: boolean;
  shatterVertical?: boolean;

  description?: string;

  // Curtain-specific attributes

  // Pricing
  sellPrice?: number;
  pricePerMeter: boolean;
  warningQuantity?: number;

  // Media
  imageUrl?: string;

  // Category
  categoryId: string;
  category?: ICategory;

  // Colour
  colourId?: string;
  colour?: IColour;

  // Curtain Type
  curtainTypeId?: string;
  curtainType?: ICurtainType;

  // Unit of Measure
  unitOfMeasureId: string;
  unitOfMeasure?: IUnitOfMeasure;

  // Status
  isActive: boolean;

  // Curtain Measurements

  // Pricing Extensions
  additionalPrices?: IAdditionalPrice[];
  curtainMeasurements?: ICurtainMeasurement[];

  // Stock & Reporting (derived / API-level)
  stockSummary?: IStockSummary;
  overallTotals?: IOverallTotals;

  // System fields
  createdAt: string;
  updatedAt: string;
}

export interface IDimensionStock {
  height: number;
  width: number;
  quantity: number;
  area: number;
}

export interface IDimensionStockInfo {
  pieces: number;
  dimensions: IDimensionStock[];
  totalArea: number;
}

export interface IStockSummary {
  // Regular quantity-based stocks
  shopStocks: {
    [shopName: string]: {
      quantity: number;
      branchId?: string;
      branchName?: string;
    };
  };
  storeStocks: {
    [storeName: string]: {
      quantity: number;
      branchId?: string;
      branchName?: string;
    };
  };
  totalShopStock: number;
  totalStoreStock: number;
  totalStock: number;
  
  // Dimension-based stocks
  shopDimensionStocks: {
    [shopName: string]: IDimensionStockInfo;
  };
  storeDimensionStocks: {
    [storeName: string]: IDimensionStockInfo;
  };
  totalShopDimensionPieces: number;
  totalStoreDimensionPieces: number;
  totalDimensionPieces: number;
  totalShopDimensionArea: number;
  totalStoreDimensionArea: number;
  totalDimensionArea: number;
  
  // Combined totals
  totalAllItems: number;
  hasDimensionStock: boolean;
  hasQuantityStock: boolean;
}

export interface IOverallTotals {
  totalShopStock: number;
  totalStoreStock: number;
  totalAllStock: number;
  
  totalShopDimensionPieces: number;
  totalStoreDimensionPieces: number;
  totalAllDimensionPieces: number;
  
  totalShopDimensionArea: number;
  totalStoreDimensionArea: number;
  totalAllDimensionArea: number;
  
  shopTotals: Record<string, number>;
  storeTotals: Record<string, number>;
  shopDimensionTotals: Record<string, number>;
  storeDimensionTotals: Record<string, number>;
  shopDimensionAreaTotals: Record<string, number>;
  storeDimensionAreaTotals: Record<string, number>;
}

export interface IOverallTotals {
  totalShopStock: number;
  totalStoreStock: number;
  totalAllStock: number;
  shopTotals: { [shopName: string]: number };
  storeTotals: { [storeName: string]: number };
}
export interface IProductBatch {
  id: string;
  batchNumber: string;
  expiryDate?: string;
  productId: string;
  // ISO date string
  price?: number;
  stock?: number;
  warningQuantity?: number;
  availableQuantity?: number;
  storeId?: string;
  ShopStock: IShopStock[];
  createdAt: string;
  updatedAt: string;
  product?: IProduct;
}


