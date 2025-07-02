import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import CalendarList from '../components/calendar/CalendarList';
import CalendarCarousel from '../components/calendar/CalendarCarousel';
import { List, Calendar as CalendarIcon } from 'lucide-react';

type CalendarView = 'list' | 'carousel';

export default function CalendarPage() {
  const { state } = useApp();
  const { transactions, categories } = state;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentView, setCurrentView] = useState<CalendarView>('list');

  const viewOptions = [
    { key: 'list' as CalendarView, label: 'List', icon: List },
    { key: 'carousel' as CalendarView, label: 'Carousel', icon: CalendarIcon }
  ];

  const renderCalendarView = () => {
    const commonProps = {
      transactions,
      categories,
      onDateSelect: setSelectedDate,
      selectedDate
    };

    switch (currentView) {
      case 'list':
        return <CalendarList {...commonProps} />;
      case 'carousel':
        return <CalendarCarousel {...commonProps} />;
      default:
        return <CalendarList {...commonProps} />;
    }
  };

  return (
    <div className="md:ml-64">
      <Header 
        title="Calendar" 
        action={
          <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
            {viewOptions.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setCurrentView(key)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentView === key
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        }
      />
      
      <div className="p-4 md:p-8">
        {renderCalendarView()}
      </div>
    </div>
  );
}