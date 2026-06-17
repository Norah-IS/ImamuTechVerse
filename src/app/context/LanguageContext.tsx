import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Lang = 'ar' | 'en';

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  /** Inline translation helper: t('عربي', 'English') */
  t: (ar: string, en: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ar',
  toggleLang: () => {},
  t: (ar) => ar,
  dir: 'rtl',
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() =>
    (localStorage.getItem('imamu_lang') as Lang | null) ?? 'ar'
  );

  useEffect(() => {
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const toggleLang = () =>
    setLang((prev) => {
      const next: Lang = prev === 'ar' ? 'en' : 'ar';
      localStorage.setItem('imamu_lang', next);
      return next;
    });

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, dir: lang === 'ar' ? 'rtl' : 'ltr' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
