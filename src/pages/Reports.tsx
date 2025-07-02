import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import { Download, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';

export default function Reports() {
  const { state } = useApp();
  const { transactions, categories } = state;
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');

  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'last3Months':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case 'thisYear':
        return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { start, end } = getDateRange();
  const filteredTransactions = transactions.filter(t => t.date >= start && t.date <= end);

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netIncome = totalIncome - totalExpenses;

  // Category breakdown
  const categoryBreakdown = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const category = categories.find(c => c.id === t.category);
      if (category) {
        acc[category.name] = (acc[category.name] || 0) + Math.abs(t.amount);
      }
      return acc;
    }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const exportData = () => {
    const csvContent = [
      ['Date', 'Description', 'Category', 'Amount', 'Type'],
      ...filteredTransactions.map(t => {
        const category = categories.find(c => c.id === t.category);
        return [
          format(t.date, 'yyyy-MM-dd'),
          t.description,
          category?.name || 'Unknown',
          t.amount.toString(),
          t.type
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-report-${format(start, 'yyyy-MM')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="md:ml-64">
      <Header 
        title="Reports" 
        action={
          <Button 
            onClick={exportData}
            size="sm"
            variant="secondary"
            className="hidden md:flex"
          >
            <Download size={16} className="mr-1" />
            Export
          </Button>
        }
      />
      
      <div className="p-4 md:p-8 space-y-6">
        {/* Period Selection */}
        <Card>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'thisMonth', label: 'This Month' },
              { key: 'lastMonth', label: 'Last Month' },
              { key: 'last3Months', label: 'Last 3 Months' },
              { key: 'thisYear', label: 'This Year' }
            ].map(period => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  selectedPeriod === period.key
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center">
              <TrendingUp className="text-green-500 mr-4" size={32} />
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <TrendingDown className="text-red-500 mr-4" size={32} />
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <PieChart className={`${netIncome >= 0 ? 'text-green-500' : 'text-red-500'} mr-4`} size={32} />
              <div>
                <p className="text-sm text-gray-600">Net Income</p>
                <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${netIncome.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Top Spending Categories */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Top Spending Categories</h3>
          {topCategories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No expense data for this period</p>
          ) : (
            <div className="space-y-4">
              {topCategories.map(([categoryName, amount], index) => {
                const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                const category = categories.find(c => c.name === categoryName);
                
                return (
                  <div key={categoryName}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {category && (
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            <span className="text-sm">
                              {category.icon === 'UtensilsCrossed' && '🍽️'}
                              {category.icon === 'Car' && '🚗'}
                              {category.icon === 'ShoppingBag' && '🛍️'}
                              {category.icon === 'Receipt' && '🧾'}
                            </span>
                          </div>
                        )}
                        <span className="font-medium">{categoryName}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${amount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-black h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Transaction Summary */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Transaction Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
              <p className="text-sm text-gray-600">Total Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {filteredTransactions.filter(t => t.type === 'income').length}
              </p>
              <p className="text-sm text-gray-600">Income Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {filteredTransactions.filter(t => t.type === 'expense').length}
              </p>
              <p className="text-sm text-gray-600">Expense Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {totalExpenses > 0 ? (totalIncome / totalExpenses * 100).toFixed(0) : 0}%
              </p>
              <p className="text-sm text-gray-600">Savings Rate</p>
            </div>
          </div>
        </Card>

        {/* Export Button for Mobile */}
        <div className="md:hidden">
          <Button onClick={exportData} fullWidth variant="secondary">
            <Download size={16} className="mr-2" />
            Export Report
          </Button>
        </div>
      </div>
    </div>
  );
}