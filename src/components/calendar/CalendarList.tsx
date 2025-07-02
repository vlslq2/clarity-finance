import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar as CalendarIcon, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  addDays,
  subDays
} from 'date-fns';
import { getCategoryEmoji } from '../../utils/categoryIcons';

interface CalendarListProps {
  transactions: any[];
  categories: any[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export default function CalendarList({ transactions, categories, onDateSelect, selectedDate }: CalendarListProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);
  const [customPeriod, setCustomPeriod] = useState<{start: Date | null, end: Date | null}>({
    start: null,
    end: null
  });
  const [periodType, setPeriodType] = useState<'month' | 'custom'>('month');

  const getDateRange = () => {
    if (periodType === 'custom' && customPeriod.start && customPeriod.end) {
      return { start: customPeriod.start, end: customPeriod.end };
    }
    
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return { start: calendarStart, end: calendarEnd };
  };

  const { start, end } = getDateRange();
  const calendarDays = eachDayOfInterval({ start, end });

  const getTransactionsForDate = (date: Date) => {
    return transactions.filter(t => isSameDay(t.date, date));
  };

  const getDayTotal = (date: Date) => {
    const dayTransactions = getTransactionsForDate(date);
    return dayTransactions.reduce((total, t) => {
      return total + (t.type === 'income' ? t.amount : -Math.abs(t.amount));
    }, 0);
  };

  const toggleDateExpansion = (dateKey: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDates(newExpanded);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    setExpandedDates(new Set());
    if (periodType === 'custom') {
      setPeriodType('month');
      setCustomPeriod({ start: null, end: null });
    }
  };

  const handleCustomPeriodSelect = (start: Date, end: Date) => {
    setCustomPeriod({ start, end });
    setPeriodType('custom');
    setShowPeriodSelector(false);
    setExpandedDates(new Set());
  };

  const resetToMonth = () => {
    setPeriodType('month');
    setCustomPeriod({ start: null, end: null });
    setShowPeriodSelector(false);
  };

  const getDisplayTitle = () => {
    if (periodType === 'custom' && customPeriod.start && customPeriod.end) {
      if (isSameDay(customPeriod.start, customPeriod.end)) {
        return format(customPeriod.start, 'MMM d, yyyy');
      }
      return `${format(customPeriod.start, 'MMM d')} - ${format(customPeriod.end, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  // Quick period options
  const quickPeriods = [
    {
      label: 'Last 7 days',
      start: subDays(new Date(), 6),
      end: new Date()
    },
    {
      label: 'Last 14 days', 
      start: subDays(new Date(), 13),
      end: new Date()
    },
    {
      label: 'Last 30 days',
      start: subDays(new Date(), 29),
      end: new Date()
    }
  ];

  return (
    <div className="space-y-4">
      {/* Month Navigation & Period Selector */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigateMonth('prev')}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
            disabled={periodType === 'custom'}
          >
            <ChevronLeft size={20} className={periodType === 'custom' ? 'text-gray-300' : ''} />
          </button>
          
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-gray-900">
              {getDisplayTitle()}
            </h2>
            {periodType === 'custom' && (
              <button
                onClick={resetToMonth}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPeriodSelector(!showPeriodSelector)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
                showPeriodSelector ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              <Filter size={16} />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
              disabled={periodType === 'custom'}
            >
              <ChevronRight size={20} className={periodType === 'custom' ? 'text-gray-300' : ''} />
            </button>
          </div>
        </div>

        {/* Period Selector */}
        {showPeriodSelector && (
          <div className="border-t border-gray-100 p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Select Period</h3>
            
            {/* Quick Periods */}
            <div className="grid grid-cols-1 gap-2">
              {quickPeriods.map((period, index) => (
                <button
                  key={index}
                  onClick={() => handleCustomPeriodSelect(period.start, period.end)}
                  className="text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium text-sm">{period.label}</div>
                  <div className="text-xs text-gray-600">
                    {format(period.start, 'MMM d')} - {format(period.end, 'MMM d')}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Date Range */}
            <div className="border-t border-gray-100 pt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Custom Range</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600">From</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      setCustomPeriod(prev => ({ ...prev, start: date }));
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">To</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      setCustomPeriod(prev => ({ ...prev, end: date }));
                    }}
                  />
                </div>
              </div>
              {customPeriod.start && customPeriod.end && (
                <button
                  onClick={() => handleCustomPeriodSelect(customPeriod.start!, customPeriod.end!)}
                  className="w-full mt-2 px-3 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Apply Custom Range
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Vertical List of Days */}
      <div className="space-y-2">
        {calendarDays.map(day => {
          const dayTransactions = getTransactionsForDate(day);
          const dayTotal = getDayTotal(day);
          const hasTransactions = dayTransactions.length > 0;
          const isTodayDate = isToday(day);
          const dateKey = format(day, 'yyyy-MM-dd');
          const isExpanded = expandedDates.has(dateKey);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          
          return (
            <div
              key={dateKey}
              className={`bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-200 ${
                isSelected ? 'ring-2 ring-black' : ''
              } ${isTodayDate ? 'ring-2 ring-blue-500' : ''}`}
            >
              {/* Date Header - Minimum height: 64px for touch targets */}
              <button
                onClick={() => {
                  onDateSelect(day);
                  if (hasTransactions) {
                    toggleDateExpansion(dateKey);
                  }
                }}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors min-h-[64px]"
              >
                <div className="flex items-center space-x-4">
                  {/* Large Date Display */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    isTodayDate ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  {/* Date Info */}
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">
                      {format(day, 'EEEE')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(day, 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                {/* Transaction Summary */}
                <div className="flex items-center space-x-3">
                  {hasTransactions && (
                    <>
                      <div className="text-right">
                        <p className={`font-bold ${dayTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {dayTotal >= 0 ? '+' : ''}${dayTotal.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dayTransactions.length} transaction{dayTransactions.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ChevronDown 
                        size={16} 
                        className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                      />
                    </>
                  )}
                  
                  {!hasTransactions && (
                    <div className="text-gray-400">
                      <CalendarIcon size={16} />
                    </div>
                  )}
                </div>
              </button>
              
              {/* Expanded Transaction Details */}
              {isExpanded && hasTransactions && (
                <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                  {dayTransactions.map(transaction => {
                    const category = categories.find(c => c.id === transaction.category);
                    
                    return (
                      <div key={transaction.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                          {category && (
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${category.color}20` }}
                            >
                              <span className="text-sm">
                                {getCategoryEmoji(category.icon)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{transaction.description}</p>
                            <p className="text-xs text-gray-600">{category?.name}</p>
                          </div>
                        </div>
                        <p className={`font-semibold text-sm ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {calendarDays.filter(day => getTransactionsForDate(day).length > 0).length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <CalendarIcon className="text-gray-400 mx-auto mb-3" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No transactions found</h3>
          <p className="text-gray-500">
            {periodType === 'custom' 
              ? 'No transactions in the selected period' 
              : 'No transactions this month'
            }
          </p>
        </div>
      )}
    </div>
  );
}