import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToastContext } from '../context/ToastContext';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import FAB from '../components/FAB';
import BudgetForm from '../components/forms/BudgetForm';
import { Plus, Edit2, Trash2, Target } from 'lucide-react';
import { api } from '../lib/supabase';
import { getCategoryEmoji } from '../utils/categoryIcons';
import { Budget } from '../types';

export default function Budgets() {
  const { state, dispatch } = useApp();
  const { budgets } = state;
  const toast = useToastContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const budgetsWithProgress = budgets.map(budget => {
    const progress = (budget.spent / budget.limit) * 100;
    const isOverBudget = progress > 100;
    const isNearLimit = progress > 80 && progress <= 100;

    return {
      ...budget,
      progress,
      isOverBudget,
      isNearLimit
    };
  });

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setShowAddModal(true);
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest buget?')) {
      return;
    }

    setDeletingId(budgetId);
    
    try {
      await api.budgets.delete(budgetId);
      dispatch({ type: 'DELETE_BUDGET', payload: budgetId });
      toast.success('Bugetul a fost șters');
    } catch (error: any) {
      console.error('Failed to delete budget:', error);
      toast.error('Nu s-a putut șterge bugetul', error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingBudget(null);
  };

  const getStatusColor = (budget: any) => {
    if (budget.isOverBudget) return 'text-red-600';
    if (budget.isNearLimit) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (budget: any) => {
    if (budget.isOverBudget) return 'bg-red-500';
    if (budget.isNearLimit) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="md:ml-64">
      <Header 
        title="Bugete"
        action={
          <Button 
            onClick={() => setShowAddModal(true)}
            size="sm"
            className="hidden md:flex"
          >
            <Plus size={16} className="mr-1" />
            Adaugă buget
          </Button>
        }
      />
      
      <div className="p-4 md:p-8">
        {/* Budget List */}
        <div className="space-y-4">
          {budgetsWithProgress.map(budget => {
            if (!budget.category) return null;
            const isDeleting = deletingId === budget.id;
            
            return (
              <Card key={budget.id} padding="sm" className="transition-all duration-200 hover:shadow-md">
                <div className="flex items-center justify-between">
                  {/* Left side - Category info and progress */}
                  <div className="flex items-center flex-1 min-w-0">
                    {/* Category Icon */}
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 flex-shrink-0"
                      style={{ backgroundColor: `${budget.category.color}20` }}
                    >
                      <span className="text-xl">
                        {getCategoryEmoji(budget.category.icon)}
                      </span>
                    </div>
                    
                    {/* Category name and progress bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 truncate pr-2">
                          {budget.category.name}
                        </h3>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-lg font-bold ${getStatusColor(budget)}`}>
                            {budget.spent.toFixed(0)} / {budget.limit.toFixed(0)} RON
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(budget)}`}
                          style={{ width: `${Math.min(budget.progress, 100)}%` }}
                        />
                      </div>
                      
                      {/* Progress percentage */}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-gray-500 capitalize">
                          {budget.period}
                        </span>
                        <span className={`text-sm font-medium ${getStatusColor(budget)}`}>
                          {budget.progress.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side - Action buttons */}
                  <div className="flex space-x-1 ml-4 flex-shrink-0">
                    <button
                      onClick={() => handleEditBudget(budget)}
                      disabled={isDeleting}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(budget.id)}
                      disabled={isDeleting}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-500" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {budgets.length === 0 && (
          <Card className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Target size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Nu sunt bugete setate</h3>
            <p className="text-gray-500 mb-6">Creează bugete pentru a-ți urmări cheltuielile și a rămâne pe țintă</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={16} className="mr-2" />
              Creează buget
            </Button>
          </Card>
        )}
      </div>

      <FAB onClick={() => setShowAddModal(true)} />
      
      <BudgetForm
        isOpen={showAddModal}
        onClose={handleCloseModal}
        editingBudget={editingBudget}
      />
    </div>
  );
}