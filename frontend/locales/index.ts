import { vi } from './vi';
import { en } from './en';

export const translations = {
  vi,
  en
};

export type SupportedLanguage = keyof typeof translations;
export type TranslationKeys = typeof vi;

export const defaultLanguage: SupportedLanguage = 'vi';

export const getTranslation = (lang: SupportedLanguage = defaultLanguage) => {
  return translations[lang] || translations[defaultLanguage];
};

export const getSupportedLanguages = (): SupportedLanguage[] => {
  return Object.keys(translations) as SupportedLanguage[];
};

export const getLanguageName = (lang: SupportedLanguage): string => {
  const names: Record<SupportedLanguage, string> = {
    vi: 'Tiếng Việt',
    en: 'English'
  };
  return names[lang] || names[defaultLanguage];
};

export { vi, en };
export * from './vi';
export * from './en';