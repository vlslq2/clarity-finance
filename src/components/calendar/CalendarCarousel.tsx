import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { 
  format, 
  addDays, 
  isSameDay, 
  isToday,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  eachDayOfInterval
} from 'date-fns';
import { getCategoryEmoji } from '../../utils/categoryIcons';

interface CalendarCarouselProps {
  transactions: any[];
  categories: any[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export default function CalendarCarousel({ transactions, categories, onDateSelect, selectedDate }: CalendarCarouselProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateState, setSelectedDateState] = useState<Date>(selectedDate || new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate all days in the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTransactionsForDate = (date: Date) => {
    return transactions.filter(t => isSameDay(t.date, date));
  };

  const getDayTotal = (date: Date) => {
    const dayTransactions = getTransactionsForDate(date);
    return dayTransactions.reduce((total, t) => {
      return total + (t.type === 'income' ? t.amount : -Math.abs(t.amount));
    }, 0);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDateState(date);
    onDateSelect(date);
  };

  // Auto-scroll to selected date when month changes
  useEffect(() => {
    if (scrollRef.current && selectedDateState) {
      const selectedIndex = monthDays.findIndex(day => isSameDay(day, selectedDateState));
      if (selectedIndex !== -1) {
        const scrollPosition = selectedIndex * 80; // 80px is the width of each day card
        scrollRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
      }
    }
  }, [currentMonth, selectedDateState, monthDays]);

  const selectedDateTransactions = getTransactionsForDate(selectedDateState);

  return (
    <div className="space-y-4">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-gray-100">
        <button
          onClick={() => navigateMonth('prev')}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} />
        </button>
        
        <h2 className="text-lg font-bold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <button
          onClick={() => navigateMonth('next')}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Horizontal Scrolling Month View */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {monthDays.map(day => {
            const dayTransactions = getTransactionsForDate(day);
            const dayTotal = getDayTotal(day);
            const hasTransactions = dayTransactions.length > 0;
            const isTodayDate = isToday(day);
            const isSelected = isSameDay(day, selectedDateState);
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateSelect(day)}
                className={`
                  flex-shrink-0 w-20 h-24 flex flex-col items-center justify-center
                  border-r border-gray-100 last:border-r-0 snap-center
                  transition-all duration-200 hover:bg-gray-50 relative
                  ${isSelected ? 'bg-black text-white' : ''}
                  ${isTodayDate && !isSelected ? 'bg-blue-50 text-blue-600' : ''}
                `}
                aria-label={`${format(day, 'EEEE, MMMM d')}${hasTransactions ? ` - ${dayTransactions.length} transactions` : ''}`}
              >
                {/* Day of Week */}
                <span className={`text-xs font-medium mb-1 ${
                  isSelected ? 'text-white' : 'text-gray-600'
                }`}>
                  {format(day, 'EEE')}
                </span>
                
                {/* Date Number - Large and prominent */}
                <span className={`text-2xl font-bold mb-1 ${
                  isSelected ? 'text-white' : 
                  isTodayDate ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {format(day, 'd')}
                </span>
                
                {/* Transaction Indicator */}
                {hasTransactions && (
                  <div className={`w-2 h-2 rounded-full ${
                    isSelected ? 'bg-white' :
                    dayTotal > 0 ? 'bg-green-500' : 
                    dayTotal < 0 ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
                )}

                {/* Transaction Count Badge */}
                {hasTransactions && dayTransactions.length > 1 && (
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    isSelected ? 'bg-white text-black' : 'bg-red-500 text-white'
                  }`}>
                    {dayTransactions.length}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {format(selectedDateState, 'EEEE, MMMM d')}
          </h3>
          {selectedDateTransactions.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedDateTransactions.length} transaction{selectedDateTransactions.length !== 1 ? 's' : ''}
              </span>
              <div className={`w-3 h-3 rounded-full ${
                getDayTotal(selectedDateState) > 0 ? 'bg-green-500' : 
                getDayTotal(selectedDateState) < 0 ? 'bg-red-500' : 'bg-gray-400'
              }`} />
            </div>
          )}
        </div>
        
        {selectedDateTransactions.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="text-gray-400 mx-auto mb-2" size={32} />
            <p className="text-gray-500">No transactions on this date</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDateTransactions.map(transaction => {
              const category = categories.find(c => c.id === transaction.category);
              
              return (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    {category && (
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <span className="text-lg">
                          {getCategoryEmoji(category.icon)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-600">{category?.name}</p>
                    </div>
                  </div>
                  <p className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                </div>
              );
            })}
            
            {/* Day Total */}
            <div className="border-t border-gray-200 pt-3 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Day Total</span>
                <span className={`font-bold text-lg ${
                  getDayTotal(selectedDateState) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {getDayTotal(selectedDateState) >= 0 ? '+' : ''}${getDayTotal(selectedDateState).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}