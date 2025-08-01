import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  CreditCard, 
  Target, 
  MoreHorizontal,
  Grid3X3, 
  Wallet,
  BarChart3, 
  Calendar,
  X
} from 'lucide-react';
import { t } from '../i18n';

const primaryNavItems = [
  { path: '/', icon: Home, label: t('nav.home') },
  { path: '/transactions', icon: CreditCard, label: t('nav.transactions') },
  { path: '/budgets', icon: Target, label: t('nav.budgets') }
];

const moreNavItems = [
  { path: '/categories', icon: Grid3X3, label: t('nav.categories') },
  { path: '/pockets', icon: Wallet, label: t('nav.pockets') },
  { path: '/reports', icon: BarChart3, label: t('nav.reports') },
  { path: '/calendar', icon: Calendar, label: t('nav.calendar') }
];

const allNavItems = [
  ...primaryNavItems,
  ...moreNavItems
];

export default function BottomNav() {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleMoreClick = () => {
    setShowMoreMenu(!showMoreMenu);
  };

  const handleMenuItemClick = () => {
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* More Menu Overlay */}
      {showMoreMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setShowMoreMenu(false)}>
          <div className="absolute bottom-20 left-4 right-4 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Mai multe pagini</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Menu Items */}
            <div className="p-2">
              {moreNavItems.map(({ path, icon: Icon, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={handleMenuItemClick}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-4 rounded-xl mb-1 transition-colors ${
                      isActive 
                        ? 'bg-black text-white' 
                        : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                    }`
                  }
                >
                  <Icon size={20} strokeWidth={2} />
                  <span className="font-medium">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 md:hidden z-30">
        <div className="grid grid-cols-4 h-16">
          {/* Primary Navigation Items */}
          {primaryNavItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center space-y-1 transition-colors ${
                  isActive 
                    ? 'text-black' 
                    : 'text-gray-400 active:text-gray-600'
                }`
              }
            >
              <Icon size={20} strokeWidth={2} />
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          ))}
          
          {/* More Button */}
          <button
            onClick={handleMoreClick}
            className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
              showMoreMenu 
                ? 'text-black' 
                : 'text-gray-400 active:text-gray-600'
            }`}
          >
            <MoreHorizontal size={20} strokeWidth={2} />
            <span className="text-xs font-medium">Mai mult</span>
          </button>
        </div>
      </nav>

      {/* Desktop Side Navigation */}
      <nav className="hidden md:fixed md:left-0 md:top-0 md:h-full md:w-64 md:bg-gray-50 md:border-r md:border-gray-100 md:flex md:flex-col md:py-8">
        <div className="px-6 mb-8">
          <h1 className="text-2xl font-bold text-black">Clarity Finance</h1>
        </div>
        <div className="flex-1 px-4">
          {allNavItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl mb-2 transition-colors ${
                  isActive 
                    ? 'bg-black text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={20} strokeWidth={2} />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}