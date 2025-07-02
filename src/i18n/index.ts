import { ro } from './ro';

export type Language = 'ro';
export type TranslationKey = keyof typeof ro;

const translations = {
  ro
};

let currentLanguage: Language = 'ro';

export function setLanguage(lang: Language) {
  currentLanguage = lang;
}

export function getCurrentLanguage(): Language {
  return currentLanguage;
}

export function t(key: string): string {
  const keys = key.split('.');
  let value: any = translations[currentLanguage];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

export { ro };