/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IBank {
  id: string;
  bankName: string;
  accountNumber: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  purchases?: any[]; // You can create a proper IPurchase interface later
}