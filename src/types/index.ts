export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: Date;
  type: 'income' | 'expense';
  recurring?: boolean;
  recurringId?: string;
  pocketId?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

export interface Budget {
  id: string;
  categoryId: string;
  limit: number;
  spent: number;
  period: 'monthly' | 'weekly';
  category: Category;
}

export interface RecurringTransaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: Date;
  isActive: boolean;
}

export interface Pocket {
  id: string;
  name: string;
  balance: number;
  icon?: string;
  color?: string;
  is_default?: boolean;
}