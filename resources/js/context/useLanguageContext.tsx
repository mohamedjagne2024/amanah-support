import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocalStorage } from 'usehooks-ts';

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

  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);

  const isRTL = RTL_LANGUAGES.includes(language);

  // Load translations based on selected language
  useEffect(() => {
    setIsLoading(true);
    import(`../locales/${language}.json`)
      .then((module) => {
        setTranslations(module.default);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(`Failed to load translations for ${language}:`, error);
        // Fallback to English if language file doesn't exist
        import(`../locales/en.json`)
          .then((module) => {
            setTranslations(module.default);
            setIsLoading(false);
          });
      });
  }, [language]);

  const setLanguage = useCallback(
    (lang: LanguageType) => {
      setLanguageState(lang);
    },
    [setLanguageState]
  );

  const t = useCallback(
    (key: string): string => {
      if (isLoading || !translations) {
        return key;
      }
      return getNestedValue(translations, key);
    },
    [translations, isLoading]
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

