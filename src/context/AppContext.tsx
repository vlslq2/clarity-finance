import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Transaction, Category, Budget, RecurringTransaction, Pocket } from '../types';


interface AppState {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  pockets: Pocket[];
}

type AppAction =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'ADD_BUDGET'; payload: Budget }
  | { type: 'UPDATE_BUDGET'; payload: Budget }
  | { type: 'DELETE_BUDGET'; payload: string }
  | { type: 'ADD_RECURRING'; payload: RecurringTransaction }
  | { type: 'UPDATE_RECURRING'; payload: RecurringTransaction }
  | { type: 'DELETE_RECURRING'; payload: string }
  | { type: 'ADD_POCKET'; payload: Pocket }
  | { type: 'UPDATE_POCKET'; payload: Pocket }
  | { type: 'DELETE_POCKET'; payload: string }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_BUDGETS'; payload: Budget[] }
  | { type: 'SET_RECURRING'; payload: RecurringTransaction[] }
  | { type: 'SET_POCKETS'; payload: Pocket[] };

const initialState: AppState = {
  transactions: [],
  categories: [],
  budgets: [],
  recurringTransactions: [],
  pockets: []
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TRANSACTIONS':
      return {
        ...state,
        transactions: action.payload
      };
    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload
      };
    case 'SET_BUDGETS':
      return {
        ...state,
        budgets: action.payload
      };
    case 'SET_RECURRING':
      return {
        ...state,
        recurringTransactions: action.payload
      };
    case 'SET_POCKETS':
      return {
        ...state,
        pockets: action.payload
      };
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions]
      };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t => 
          t.id === action.payload.id ? action.payload : t
        )
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload)
      };
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload]
      };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c => 
          c.id === action.payload.id ? action.payload : c
        )
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== action.payload)
      };
    case 'ADD_BUDGET':
      return {
        ...state,
        budgets: [...state.budgets, action.payload]
      };
    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map(b => 
          b.id === action.payload.id ? action.payload : b
        )
      };
    case 'DELETE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.filter(b => b.id !== action.payload)
      };
    case 'ADD_RECURRING':
      return {
        ...state,
        recurringTransactions: [...state.recurringTransactions, action.payload]
      };
    case 'UPDATE_RECURRING':
      return {
        ...state,
        recurringTransactions: state.recurringTransactions.map(r => 
          r.id === action.payload.id ? action.payload : r
        )
      };
    case 'DELETE_RECURRING':
      return {
        ...state,
        recurringTransactions: state.recurringTransactions.filter(r => r.id !== action.payload)
      };
    case 'ADD_POCKET':
      return {
        ...state,
        pockets: [...state.pockets, action.payload]
      };
    case 'UPDATE_POCKET':
      return {
        ...state,
        pockets: state.pockets.map(p => 
          p.id === action.payload.id ? action.payload : p
        )
      };
    case 'DELETE_POCKET':
      return {
        ...state,
        pockets: state.pockets.filter(p => p.id !== action.payload)
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}