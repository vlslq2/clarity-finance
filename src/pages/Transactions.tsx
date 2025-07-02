import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToastContext } from '../context/ToastContext';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import FAB from '../components/FAB';
import TransactionForm from '../components/forms/TransactionForm';
import { Search, Filter, Plus, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../lib/supabase';
import { t } from '../i18n';
import { getCategoryEmoji } from '../utils/categoryIcons';

export default function Transactions() {
  const { state, dispatch } = useApp();
  const { transactions, categories } = state;
  const toast = useToastContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredTransactions = transactions.filter(t =>
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    categories.find(c => c.id === t.category)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm(t('transactions.deleteConfirm'))) {
      return;
    }

    setDeletingId(id);
    
    try {
      await api.transactions.delete(id);
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      toast.success(t('transactions.transactionDeleted'));
    } catch (error: any) {
      console.error('Failed to delete transaction:', error);
      toast.error(t('errors.failedToSave'), error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingTransaction(null);
  };

  return (
    <div className="md:ml-64">
      <Header 
        title={t('transactions.title')}
        action={
          <Button 
            onClick={() => setShowAddModal(true)}
            size="sm"
            className="hidden md:flex"
          >
            <Plus size={16} className="mr-1" />
            {t('common.add')}
          </Button>
        }
      />
      
      <div className="p-4 md:p-8">
        {/* Search and Filter */}
        <Card className="mb-6">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t('transactions.searchTransactions')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <Button variant="secondary" className="flex items-center">
              <Filter size={16} className="mr-2" />
              {t('common.filter')}
            </Button>
          </div>
        </Card>

        {/* Optimized Transactions List */}
        <div className="space-y-3">
          {filteredTransactions.map(transaction => {
            const category = categories.find(c => c.id === transaction.category);
            const isDeleting = deletingId === transaction.id;
            
            return (
              <Card key={transaction.id} padding="sm" className="transition-all duration-200 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    {/* Category Icon - Smaller and more compact */}
                    {category && (
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <span className="text-lg">
                          {getCategoryEmoji(category.icon)}
                        </span>
                      </div>
                    )}
                    
                    {/* Transaction Details - Optimized layout */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 truncate pr-2">{transaction.description}</h3>
                        <p className={`text-lg font-bold flex-shrink-0 ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{Math.abs(transaction.amount).toFixed(2)} RON
                        </p>
                      </div>
                      
                      {/* Category and Date - Compact single line */}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-gray-600 truncate">{category?.name}</span>
                        <span className="text-sm text-gray-500 flex-shrink-0 ml-2">
                          {format(transaction.date, 'dd MMM')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons - Compact */}
                  <div className="flex space-x-1 ml-3 flex-shrink-0">
                    <button
                      onClick={() => handleEditTransaction(transaction)}
                      disabled={isDeleting}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      disabled={isDeleting}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <div className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-red-500" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredTransactions.length === 0 && (
          <Card className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">{t('transactions.noTransactions')}</h3>
            <p className="text-gray-500 mb-6">{t('transactions.tryAdjusting')}</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={16} className="mr-2" />
              {t('transactions.addTransaction')}
            </Button>
          </Card>
        )}
      </div>

      <FAB onClick={() => setShowAddModal(true)} />
      
      <TransactionForm
        isOpen={showAddModal}
        onClose={handleCloseModal}
        editingTransaction={editingTransaction}
      />
    </div>
  );
}