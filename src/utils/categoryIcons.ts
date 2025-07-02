// Utility to get emoji for category icon
export const getCategoryEmoji = (iconName: string): string => {
  const iconMap: Record<string, string> = {
    // Food & Dining
    'utensils': '🍽️',
    'coffee': '☕',
    'pizza': '🍕',
    'hamburger': '🍔',
    'wine': '🍷',
    'cake': '🎂',
    
    // Transportation
    'car': '🚗',
    'bus': '🚌',
    'train': '🚊',
    'bike': '🚲',
    'taxi': '🚕',
    'fuel': '⛽',
    
    // Shopping & Retail
    'shopping-bag': '🛍️',
    'shirt': '👕',
    'shoe': '👟',
    'watch': '⌚',
    'gift': '🎁',
    'jewelry': '💎',
    
    // Entertainment & Leisure
    'film': '🎬',
    'music': '🎵',
    'game': '🎮',
    'sports': '⚽',
    'party': '🎉',
    'camera': '📷',
    
    // Bills & Utilities
    'zap': '⚡',
    'wifi': '📶',
    'phone': '📱',
    'water': '💧',
    'gas': '🔥',
    'receipt': '🧾',
    
    // Health & Wellness
    'heart': '❤️',
    'pill': '💊',
    'hospital': '🏥',
    'fitness': '💪',
    'spa': '🧘',
    'dental': '🦷',
    
    // Education & Learning
    'book': '📚',
    'school': '🎓',
    'laptop': '💻',
    'pen': '✏️',
    'course': '📖',
    'language': '🗣️',
    
    // Travel & Vacation
    'plane': '✈️',
    'hotel': '🏨',
    'luggage': '🧳',
    'beach': '🏖️',
    'mountain': '🏔️',
    'passport': '📘',
    
    // Work & Business
    'briefcase': '💼',
    'office': '🏢',
    'meeting': '🤝',
    'chart': '📊',
    'tools': '🔧',
    'factory': '🏭',
    
    // Home & Living
    'home': '🏠',
    'furniture': '🛋️',
    'cleaning': '🧽',
    'garden': '🌱',
    'repair': '🔨',
    'decoration': '🖼️',
    
    // Finance & Investment
    'trending-up': '📈',
    'bank': '🏦',
    'credit-card': '💳',
    'coins': '🪙',
    'dollar': '💰',
    'piggy-bank': '🐷',
    
    // Pets & Animals
    'dog': '🐕',
    'cat': '🐱',
    'fish': '🐠',
    'bird': '🐦',
    'vet': '🩺',
    'pet-food': '🦴',
    
    // Personal Care
    'haircut': '💇',
    'makeup': '💄',
    'soap': '🧼',
    'perfume': '🌸',
    'mirror': '🪞',
    'nail': '💅',
    
    // Miscellaneous
    'more-horizontal': '⭕',
    'question': '❓',
    'star': '⭐',
    'fire': '🔥',
    'lightning': '⚡',
    'rainbow': '🌈',
    
    // Legacy icons (for backward compatibility)
    'UtensilsCrossed': '🍽️',
    'Car': '🚗',
    'ShoppingBag': '🛍️',
    'Receipt': '🧾',
    'Banknote': '💰',
    'TrendingUp': '📈',
    'circle': '⭕'
  };

  return iconMap[iconName] || '⭕';
};