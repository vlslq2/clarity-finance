import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Button from '../Button';
import { X } from 'lucide-react';
import { api } from '../../lib/supabase';
import { t } from '../../i18n';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: any;
}

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#e11d48', '#64748b', '#374151', '#000000'
];

const CATEGORY_ICONS = [
  // Mâncare și băuturi
  { name: 'utensils', emoji: '🍽️', label: 'Mâncare' },
  { name: 'coffee', emoji: '☕', label: 'Cafea' },
  { name: 'pizza', emoji: '🍕', label: 'Pizza' },
  { name: 'hamburger', emoji: '🍔', label: 'Fast Food' },
  { name: 'wine', emoji: '🍷', label: 'Băuturi' },
  { name: 'cake', emoji: '🎂', label: 'Desert' },
  { name: 'beer', emoji: '🍺', label: 'Bere' },
  { name: 'ice-cream', emoji: '🍦', label: 'Înghețată' },
  
  // Transport
  { name: 'car', emoji: '🚗', label: 'Mașină' },
  { name: 'bus', emoji: '🚌', label: 'Autobuz' },
  { name: 'train', emoji: '🚊', label: 'Tren' },
  { name: 'bike', emoji: '🚲', label: 'Bicicletă' },
  { name: 'taxi', emoji: '🚕', label: 'Taxi' },
  { name: 'fuel', emoji: '⛽', label: 'Combustibil' },
  { name: 'plane', emoji: '✈️', label: 'Avion' },
  { name: 'metro', emoji: '🚇', label: 'Metrou' },
  
  // Cumpărături și retail
  { name: 'shopping-bag', emoji: '🛍️', label: 'Cumpărături' },
  { name: 'shirt', emoji: '👕', label: 'Îmbrăcăminte' },
  { name: 'shoe', emoji: '👟', label: 'Încălțăminte' },
  { name: 'watch', emoji: '⌚', label: 'Accesorii' },
  { name: 'gift', emoji: '🎁', label: 'Cadouri' },
  { name: 'jewelry', emoji: '💎', label: 'Bijuterii' },
  { name: 'cosmetics', emoji: '💄', label: 'Cosmetice' },
  { name: 'perfume', emoji: '🌸', label: 'Parfumuri' },
  
  // Divertisment și timp liber
  { name: 'film', emoji: '🎬', label: 'Filme' },
  { name: 'music', emoji: '🎵', label: 'Muzică' },
  { name: 'game', emoji: '🎮', label: 'Jocuri' },
  { name: 'sports', emoji: '⚽', label: 'Sport' },
  { name: 'party', emoji: '🎉', label: 'Petreceri' },
  { name: 'camera', emoji: '📷', label: 'Fotografie' },
  { name: 'book', emoji: '📚', label: 'Cărți' },
  { name: 'theater', emoji: '🎭', label: 'Teatru' },
  
  // Facturi și utilități
  { name: 'zap', emoji: '⚡', label: 'Electricitate' },
  { name: 'wifi', emoji: '📶', label: 'Internet' },
  { name: 'phone', emoji: '📱', label: 'Telefon' },
  { name: 'water', emoji: '💧', label: 'Apă' },
  { name: 'gas', emoji: '🔥', label: 'Gaz' },
  { name: 'receipt', emoji: '🧾', label: 'Facturi' },
  { name: 'tv', emoji: '📺', label: 'Televiziune' },
  { name: 'heating', emoji: '🔥', label: 'Încălzire' },
  
  // Sănătate și wellness
  { name: 'heart', emoji: '❤️', label: 'Sănătate' },
  { name: 'pill', emoji: '💊', label: 'Medicamente' },
  { name: 'hospital', emoji: '🏥', label: 'Spital' },
  { name: 'fitness', emoji: '💪', label: 'Fitness' },
  { name: 'spa', emoji: '🧘', label: 'Wellness' },
  { name: 'dental', emoji: '🦷', label: 'Stomatologie' },
  { name: 'glasses', emoji: '👓', label: 'Optică' },
  { name: 'pharmacy', emoji: '💉', label: 'Farmacie' },
  
  // Educație și învățare
  { name: 'school', emoji: '🎓', label: 'Educație' },
  { name: 'laptop', emoji: '💻', label: 'Tehnologie' },
  { name: 'pen', emoji: '✏️', label: 'Rechizite' },
  { name: 'course', emoji: '📖', label: 'Cursuri' },
  { name: 'language', emoji: '🗣️', label: 'Limbi străine' },
  { name: 'university', emoji: '🏫', label: 'Universitate' },
  { name: 'library', emoji: '📚', label: 'Bibliotecă' },
  { name: 'research', emoji: '🔬', label: 'Cercetare' },
  
  // Călătorii și vacanțe
  { name: 'hotel', emoji: '🏨', label: 'Hotel' },
  { name: 'luggage', emoji: '🧳', label: 'Călătorii' },
  { name: 'beach', emoji: '🏖️', label: 'Vacanță' },
  { name: 'mountain', emoji: '🏔️', label: 'Aventură' },
  { name: 'passport', emoji: '📘', label: 'Documente' },
  { name: 'map', emoji: '🗺️', label: 'Turism' },
  { name: 'camping', emoji: '🏕️', label: 'Camping' },
  { name: 'cruise', emoji: '🚢', label: 'Croazieră' },
  
  // Muncă și afaceri
  { name: 'briefcase', emoji: '💼', label: 'Muncă' },
  { name: 'office', emoji: '🏢', label: 'Birou' },
  { name: 'meeting', emoji: '🤝', label: 'Întâlniri' },
  { name: 'chart', emoji: '📊', label: 'Afaceri' },
  { name: 'tools', emoji: '🔧', label: 'Unelte' },
  { name: 'factory', emoji: '🏭', label: 'Industrie' },
  { name: 'conference', emoji: '🎤', label: 'Conferințe' },
  { name: 'networking', emoji: '🌐', label: 'Networking' },
  
  // Casă și locuință
  { name: 'home', emoji: '🏠', label: 'Casă' },
  { name: 'furniture', emoji: '🛋️', label: 'Mobilier' },
  { name: 'cleaning', emoji: '🧽', label: 'Curățenie' },
  { name: 'garden', emoji: '🌱', label: 'Grădină' },
  { name: 'repair', emoji: '🔨', label: 'Reparații' },
  { name: 'decoration', emoji: '🖼️', label: 'Decorațiuni' },
  { name: 'kitchen', emoji: '🍳', label: 'Bucătărie' },
  { name: 'bathroom', emoji: '🚿', label: 'Baie' },
  
  // Finanțe și investiții
  { name: 'trending-up', emoji: '📈', label: 'Investiții' },
  { name: 'bank', emoji: '🏦', label: 'Bancă' },
  { name: 'credit-card', emoji: '💳', label: 'Card de credit' },
  { name: 'coins', emoji: '🪙', label: 'Economii' },
  { name: 'dollar', emoji: '💰', label: 'Bani' },
  { name: 'piggy-bank', emoji: '🐷', label: 'Pușculiță' },
  { name: 'insurance', emoji: '🛡️', label: 'Asigurări' },
  { name: 'loan', emoji: '📋', label: 'Împrumuturi' },
  
  // Animale de companie
  { name: 'dog', emoji: '🐕', label: 'Câine' },
  { name: 'cat', emoji: '🐱', label: 'Pisică' },
  { name: 'fish', emoji: '🐠', label: 'Pești' },
  { name: 'bird', emoji: '🐦', label: 'Păsări' },
  { name: 'vet', emoji: '🩺', label: 'Veterinar' },
  { name: 'pet-food', emoji: '🦴', label: 'Hrană animale' },
  { name: 'pet-toys', emoji: '🎾', label: 'Jucării animale' },
  { name: 'grooming', emoji: '✂️', label: 'Îngrijire animale' },
  
  // Îngrijire personală
  { name: 'haircut', emoji: '💇', label: 'Tunsoare' },
  { name: 'makeup', emoji: '💄', label: 'Frumusețe' },
  { name: 'soap', emoji: '🧼', label: 'Îngrijire personală' },
  { name: 'mirror', emoji: '🪞', label: 'Îngrijire' },
  { name: 'nail', emoji: '💅', label: 'Manichiură' },
  { name: 'massage', emoji: '💆', label: 'Masaj' },
  { name: 'skincare', emoji: '🧴', label: 'Îngrijirea pielii' },
  { name: 'salon', emoji: '💇‍♀️', label: 'Salon' },
  
  // Servicii și utilități
  { name: 'laundry', emoji: '👕', label: 'Spălătorie' },
  { name: 'delivery', emoji: '📦', label: 'Livrări' },
  { name: 'postal', emoji: '📮', label: 'Poștă' },
  { name: 'security', emoji: '🔒', label: 'Securitate' },
  { name: 'legal', emoji: '⚖️', label: 'Servicii juridice' },
  { name: 'accounting', emoji: '🧮', label: 'Contabilitate' },
  { name: 'consulting', emoji: '💼', label: 'Consultanță' },
  { name: 'subscription', emoji: '📱', label: 'Abonamente' },
  
  // Donații și caritate
  { name: 'charity', emoji: '❤️', label: 'Caritate' },
  { name: 'donation', emoji: '🤲', label: 'Donații' },
  { name: 'volunteer', emoji: '🙋', label: 'Voluntariat' },
  { name: 'church', emoji: '⛪', label: 'Biserică' },
  { name: 'community', emoji: '👥', label: 'Comunitate' },
  { name: 'fundraising', emoji: '💝', label: 'Strângere de fonduri' },
  
  // Venituri
  { name: 'salary', emoji: '💰', label: 'Salariu' },
  { name: 'bonus', emoji: '🎁', label: 'Bonus' },
  { name: 'freelance', emoji: '💻', label: 'Freelancing' },
  { name: 'business', emoji: '🏢', label: 'Afaceri' },
  { name: 'rental', emoji: '🏠', label: 'Închirieri' },
  { name: 'dividend', emoji: '📈', label: 'Dividende' },
  { name: 'interest', emoji: '🏦', label: 'Dobânzi' },
  { name: 'pension', emoji: '👴', label: 'Pensie' },
  
  // Diverse
  { name: 'more-horizontal', emoji: '⭕', label: 'Altele' },
  { name: 'question', emoji: '❓', label: 'Necunoscut' },
  { name: 'star', emoji: '⭐', label: 'Special' },
  { name: 'fire', emoji: '🔥', label: 'Important' },
  { name: 'lightning', emoji: '⚡', label: 'Rapid' },
  { name: 'rainbow', emoji: '🌈', label: 'Distractiv' },
  { name: 'emergency', emoji: '🚨', label: 'Urgență' },
  { name: 'celebration', emoji: '🎊', label: 'Sărbătoare' }
];

export default function CategoryForm({ isOpen, onClose, editingCategory }: CategoryFormProps) {
  const { dispatch } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    icon: 'circle',
    color: '#6366f1',
    type: 'expense' as 'income' | 'expense'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [iconSearch, setIconSearch] = useState('');

  // Update form data when editingCategory changes
  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        icon: editingCategory.icon,
        color: editingCategory.color,
        type: editingCategory.type
      });
    } else {
      setFormData({
        name: '',
        icon: 'circle',
        color: '#6366f1',
        type: 'expense'
      });
    }
    setIconSearch('');
    setError('');
  }, [editingCategory, isOpen]);

  const filteredIcons = CATEGORY_ICONS.filter(icon => 
    icon.label.toLowerCase().includes(iconSearch.toLowerCase()) ||
    icon.name.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingCategory) {
        const updatedCategory = await api.categories.update({
          ...formData,
          id: editingCategory.id
        });
        dispatch({ type: 'UPDATE_CATEGORY', payload: updatedCategory });
      } else {
        const newCategory = await api.categories.create(formData);
        dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Nu s-a putut salva categoria');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold">
            {editingCategory ? 'Editează categoria' : 'Adaugă categorie'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipul categoriei
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'expense' })}
                className={`p-4 rounded-xl border-2 transition-colors ${
                  formData.type === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">💸</div>
                  <div className="font-medium">Cheltuială</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'income' })}
                className={`p-4 rounded-xl border-2 transition-colors ${
                  formData.type === 'income'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">💰</div>
                  <div className="font-medium">Venit</div>
                </div>
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Numele categoriei
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Introdu numele categoriei"
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Alege pictograma
            </label>
            
            {/* Icon Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Caută pictograme..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
              />
            </div>

            {/* Icon Grid */}
            <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto border border-gray-100 rounded-xl p-3">
              {filteredIcons.map(icon => (
                <button
                  key={icon.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: icon.name })}
                  className={`p-2 rounded-lg border-2 transition-colors ${
                    formData.icon === icon.name
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={icon.label}
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">{icon.emoji}</div>
                    <div className="text-xs text-gray-600 truncate">{icon.label}</div>
                  </div>
                </button>
              ))}
            </div>
            
            {filteredIcons.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Nu s-au găsit pictograme pentru "{iconSearch}"</p>
              </div>
            )}
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Alege culoarea
            </label>
            <div className="grid grid-cols-5 gap-3">
              {CATEGORY_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-12 h-12 rounded-xl border-4 transition-all ${
                    formData.color === color
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Previzualizare</p>
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${formData.color}20` }}
              >
                <span className="text-xl">
                  {CATEGORY_ICONS.find(i => i.name === formData.icon)?.emoji || '⭕'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {formData.name || 'Numele categoriei'}
                </p>
                <p className="text-sm text-gray-600 capitalize">
                  {formData.type === 'income' ? 'Venit' : 'Cheltuială'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              fullWidth
            >
              Anulează
            </Button>
            <Button
              type="submit"
              loading={loading}
              fullWidth
            >
              {editingCategory ? t('common.update') : t('common.add')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}