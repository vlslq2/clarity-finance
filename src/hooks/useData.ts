import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToastContext } from '../context/ToastContext';
import { api } from '../lib/supabase';

export function useData() {
  const { dispatch } = useApp();
  const toast = useToastContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load categories first (needed for other data)
        const categories = await api.categories.getAll();
        dispatch({ type: 'SET_CATEGORIES', payload: categories });

        // Load transactions
        const transactions = await api.transactions.getAll();
        const formattedTransactions = transactions.map((t: any) => ({
          ...t,
          date: new Date(t.date),
          category: t.category_id
        }));
        dispatch({ type: 'SET_TRANSACTIONS', payload: formattedTransactions });

        // Load budgets with proper formatting
        const budgets = await api.budgets.getAll();
        const formattedBudgets = budgets.map((b: any) => {
          // Calculate spent amount from transactions
          const spent = formattedTransactions
            .filter((t: any) => t.category === b.category_id && t.type === 'expense')
            .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

          return {
            id: b.id,
            categoryId: b.category_id,
            limit: parseFloat(b.amount),
            spent: spent,
            period: b.period,
            start_date: b.start_date,
            is_active: b.is_active
          };
        });
        dispatch({ type: 'SET_BUDGETS', payload: formattedBudgets });

        // Load recurring transactions
        const recurring = await api.recurring.getAll();
        const formattedRecurring = recurring.map((r: any) => ({
          ...r,
          nextDate: new Date(r.next_date),
          category: r.category_id,
          isActive: r.is_active
        }));
        dispatch({ type: 'SET_RECURRING', payload: formattedRecurring });

      } catch (error: any) {
        console.error('Failed to load data:', error);
        toast.error('Nu s-au putut încărca datele', 'Verifică conexiunea și încearcă din nou');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dispatch, toast]);

  return { loading };
}