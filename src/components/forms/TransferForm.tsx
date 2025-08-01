import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToastContext } from '../../context/ToastContext';
import Button from '../Button';
import { X } from 'lucide-react';
import { api } from '../../lib/supabase';
import { t } from '../../i18n';


interface TransferFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransferForm({ isOpen, onClose }: TransferFormProps) {
  const { state, dispatch } = useApp();
  const { pockets } = state;
  const toast = useToastContext();
  
  const [formData, setFormData] = useState({
    from_pocket_id: '',
    to_pocket_id: '',
    amount: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && pockets.length > 1) {
      setFormData({
        from_pocket_id: pockets[0].id,
        to_pocket_id: pockets[1].id,
        amount: '',
      });
    }
    setError('');
  }, [isOpen, pockets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.from_pocket_id === formData.to_pocket_id) {
      toast.error("Cannot transfer to the same pocket.");
      setLoading(false);
      return;
    }

    try {
      await api.pockets.transfer(
        formData.from_pocket_id,
        formData.to_pocket_id,
        parseFloat(formData.amount)
      );
      
      // Refetch all data to ensure UI is consistent
      const updatedPockets = await api.pockets.getAll();
      dispatch({ type: 'SET_POCKETS', payload: updatedPockets });
      const updatedTransactions = await api.transactions.getAll();
      dispatch({ type: 'SET_TRANSACTIONS', payload: updatedTransactions.map((t: any) => ({...t, date: new Date(t.date)})) });

      toast.success('Transfer successful');
      onClose();
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message);
      toast.error('Transfer failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold">{t('pockets.transferBetweenPockets')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && <p className="text-red-500">{error}</p>}
          
          <div>
            <label htmlFor="from_pocket" className="block text-sm font-medium text-gray-700 mb-2">
              {t('pockets.from')}
            </label>
            <select
              id="from_pocket"
              value={formData.from_pocket_id}
              onChange={(e) => setFormData({ ...formData, from_pocket_id: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl"
            >
              {pockets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="to_pocket" className="block text-sm font-medium text-gray-700 mb-2">
              {t('pockets.to')}
            </label>
            <select
              id="to_pocket"
              value={formData.to_pocket_id}
              onChange={(e) => setFormData({ ...formData, to_pocket_id: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl"
            >
              {pockets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.amount')}
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              placeholder="0.00"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              fullWidth
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              fullWidth
            >
              {t('pockets.transfer')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}