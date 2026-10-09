import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef, type ReactNode } from 'react';
import { type SupportedReportLanguage, SUPPORTED_REPORT_LANGUAGES } from '../types';
import { translate, loadLocale, isLocaleLoaded } from '../i18n';

export const LANGUAGE_STORAGE_KEY = 'metrcheck_report_language';

interface LanguageContextType {
  selectedLanguage: string;
  setLanguage: (langCode: string) => void;
  currentLanguage: SupportedReportLanguage;
  supportedLanguages: SupportedReportLanguage[];
  t: (key: string, params?: Record<string, string | number>) => string;
  isLanguageLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [selectedLanguage, setSelectedLanguageState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && SUPPORTED_REPORT_LANGUAGES.some(l => l.code === saved)) {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'en';
  });

  const [loadedVersion, setLoadedVersion] = useState(0);
  const [isLanguageLoading, setIsLanguageLoading] = useState(false);
  const activeRequestIdRef = useRef(0);

  const setLanguage = useCallback((langCode: string) => {
    const valid = SUPPORTED_REPORT_LANGUAGES.some(l => l.code === langCode);
    const target = valid ? langCode : 'en';
    setSelectedLanguageState(target);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, target);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLanguage);
    } catch {
      // Ignore
    }

    if (selectedLanguage === 'en' || isLocaleLoaded(selectedLanguage)) {
      setIsLanguageLoading(false);
      return;
    }

    const currentRequestId = ++activeRequestIdRef.current;
    setIsLanguageLoading(true);

    loadLocale(selectedLanguage).then(() => {
      // Prevent stale slower request from overwriting a newer language selection
      if (currentRequestId === activeRequestIdRef.current) {
        setIsLanguageLoading(false);
        setLoadedVersion(v => v + 1);
      }
    });
  }, [selectedLanguage]);

  const currentLanguage = useMemo(() => {
    return SUPPORTED_REPORT_LANGUAGES.find(l => l.code === selectedLanguage) || SUPPORTED_REPORT_LANGUAGES[0];
  }, [selectedLanguage]);

  // t is memoized against selectedLanguage AND loadedVersion so components re-render when dictionary arrives
  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    return translate(selectedLanguage, key, params);
  }, [selectedLanguage, loadedVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LanguageContext.Provider
      value={{
        selectedLanguage,
        setLanguage,
        currentLanguage,
        supportedLanguages: SUPPORTED_REPORT_LANGUAGES,
        t,
        isLanguageLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

