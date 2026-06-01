import { IEmployee } from "./employee";

export interface IExpense {
  id: string;

  title: string;
  description?: string;

  amount: number;

  expenseDate: string | Date;

  createdById?: string;
  createdBy?: IEmployee;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}
