import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToastContext } from '../../context/ToastContext';
import Button from '../Button';
import { X } from 'lucide-react';
import { api } from '../../lib/supabase';
import { t } from '../../i18n';
import { Pocket } from '../../types';

interface PocketFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingPocket?: Pocket;
}

export default function PocketForm({ isOpen, onClose, editingPocket }: PocketFormProps) {
  const { dispatch } = useApp();
  const toast = useToastContext();
  
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingPocket) {
      setFormData({
        name: editingPocket.name,
        balance: editingPocket.balance.toString(),
      });
    } else {
      setFormData({
        name: '',
        balance: '',
      });
    }
    setError('');
  }, [editingPocket, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const pocketData = {
        ...formData,
        balance: parseFloat(formData.balance) || 0,
      };

      if (editingPocket) {
        const updatedPocket = await api.pockets.update({
          ...pocketData,
          id: editingPocket.id,
        });
        dispatch({ type: 'UPDATE_POCKET', payload: updatedPocket });
        toast.success('Pocket updated successfully');
      } else {
        const newPocket = await api.pockets.create(pocketData);
        dispatch({ type: 'ADD_POCKET', payload: newPocket });
        toast.success('Pocket created successfully');
      }

      onClose();
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message);
      toast.error('Failed to save pocket', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold">
            {editingPocket ? t('pockets.editPocket') : t('pockets.addPocket')}
          </h2>
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              {t('pockets.pocketName')}
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl"
            />
          </div>

          <div>
            <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-2">
              {t('pockets.initialBalance')}
            </label>
            <input
              id="balance"
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
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
              {editingPocket ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}