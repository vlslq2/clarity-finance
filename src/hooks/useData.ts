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
      console.log("--- Starting data load ---");

      console.log("Fetching categories...");
      const categories = await api.categories.getAll();
      console.log("Fetched categories:", categories);
      dispatch({ type: 'SET_CATEGORIES', payload: categories as Category[] });

      console.log("Fetching transactions...");
      const transactions = await api.transactions.getAll();
      console.log("Fetched transactions:", transactions);
      const formattedTransactions = (transactions as any[]).map((t) => ({
        ...t,
        date: new Date(t.date),
        category: t.category_id,
        pocketId: t.pocket_id
      }));
      dispatch({ type: 'SET_TRANSACTIONS', payload: formattedTransactions as Transaction[] });

      console.log("Fetching budget summaries...");
      const budgetSummaries = await api.budgets.getSummaries();
      console.log("Fetched budget summaries:", budgetSummaries);
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

      console.log("Fetching recurring transactions...");
      const recurring = await api.recurring.getAll();
      console.log("Fetched recurring transactions:", recurring);
      const formattedRecurring = (recurring as any[]).map((r) => ({
        ...r,
        nextDate: new Date(r.next_date),
        category: r.category_id,
        isActive: r.is_active
      }));
      dispatch({ type: 'SET_RECURRING', payload: formattedRecurring as RecurringTransaction[] });

      console.log("Fetching pockets...");
      const pockets = await api.pockets.getAll();
      console.log("Fetched pockets:", pockets);
      const formattedPockets = (pockets as any[]).map((p) => ({
        ...p,
        id: String(p.id)
      }));
      console.log("Formatted pockets:", formattedPockets);
      dispatch({ type: 'SET_POCKETS', payload: formattedPockets as Pocket[] });
      
      console.log("--- Data load complete ---");

    } catch (error: any) {
      console.error('--- FULL ERROR DURING DATA LOAD ---', error);
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