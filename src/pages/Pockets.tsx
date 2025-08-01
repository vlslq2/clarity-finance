import { useState } from 'react';
import Header from '../components/Header';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { Plus, Trash2, ArrowRightLeft } from 'lucide-react';
import { t } from '../i18n';
import PocketForm from '../components/forms/PocketForm';
import TransferForm from '../components/forms/TransferForm';
import { api } from '../lib/supabase';
import { useToastContext } from '../context/ToastContext';
import { Pocket } from '../types';

export default function PocketsPage() {
  const { state, dispatch } = useApp();
  const { pockets } = state;
  const toast = useToastContext();
  const [isPocketFormOpen, setIsPocketFormOpen] = useState(false);
  const [isTransferFormOpen, setIsTransferFormOpen] = useState(false);
  const [editingPocket, setEditingPocket] = useState<Pocket | undefined>(undefined);

  const handleAddClick = () => {
    setEditingPocket(undefined);
    setIsPocketFormOpen(true);
  };

  const handleEditClick = (pocket: Pocket) => {
    setEditingPocket(pocket);
    setIsPocketFormOpen(true);
  };

  const handleDeleteClick = async (pocket: Pocket) => {
    if (pocket.is_default) {
      toast.error("You cannot delete your default pocket.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete the pocket "${pocket.name}"? All its transactions will be moved to your default pocket.`)) {
      try {
        await api.pockets.delete(pocket.id);
        dispatch({ type: 'DELETE_POCKET', payload: pocket.id });
        toast.success('Pocket deleted successfully');
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        toast.error('Failed to delete pocket', error.message);
      }
    }
  };

  return (
    <div className="md:ml-64">
      <Header 
        title={t('pockets.title')}
        action={
          <div className="flex space-x-2">
            <Button onClick={() => setIsTransferFormOpen(true)} variant="secondary">
              <ArrowRightLeft size={16} className="mr-2" />
              {t('pockets.transfer')}
            </Button>
            <Button onClick={handleAddClick}>
              <Plus size={16} className="mr-2" />
              {t('pockets.addPocket')}
            </Button>
          </div>
        }
      />
      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pockets.map(pocket => (
            <Card key={pocket.id} onClick={() => handleEditClick(pocket)} className="cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold">{pocket.name}</p>
                  <p className="text-sm text-gray-500">{t('pockets.currentBalance')}</p>
                </div>
                <div className="flex items-center">
                  <div className="text-2xl font-bold mr-4">
                    ${pocket.balance.toFixed(2)}
                  </div>
                  {!pocket.is_default && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(pocket); }} 
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {pockets.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">{t('pockets.noPockets')}</p>
            <Button onClick={handleAddClick} className="mt-4">
              {t('pockets.createFirstPocket')}
            </Button>
          </div>
        )}
      </div>
      
      <PocketForm 
        isOpen={isPocketFormOpen} 
        onClose={() => setIsPocketFormOpen(false)} 
        editingPocket={editingPocket} 
      />

      <TransferForm 
        isOpen={isTransferFormOpen}
        onClose={() => setIsTransferFormOpen(false)}
      />
    </div>
  );
}