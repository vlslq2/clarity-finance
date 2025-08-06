import { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useToastContext } from '../context/ToastContext';
import { api } from '../lib/supabase';
import { Transaction, Budget, RecurringTransaction, Pocket, Category } from '../types';

// Custom hook for fetching and managing application data
export function useData() {
  const { dispatch } = useApp();
  const toast = useToastContext();
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch data sequentially to ensure the app is robust
      // A failure in one area should not prevent others from loading.

      const categories = await api.categories.getAll();
      dispatch({ type: 'SET_CATEGORIES', payload: categories as Category[] });

      const transactions = await api.transactions.getAll();
      const formattedTransactions = (transactions as any[]).map((t) => ({
        ...t,
        date: new Date(t.date),
        category: t.category_id,
        pocketId: t.pocket_id
      }));
      dispatch({ type: 'SET_TRANSACTIONS', payload: formattedTransactions as Transaction[] });

      const budgetSummaries = await api.budgets.getSummaries();
      const formattedBudgets = (budgetSummaries as any[]).map((b) => ({
        id: b.id,
        categoryId: b.category_id,
        limit: parseFloat(b.amount),
        spent: b.spent_amount,
        period: b.period,
        category: {
          id: b.category_id,
          name: b.category_name,
          icon: b.category_icon,
          color: b.category_color,
          type: b.category_type
        }
      }));
      dispatch({ type: 'SET_BUDGETS', payload: formattedBudgets as Budget[] });

      const recurring = await api.recurring.getAll();
      const formattedRecurring = (recurring as any[]).map((r) => ({
        ...r,
        nextDate: new Date(r.next_date),
        category: r.category_id,
        isActive: r.is_active
      }));
      dispatch({ type: 'SET_RECURRING', payload: formattedRecurring as RecurringTransaction[] });

      const pockets = await api.pockets.getAll();
      dispatch({ type: 'SET_POCKETS', payload: pockets as Pocket[] });

    } catch (error: any) {
      toast.error('A apărut o eroare la încărcarea datelor', error.message);
    } finally {
      setLoading(false);
    }
  }, [dispatch, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { loading, refreshData: loadData };
}