import { useLanguage } from '../context/LanguageContext';

interface LanguageToggleProps {
  /** 'light' = for dark backgrounds (white text), 'dark' = for light backgrounds */
  variant?: 'light' | 'dark';
  className?: string;
}

export function LanguageToggle({ variant = 'light', className = '' }: LanguageToggleProps) {
  const { lang, toggleLang } = useLanguage();

  const base = variant === 'light'
    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
    : 'bg-muted hover:bg-muted/80 text-foreground border border-border';

  return (
    <button
      onClick={toggleLang}
      title={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${base} ${className}`}
    >
      <span className={lang === 'ar' ? 'opacity-100' : 'opacity-45'}>ع</span>
      <span className="opacity-30 mx-0.5">|</span>
      <span className={lang === 'en' ? 'opacity-100' : 'opacity-45'}>EN</span>
    </button>
  );
}
