
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { useData } from './hooks/useData';
import AuthGuard from './components/AuthGuard';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Categories from './pages/Categories';
import Recurring from './pages/Recurring';
import Reports from './pages/Reports';
import CalendarPage from './pages/CalendarPage';
import PocketsPage from './pages/Pockets';

function AppContent() {
  useData(); // Load data from Supabase
  
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/recurring" element={<Recurring />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/pockets" element={<PocketsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthGuard>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </AuthGuard>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;