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
      const url = new URL(`${supabaseUrl}/functions/v1/transactions`)
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value)
        })
      }
      
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch transactions')
      return await response.json()
    },
    
    create: async (transaction: any) => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transaction)
      })
      
      if (!response.ok) throw new Error('Failed to create transaction')
      return await response.json()
    },
    
    update: async (transaction: any) => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/transactions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transaction)
      })
      
      if (!response.ok) throw new Error('Failed to update transaction')
      return await response.json()
    },
    
    delete: async (id: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/transactions?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to delete transaction')
      return await response.json()
    },
    
    getSummary: async (month?: string) => {
      const params = month ? { month } : {}
      const url = new URL(`${supabaseUrl}/functions/v1/transactions/summary`)
      if (params.month) url.searchParams.append('month', params.month)
      
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch transaction summary')
      return await response.json()
    }
  },
  
  // Categories
  categories: {
    getAll: async (type?: 'income' | 'expense') => {
      const url = new URL(`${supabaseUrl}/functions/v1/categories`)
      if (type) url.searchParams.append('type', type)
      
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch categories')
      return await response.json()
    },
    
    create: async (category: any) => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(category)
      })
      
      if (!response.ok) throw new Error('Failed to create category')
      return await response.json()
    },
    
    update: async (category: any) => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/categories`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(category)
      })
      
      if (!response.ok) throw new Error('Failed to update category')
      return await response.json()
    },
    
    delete: async (id: string, force = false) => {
      const { data: { session } } = await supabase.auth.getSession()
      const url = force 
        ? `${supabaseUrl}/functions/v1/categories?id=${id}&force=true`
        : `${supabaseUrl}/functions/v1/categories?id=${id}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (!response.ok) {
        const error = await response.json();
        throw error;
      }
      return await response.json()
    }
  },
  
  // Budgets
  budgets: {
    getAll: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/budgets`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch budgets')
      return await response.json()
    },
    
    getSummaries: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/budgets/summary`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch budget summaries')
      return await response.json()
    },
    
    create: async (budget: any) => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/budgets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(budget)
      })
      
      if (!response.ok) throw new Error('Failed to create budget')
      return await response.json()
    },
    
    update: async (budget: any) => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/budgets`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(budget)
      })
      
      if (!response.ok) throw new Error('Failed to update budget')
      return await response.json()
    },
    
    delete: async (id: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/budgets?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to delete budget')
      return await response.json()
    }
  },
  
  // Recurring Transactions
  recurring: {
    getAll: async (isActive?: boolean) => {
      const url = new URL(`${supabaseUrl}/functions/v1/recurring`)
      if (isActive !== undefined) url.searchParams.append('is_active', isActive.toString())
      
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch recurring transactions')
      return await response.json()
    },
    
    getUpcoming: async (days = 30) => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/recurring/upcoming?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch upcoming recurring transactions')
      return await response.json()
    },
    
    create: async (recurring: any) => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/recurring`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recurring)
      })
      
      if (!response.ok) throw new Error('Failed to create recurring transaction')
      return await response.json()
    },
    
    update: async (recurring: any) => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/recurring`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recurring)
      })
      
      if (!response.ok) throw new Error('Failed to update recurring transaction')
      return await response.json()
    },
    
    toggle: async (id: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/recurring/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      })
      
      if (!response.ok) throw new Error('Failed to toggle recurring transaction')
      return await response.json()
    },
    
    delete: async (id: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/recurring?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to delete recurring transaction')
      return await response.json()
    }
  },
  
  // Reports
  reports: {
    getSummary: async (startDate: string, endDate: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/reports/summary?start_date=${startDate}&end_date=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch report summary')
      return await response.json()
    },
    
    getTrends: async (startDate: string, endDate: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/reports/trends?start_date=${startDate}&end_date=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch trend report')
      return await response.json()
    },
    
    getCategories: async (startDate: string, endDate: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/reports/categories?start_date=${startDate}&end_date=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch category report')
      return await response.json()
    },
    
    getBudgets: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/reports/budgets`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch budget report')
      return await response.json()
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
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/user-preferences`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch user preferences')
      return await response.json()
    },
    
    update: async (preferences: any) => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${supabaseUrl}/functions/v1/user-preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      })
      
      if (!response.ok) throw new Error('Failed to update user preferences')
      return await response.json()
    }
  }
}