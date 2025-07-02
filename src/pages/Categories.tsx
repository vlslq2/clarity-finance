import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToastContext } from '../context/ToastContext';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import FAB from '../components/FAB';
import CategoryForm from '../components/forms/CategoryForm';
import { Plus, Edit2, Trash2, Grid3X3, AlertTriangle } from 'lucide-react';
import { api } from '../lib/supabase';
import { t } from '../i18n';
import { getCategoryEmoji } from '../utils/categoryIcons';

export default function Categories() {
  const { state, dispatch } = useApp();
  const { categories, transactions } = state;
  const toast = useToastContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForceDeleteModal, setShowForceDeleteModal] = useState<{
    categoryId: string;
    categoryName: string;
    usageCount: number;
  } | null>(null);

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const getCategoryUsage = (categoryId: string) => {
    return transactions.filter(t => t.category === categoryId).length;
  };

  const handleDeleteCategory = async (categoryId: string, force = false) => {
    const category = categories.find(c => c.id === categoryId);
    
    if (!force && !confirm(t('categories.deleteConfirm'))) {
      return;
    }

    setDeletingId(categoryId);
    
    try {
      const url = force 
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/categories?id=${categoryId}&force=true`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/categories?id=${categoryId}`;
      
      const { data: { session } } = await (window as any).supabase.auth.getSession();
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.canForceDelete) {
          setShowForceDeleteModal({
            categoryId,
            categoryName: category?.name || 'Unknown',
            usageCount: result.usageCount
          });
          setDeletingId(null);
          return;
        }
        throw new Error(result.error || 'Failed to delete category');
      }

      dispatch({ type: 'DELETE_CATEGORY', payload: categoryId });
      
      if (result.forceDeleted) {
        // Also remove related transactions, budgets, and recurring transactions from local state
        const relatedTransactions = transactions.filter(t => t.category === categoryId);
        relatedTransactions.forEach(t => {
          dispatch({ type: 'DELETE_TRANSACTION', payload: t.id });
        });
        
        toast.success('Categoria și toate datele asociate au fost șterse');
      } else {
        toast.success(t('categories.categoryDeleted'));
      }
      
      setShowForceDeleteModal(null);
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      toast.error(t('errors.failedToSave'), error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingCategory(null);
  };

  const CategorySection = ({ 
    title, 
    categories: sectionCategories, 
    emptyMessage 
  }: { 
    title: string; 
    categories: typeof categories; 
    emptyMessage: string; 
  }) => (
    <Card>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      {sectionCategories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sectionCategories.map(category => {
            const usage = getCategoryUsage(category.id);
            const isDeleting = deletingId === category.id;
            
            return (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center mr-3"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <span className="text-lg">
                      {getCategoryEmoji(category.icon)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{category.name}</h4>
                    <p className="text-sm text-gray-500">
                      {usage} {usage === 1 ? t('categories.transaction') : t('categories.transactions')}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEditCategory(category)}
                    disabled={isDeleting}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
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
            );
          })}
        </div>
      )}
    </Card>
  );

  return (
    <div className="md:ml-64">
      <Header 
        title={t('categories.title')}
        action={
          <Button 
            onClick={() => setShowAddModal(true)}
            size="sm"
            className="hidden md:flex"
          >
            <Plus size={16} className="mr-1" />
            {t('categories.addCategory')}
          </Button>
        }
      />
      
      <div className="p-4 md:p-8 space-y-6">
        {/* Category Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{incomeCategories.length}</p>
              <p className="text-sm text-gray-600">{t('categories.incomeCategories')}</p>
            </div>
          </Card>
          
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{expenseCategories.length}</p>
              <p className="text-sm text-gray-600">{t('categories.expenseCategories')}</p>
            </div>
          </Card>
        </div>

        {/* Income Categories */}
        <CategorySection
          title={t('categories.incomeCategories')}
          categories={incomeCategories}
          emptyMessage={t('categories.noIncomeCategories')}
        />

        {/* Expense Categories */}
        <CategorySection
          title={t('categories.expenseCategories')}
          categories={expenseCategories}
          emptyMessage={t('categories.noExpenseCategories')}
        />

        {categories.length === 0 && (
          <Card className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Grid3X3 size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">{t('categories.noCategories')}</h3>
            <p className="text-gray-500 mb-6">{t('categories.organizeTransactions')}</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={16} className="mr-2" />
              {t('categories.addCategory')}
            </Button>
          </Card>
        )}
      </div>

      <FAB onClick={() => setShowAddModal(true)} />
      
      <CategoryForm
        isOpen={showAddModal}
        onClose={handleCloseModal}
        editingCategory={editingCategory}
      />

      {/* Force Delete Confirmation Modal */}
      {showForceDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="text-red-500 mr-3" size={24} />
                <h3 className="text-lg font-semibold text-gray-900">Ștergere forțată</h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                Categoria "<strong>{showForceDeleteModal.categoryName}</strong>" este folosită în {showForceDeleteModal.usageCount} înregistrări.
              </p>
              
              <p className="text-gray-600 mb-6">
                Ștergerea acestei categorii va șterge și toate tranzacțiile, bugetele și tranzacțiile recurente asociate. Această acțiune nu poate fi anulată.
              </p>
              
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowForceDeleteModal(null)}
                  fullWidth
                >
                  Anulează
                </Button>
                <Button
                  onClick={() => handleDeleteCategory(showForceDeleteModal.categoryId, true)}
                  fullWidth
                  className="bg-red-600 hover:bg-red-700"
                >
                  Șterge totul
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}