import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import FAB from '../components/FAB';
import { Plus, Play, Pause, Edit2, Trash2, Repeat, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function Recurring() {
  const { state, dispatch } = useApp();
  const { recurringTransactions, categories } = state;
  const [showAddModal, setShowAddModal] = useState(false);

  const activeRecurring = recurringTransactions.filter(r => r.isActive);
  const inactiveRecurring = recurringTransactions.filter(r => !r.isActive);

  const toggleRecurring = (id: string) => {
    const recurring = recurringTransactions.find(r => r.id === id);
    if (recurring) {
      dispatch({
        type: 'UPDATE_RECURRING',
        payload: { ...recurring, isActive: !recurring.isActive }
      });
    }
  };

  const handleDeleteRecurring = (id: string) => {
    if (confirm('Are you sure you want to delete this recurring transaction?')) {
      dispatch({ type: 'DELETE_RECURRING', payload: id });
    }
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return frequency;
    }
  };

  const RecurringSection = ({ 
    title, 
    transactions: sectionTransactions, 
    emptyMessage 
  }: { 
    title: string; 
    transactions: typeof recurringTransactions; 
    emptyMessage: string; 
  }) => (
    <Card>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      {sectionTransactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sectionTransactions.map(recurring => {
            const category = categories.find(c => c.id === recurring.category);
            
            return (
              <div
                key={recurring.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center flex-1">
                  {category && (
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mr-4"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <span className="text-xl">
                        {category.icon === 'UtensilsCrossed' && '🍽️'}
                        {category.icon === 'Car' && '🚗'}
                        {category.icon === 'ShoppingBag' && '🛍️'}
                        {category.icon === 'Receipt' && '🧾'}
                        {category.icon === 'Banknote' && '💰'}
                        {category.icon === 'TrendingUp' && '📈'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{recurring.description}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-600">{category?.name}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">{getFrequencyText(recurring.frequency)}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        Next: {format(recurring.nextDate, 'MMM dd')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className={`text-lg font-bold ${recurring.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {recurring.type === 'income' ? '+' : '-'}${Math.abs(recurring.amount).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => toggleRecurring(recurring.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        recurring.isActive 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={recurring.isActive ? 'Pause' : 'Resume'}
                    >
                      {recurring.isActive ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteRecurring(recurring.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
        title="Recurring" 
        action={
          <Button 
            onClick={() => setShowAddModal(true)}
            size="sm"
            className="hidden md:flex"
          >
            <Plus size={16} className="mr-1" />
            Add Recurring
          </Button>
        }
      />
      
      <div className="p-4 md:p-8 space-y-6">
        {/* Recurring Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{activeRecurring.length}</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </Card>
          
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{inactiveRecurring.length}</p>
              <p className="text-sm text-gray-600">Paused</p>
            </div>
          </Card>
        </div>

        {/* Active Recurring */}
        <RecurringSection
          title="Active Recurring Transactions"
          transactions={activeRecurring}
          emptyMessage="No active recurring transactions."
        />

        {/* Paused Recurring */}
        {inactiveRecurring.length > 0 && (
          <RecurringSection
            title="Paused Recurring Transactions"
            transactions={inactiveRecurring}
            emptyMessage="No paused recurring transactions."
          />
        )}

        {recurringTransactions.length === 0 && (
          <Card className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Repeat size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No recurring transactions</h3>
            <p className="text-gray-500 mb-6">Set up recurring transactions to automate your regular income and expenses</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={16} className="mr-2" />
              Add Recurring Transaction
            </Button>
          </Card>
        )}
      </div>

      <FAB onClick={() => setShowAddModal(true)} />
    </div>
  );
}