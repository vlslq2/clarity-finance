import React from 'react';
import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
  className?: string;
}

export default function FAB({ onClick, className = '' }: FABProps) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-20 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 active:bg-gray-900 transition-all duration-200 flex items-center justify-center z-50 ${className}`}
    >
      <Plus size={24} strokeWidth={2} />
    </button>
  );
}