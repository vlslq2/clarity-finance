import { useState } from 'react';
import Header from '../components/Header';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { Plus, Trash2, ArrowRightLeft, Edit2 } from 'lucide-react';
import { t } from '../i18n';
import PocketForm from '../components/forms/PocketForm';
import TransferForm from '../components/forms/TransferForm';
import { api } from '../lib/supabase';
import { useToastContext } from '../context/ToastContext';
import { Pocket } from '../types';
import FAB from '../components/FAB';
import { getPocketIcon } from '../utils/pocketIcons';

export default function PocketsPage() {
  const { state, dispatch } = useApp();
  const { pockets } = state;
  const toast = useToastContext();
  const [isPocketFormOpen, setIsPocketFormOpen] = useState(false);
  const [isTransferFormOpen, setIsTransferFormOpen] = useState(false);
  const [editingPocket, setEditingPocket] = useState<Pocket | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const visiblePockets = pockets.filter(p => !p.is_default);

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
      setDeletingId(pocket.id);
      try {
        await api.pockets.delete(pocket.id);
        dispatch({ type: 'DELETE_POCKET', payload: pocket.id });
        toast.success('Pocket deleted successfully');
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        toast.error('Failed to delete pocket', error.message);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="md:ml-64">
      <Header 
        title={t('pockets.title')}
        action={
          <div className="flex space-x-2">
            <Button onClick={() => setIsTransferFormOpen(true)} variant="secondary" size="sm">
              <ArrowRightLeft size={16} className="mr-2" />
              {t('pockets.transfer')}
            </Button>
            <Button onClick={handleAddClick} size="sm">
              <Plus size={16} className="mr-2" />
              Adauga
            </Button>
          </div>
        }
      />
      <div className="p-4 md:p-8">
        <div className="space-y-3">
          {visiblePockets.map(pocket => {
            const isDeleting = deletingId === pocket.id;
            const Icon = getPocketIcon(pocket.icon || 'Wallet');
            return (
              <Card key={pocket.id} padding="sm" className="transition-all duration-200 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 bg-gray-100">
                      <Icon size={20} className="text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 truncate pr-2">{pocket.name}</h3>
                        <p className="text-lg font-bold flex-shrink-0 text-gray-800">
                          {pocket.balance.toFixed(2)} RON
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1 ml-3 flex-shrink-0">
                    <button
                      onClick={() => handleEditClick(pocket)}
                      disabled={isDeleting}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(pocket)}
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

        {visiblePockets.length === 0 && (
          <Card className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">{t('pockets.noPockets')}</h3>
            
            <Button onClick={handleAddClick}>
              <Plus size={16} className="mr-2" />
              Adauga
            </Button>
          </Card>
        )}
      </div>
      
      <FAB onClick={handleAddClick} className="md:hidden" />

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