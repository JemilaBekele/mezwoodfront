export interface IUnitOfMeasure {
  id: string;
  name: string;
  symbol?: string;
  base: boolean;
  createdAt?: string; // optional if you add timestamps later
  updatedAt?: string;
}
