import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToastContext } from '../../context/ToastContext';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import { X, DollarSign } from 'lucide-react';
import { api } from '../../lib/supabase';
import { t } from '../../i18n';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: any;
}

export default function TransactionForm({ isOpen, onClose, editingTransaction }: TransactionFormProps) {
  const { state, dispatch } = useApp();
  const { categories } = state;
  const toast = useToastContext();
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when editingTransaction changes
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        amount: editingTransaction.amount.toString(),
        description: editingTransaction.description,
        category_id: editingTransaction.category,
        type: editingTransaction.type,
        date: editingTransaction.date.toISOString().split('T')[0]
      });
    } else {
      setFormData({
        amount: '',
        description: '',
        category_id: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setErrors({});
  }, [editingTransaction, isOpen]);

  const filteredCategories = categories.filter(c => c.type === formData.type);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Suma trebuie să fie mai mare de 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrierea este obligatorie';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Categoria este obligatorie';
    }

    if (!formData.date) {
      newErrors.date = 'Data este obligatorie';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Corectează erorile de mai jos');
      return;
    }

    setLoading(true);

    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: formData.date
      };

      if (editingTransaction) {
        const updatedTransaction = await api.transactions.update({
          ...transactionData,
          id: editingTransaction.id
        });
        dispatch({ type: 'UPDATE_TRANSACTION', payload: {
          ...updatedTransaction,
          date: new Date(updatedTransaction.date),
          category: updatedTransaction.category_id
        }});
        toast.success('Tranzacția a fost actualizată cu succes');
      } else {
        const newTransaction = await api.transactions.create(transactionData);
        dispatch({ type: 'ADD_TRANSACTION', payload: {
          ...newTransaction,
          date: new Date(newTransaction.date),
          category: newTransaction.category_id
        }});
        toast.success('Tranzacția a fost adăugată cu succes');
      }

      onClose();
    } catch (err: any) {
      console.error('Transaction error:', err);
      toast.error('Nu s-a putut salva tranzacția', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold">
            {editingTransaction ? 'Editează tranzacția' : 'Adaugă tranzacție'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipul tranzacției
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'expense', category_id: '' })}
                disabled={loading}
                className={`p-4 rounded-xl border-2 transition-colors ${
                  formData.type === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">💸</div>
                  <div className="font-medium">Cheltuială</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'income', category_id: '' })}
                disabled={loading}
                className={`p-4 rounded-xl border-2 transition-colors ${
                  formData.type === 'income'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">💰</div>
                  <div className="font-medium">Venit</div>
                </div>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Suma
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                disabled={loading}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                  errors.amount ? 'border-red-300' : 'border-gray-200'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="text-red-600 text-sm mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descrierea
            </label>
            <input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-200'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="Pentru ce a fost aceasta?"
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              id="category"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              disabled={loading}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                errors.category_id ? 'border-red-300' : 'border-gray-200'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="">Selectează o categorie</option>
              {filteredCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="text-red-600 text-sm mt-1">{errors.category_id}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Data
            </label>
            <input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              disabled={loading}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                errors.date ? 'border-red-300' : 'border-gray-200'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {errors.date && (
              <p className="text-red-600 text-sm mt-1">{errors.date}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              fullWidth
            >
              Anulează
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              fullWidth
            >
              {loading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              {editingTransaction ? t('common.update') : t('common.add')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}