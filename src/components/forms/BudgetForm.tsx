import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Button from '../Button';
import { X, Target } from 'lucide-react';
import { api } from '../../lib/supabase';
import { t } from '../../i18n';

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingBudget?: any;
}

export default function BudgetForm({ isOpen, onClose, editingBudget }: BudgetFormProps) {
  const { state, dispatch } = useApp();
  const { categories } = state;
  
  const expenseCategories = categories.filter(c => c.type === 'expense');
  
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    period: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    is_active: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update form data when editingBudget changes
  useEffect(() => {
    if (editingBudget) {
      setFormData({
        category_id: editingBudget.categoryId,
        amount: editingBudget.limit.toString(),
        period: editingBudget.period,
        start_date: editingBudget.start_date || new Date().toISOString().split('T')[0],
        is_active: editingBudget.is_active !== undefined ? editingBudget.is_active : true
      });
    } else {
      setFormData({
        category_id: '',
        amount: '',
        period: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        is_active: true
      });
    }
    setError('');
  }, [editingBudget, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const budgetData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (editingBudget) {
        const updatedBudget = await api.budgets.update({
          ...budgetData,
          id: editingBudget.id
        });
        
        // Format the budget for local state
        const formattedBudget = {
          id: updatedBudget.id,
          categoryId: updatedBudget.category_id,
          limit: parseFloat(updatedBudget.amount),
          spent: editingBudget.spent || 0,
          period: updatedBudget.period,
          start_date: updatedBudget.start_date,
          is_active: updatedBudget.is_active
        };
        
        dispatch({ type: 'UPDATE_BUDGET', payload: formattedBudget });
      } else {
        const newBudget = await api.budgets.create(budgetData);
        
        // Format the budget for local state
        const formattedBudget = {
          id: newBudget.id,
          categoryId: newBudget.category_id,
          limit: parseFloat(newBudget.amount),
          spent: 0,
          period: newBudget.period,
          start_date: newBudget.start_date,
          is_active: newBudget.is_active
        };
        
        dispatch({ type: 'ADD_BUDGET', payload: formattedBudget });
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Nu s-a putut salva bugetul');
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
            {editingBudget ? 'Editează bugetul' : 'Creează buget'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              id="category"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">Selectează o categorie</option>
              {expenseCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Suma bugetului
            </label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Period */}
          <div>
            <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-2">
              Perioada bugetului
            </label>
            <select
              id="period"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="weekly">Săptămânal</option>
              <option value="monthly">Lunar</option>
              <option value="yearly">Anual</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
              Data de început
            </label>
            <input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Buget activ</p>
              <p className="text-sm text-gray-600">Activează urmărirea bugetului și alertele</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              fullWidth
            >
              Anulează
            </Button>
            <Button
              type="submit"
              loading={loading}
              fullWidth
            >
              {editingBudget ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}