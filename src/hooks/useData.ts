import { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useToastContext } from '../context/ToastContext';
import { api } from '../lib/supabase';
import { Transaction, Budget, RecurringTransaction, Pocket, Category } from '../types';

export function useData() {
  const { dispatch } = useApp();
  const toast = useToastContext();
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel for better performance
      const [categories, transactions, budgetSummaries, recurring, pockets] = await Promise.all([
        api.categories.getAll(),
        api.transactions.getAll(),
        api.budgets.getSummaries(), // Use the correct endpoint for summaries
        api.recurring.getAll(),
        api.pockets.getAll()
      ]);

      // Process and dispatch categories
      dispatch({ type: 'SET_CATEGORIES', payload: categories as Category[] });

      // Process and dispatch transactions
      const formattedTransactions = (transactions as any[]).map((t) => ({
        ...t,
        date: new Date(t.date),
        category: t.category_id,
        pocketId: t.pocket_id
      }));
      dispatch({ type: 'SET_TRANSACTIONS', payload: formattedTransactions as Transaction[] });

      // Process and dispatch budgets using data from summaries
      const formattedBudgets = (budgetSummaries as any[]).map((b) => ({
        id: b.id,
        categoryId: b.category_id,
        limit: parseFloat(b.amount),
        spent: b.spent_amount, // Use the backend-calculated spent amount
        period: b.period,
        category: b.categories // Pass along nested category info
      }));
      dispatch({ type: 'SET_BUDGETS', payload: formattedBudgets as Budget[] });

      // Process and dispatch recurring transactions
      const formattedRecurring = (recurring as any[]).map((r) => ({
        ...r,
        nextDate: new Date(r.next_date),
        category: r.category_id,
        isActive: r.is_active
      }));
      dispatch({ type: 'SET_RECURRING', payload: formattedRecurring as RecurringTransaction[] });

      // Process and dispatch pockets
      dispatch({ type: 'SET_POCKETS', payload: pockets as Pocket[] });

    } catch (error: any) {
      
      toast.error('Nu s-au putut încărca datele', 'Verifică conexiunea și încearcă din nou');
    } finally {
      setLoading(false);
    }
  }, [dispatch, toast]);

  useEffect(() => {
    loadData();
    // This effect runs once on mount, ensuring data is fresh on initial load.
    // For subsequent refreshes, we can implement a pull-to-refresh or a manual refresh button.
  }, [loadData]);

  return { loading, refreshData: loadData };
}