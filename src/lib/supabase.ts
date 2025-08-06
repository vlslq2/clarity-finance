import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Make supabase available globally for edge function calls
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password })
  },
  
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password })
  },
  
  signOut: async () => {
    return await supabase.auth.signOut()
  },
  
  getUser: async () => {
    return await supabase.auth.getUser()
  },
  
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// API helpers
export const api = {
  // Transactions
  transactions: {
    getAll: async (params?: Record<string, string>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      let query = supabase.from('transactions').select('*, categories(*)').eq('user_id', user.id);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    
    create: async (transaction: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.from('transactions').insert({ ...transaction, user_id: user.id }).select('*, categories(*)').single();
      if (error) throw error;
      return data;
    },
    
    update: async (transaction: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.from('transactions').update(transaction).eq('id', transaction.id).eq('user_id', user.id).select('*, categories(*)').single();
      if (error) throw error;
      return data;
    },
    
    delete: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return { success: true };
    },
    
    getSummary: async (month?: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.rpc('get_monthly_summary', { user_id: user.id, month_date: month });
      if (error) throw error;
      return data;
    }
  },
  
  // Categories
  categories: {
    getAll: async (type?: 'income' | 'expense') => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      let query = supabase.from('categories').select('*').eq('user_id', user.id);
      if (type) {
        query = query.eq('type', type);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    
    create: async (category: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.from('categories').insert({ ...category, user_id: user.id }).select('*').single();
      if (error) throw error;
      return data;
    },
    
    update: async (category: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.from('categories').update(category).eq('id', category.id).eq('user_id', user.id).select('*').single();
      if (error) throw error;
      return data;
    },
    
    delete: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return { success: true };
    }
  },
  
  // Budgets
  budgets: {
    getAll: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.from('budgets').select('*, categories(*)').eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    
    getSummaries: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.rpc('get_budget_summaries', { p_user_id: user.id });
      if (error) throw error;
      return data;
    },
    
    create: async (budget: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.from('budgets').insert({ ...budget, user_id: user.id }).select('*, categories(*)').single();
      if (error) throw error;
      return data;
    },
    
    update: async (budget: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.from('budgets').update(budget).eq('id', budget.id).eq('user_id', user.id).select('*, categories(*)').single();
      if (error) throw error;
      return data;
    },
    
    delete: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase.from('budgets').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return { success: true };
    }
  },
  
  // Recurring Transactions
  recurring: {
    getAll: async (isActive?: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      let query = supabase.from('recurring_transactions').select('*, categories(*)').eq('user_id', user.id);
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    
    getUpcoming: async (days = 30) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.rpc('get_upcoming_recurring', { p_user_id: user.id, days_ahead: days });
      if (error) throw error;
      return data;
    },
    
    create: async (recurring: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.from('recurring_transactions').insert({ ...recurring, user_id: user.id }).select('*, categories(*)').single();
      if (error) throw error;
      return data;
    },
    
    update: async (recurring: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.from('recurring_transactions').update(recurring).eq('id', recurring.id).eq('user_id', user.id).select('*, categories(*)').single();
      if (error) throw error;
      return data;
    },
    
    toggle: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.rpc('toggle_recurring_transaction', { p_recurring_id: id, p_user_id: user.id });
      if (error) throw error;
      return data;
    },
    
    delete: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase.from('recurring_transactions').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return { success: true };
    }
  },
  
  // Reports
  reports: {
    getSummary: async (startDate: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.rpc('get_monthly_summary', { user_id: user.id, month_date: startDate });
      if (error) throw error;
      return data;
    },
    
    getTrends: async (startDate: string, endDate: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.rpc('get_transaction_trends', { user_id: user.id, start_date: startDate, end_date: endDate });
      if (error) throw error;
      return data;
    },
    
    getCategories: async (startDate: string, endDate: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.rpc('get_category_spending', { user_id: user.id, start_date: startDate, end_date: endDate });
      if (error) throw error;
      return data;
    },
    
    getBudgets: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.rpc('get_budget_summaries', { p_user_id: user.id });
      if (error) throw error;
      return data;
    },
    
    export: async (startDate: string, endDate: string, format = 'csv') => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/reports/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ start_date: startDate, end_date: endDate, format })
      })
      
      if (!response.ok) throw new Error('Failed to export report')
      
      if (format === 'csv') {
        return await response.text()
      }
      return await response.json()
    }
  },
  
  // User Preferences
  preferences: {
    get: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).single();
      if (error) throw error;
      return data;
    },
    
    update: async (preferences: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.from('user_preferences').update(preferences).eq('user_id', user.id).select('*').single();
      if (error) throw error;
      return data;
    }
  },

  // Pockets
  pockets: {
    getAll: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.rpc('get_pockets', { p_user_id: user.id });
      if (error) throw error;
      return data;
    },
    
    create: async (pocket: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.from('pockets').insert({ ...pocket, user_id: user.id }).select('*').single();
      if (error) throw error;
      return data;
    },
    
    update: async (pocket: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.from('pockets').update(pocket).eq('id', pocket.id).eq('user_id', user.id).select('*').single();
      if (error) throw error;
      return data;
    },

    delete: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase.rpc('delete_pocket_and_reassign_transactions', { pocket_id_to_delete: id });
      if (error) throw error;
      return { success: true };
    },

    transfer: async (from_pocket_id: string, to_pocket_id: string, amount: number) => {
      const { error } = await supabase.rpc('transfer_between_pockets', { from_pocket_id, to_pocket_id, amount });
      if (error) throw error;
      return { success: true };
    }
  }
}