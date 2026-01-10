import { router } from '@inertiajs/react';
import {
  createContext,
  use,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useLocalStorage } from 'usehooks-ts';

// Static imports for all locales - translations are immediately available
import enTranslations from '../locales/en.json';
import soTranslations from '../locales/so.json';
import arTranslations from '../locales/ar.json';

export type LanguageType = 'en' | 'so' | 'ar';

type Translations = Record<string, any>;

type LanguageContextType = {
  language: LanguageType;
  translations: Translations;
  setLanguage: (lang: LanguageType) => void;
  t: (key: string) => string;
  isRTL: boolean;
};

const RTL_LANGUAGES: LanguageType[] = ['ar'];

// Pre-loaded translations map - no async loading needed
const translationsMap: Record<LanguageType, Translations> = {
  en: enTranslations,
  so: soTranslations,
  ar: arTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguageContext = () => {
  const context = use(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext can only be used within LanguageProvider');
  }
  return context;
};

// Safe hook that returns null if LanguageProvider is not a parent
// This allows LayoutProvider to work with or without LanguageProvider
export const useLanguageContextSafe = () => {
  const context = use(LanguageContext);
  return context || null;
};

// Helper function to get nested translation value
const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path; // Return the key if not found
    }
  }

  return typeof value === 'string' ? value : path;
};

const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useLocalStorage<LanguageType>(
    '__APP_LANGUAGE__',
    'en'
  );

  const isRTL = RTL_LANGUAGES.includes(language);

  // Get translations synchronously from pre-loaded map
  const translations = translationsMap[language] || translationsMap.en;

  const setLanguage = useCallback(
    (lang: LanguageType) => {
      setLanguageState(lang);
      document.cookie = `app_locale=${lang}; path=/; max-age=31536000`; // 1 year
      router.visit(window.location.pathname + window.location.search, { preserveScroll: true });
    },
    [setLanguageState]
  );

  const t = useCallback(
    (key: string): string => {
      return getNestedValue(translations, key);
    },
    [translations]
  );

  const value = useMemo(
    () => ({
      language,
      translations,
      setLanguage,
      t,
      isRTL,
    }),
    [language, translations, setLanguage, t, isRTL]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;
