
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Header from '../components/Header';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { t } from '../i18n';
import { getCategoryEmoji } from '../utils/categoryIcons';

export default function Dashboard() {
  const { state } = useApp();
  const { transactions, budgets, categories, pockets } = state;

  const visiblePockets = pockets.filter(p => !p.is_default);

  // Calculate total balance from visible pockets
  const totalBalance = visiblePockets.reduce((sum, p) => sum + p.balance, 0);

  // Calculate current month's data
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  const currentMonthTransactions = transactions.filter(t => 
    t.date >= monthStart && t.date <= monthEnd
  );

  const totalIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Top spending categories
  const categorySpending = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const topCategories = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([categoryId, amount]) => ({
      category: categories.find(c => c.id === categoryId),
      amount
    }));

  return (
    <div className="md:ml-64">
      <Header title={t('dashboard.title')} />
      
      <div className="p-4 md:p-8 space-y-6">
        {/* Balance Overview */}
        <Card>
          <div className="text-center">
            <p className="text-gray-600 mb-2">{t('dashboard.currentBalance')}</p>
            <h2 className={`text-4xl font-bold mb-4 ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalBalance.toFixed(2)} RON
            </h2>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="text-green-600 mr-2" size={20} />
                  <span className="text-sm text-gray-600">{t('common.income')} (This Month)</span>
                </div>
                <p className="text-xl font-semibold text-green-600">{totalIncome.toFixed(2)} RON</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingDown className="text-red-600 mr-2" size={20} />
                  <span className="text-sm text-gray-600">{t('common.expense')} (This Month)</span>
                </div>
                <p className="text-xl font-semibold text-red-600">{totalExpenses.toFixed(2)} RON</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Pockets List */}
        {visiblePockets.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold mb-4">{t('nav.pockets')}</h3>
            <div className="space-y-3">
              {visiblePockets.map(pocket => (
                <div key={pocket.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wallet size={18} className="mr-3 text-gray-500" />
                    <span className="font-medium">{pocket.name}</span>
                  </div>
                  <span className="font-semibold">{pocket.balance.toFixed(2)} RON</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Top Spending Categories */}
        {topCategories.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold mb-4">{t('dashboard.topSpending')}</h3>
            <div className="space-y-4">
              {topCategories.map(({ category, amount }, index) => {
                if (!category) return null;
                return (
                  <div key={category.id} className="flex items-center justify-between">
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
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-gray-600">#{index + 1} {t('dashboard.category')}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-red-600">{amount.toFixed(2)} RON</p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Budget Progress */}
        {budgets.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold mb-4">{t('dashboard.budgetProgress')}</h3>
            <div className="space-y-4">
              {budgets.slice(0, 3).map(budget => {
                const category = categories.find(c => c.id === budget.categoryId);
                const progress = (budget.spent / budget.limit) * 100;
                const isOverBudget = progress > 100;
                
                if (!category) return null;
                
                return (
                  <div key={budget.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{category.name}</span>
                      <span className={`text-sm font-semibold ${isOverBudget ? 'text-red-600' : 'text-gray-600'}`}>
                        {budget.spent.toFixed(2)} / {budget.limit.toFixed(2)} RON
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isOverBudget ? 'bg-red-500' : 'bg-black'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    {isOverBudget && (
                      <p className="text-xs text-red-600 mt-1">
                        {t('dashboard.overBudgetBy')} {(budget.spent - budget.limit).toFixed(2)} RON
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.recentTransactions')}</h3>
          <div className="space-y-3">
            {transactions.slice(0, 5).map(transaction => {
              const category = categories.find(c => c.id === transaction.category);
              return (
                <div key={transaction.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    {category && (
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center mr-3"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <span className="text-lg">
                          {getCategoryEmoji(category.icon)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-600">{format(transaction.date, 'dd MMM')}</p>
                    </div>
                  </div>
                  <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{Math.abs(transaction.amount).toFixed(2)} RON
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}