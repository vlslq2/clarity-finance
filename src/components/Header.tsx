import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  action?: React.ReactNode;
}

export default function Header({ title, showBack = false, action }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-4 md:px-8">
        <div className="flex items-center space-x-4">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-xl font-bold text-black">{title}</h1>
        </div>
        {action && <div>{action}</div>}
      </div>
    </header>
  );
}