/**
 * Shared top utility bar + bottom footer — used on every page for visual consistency.
 * The main header of each page (with nav/user info) is still owned by that page component.
 */
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from './LanguageToggle';
import { LogoGroup } from './logo';
import { Globe2 } from 'lucide-react';

interface PageShellProps {
  children: React.ReactNode;
  /** Extra content rendered inside the top utility bar (right side) */
  topBarRight?: React.ReactNode;
  showFooter?: boolean;
}

export function TopBar({ extra }: { extra?: React.ReactNode }) {
  const { lang, t } = useLanguage();
  return (
    <div className="bg-[#0D1130] border-b border-white/10 z-30">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[11px] text-white/40">
          <span className="hidden sm:flex items-center gap-1.5">
            <Globe2 className="w-3 h-3" />
            imamu.edu.sa
          </span>
          <span className="hidden sm:block opacity-20">|</span>
          <span className="hidden sm:block">
            {new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {extra}
          <LanguageToggle variant="light" />
        </div>
      </div>
    </div>
  );
}

export function PageFooter() {
  const { t } = useLanguage();
  return (
    <footer className="bg-[#0D1130] border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LogoGroup variant="bare" uniSize="h-8" projSize="h-6" />
          <div>
            <p className="text-white/80 text-xs font-bold">Imamu TechVerse</p>
            <p className="text-white/30 text-[10px]">
              {t('جامعة الإمام محمد بن سعود الإسلامية', 'Imam Mohammad Ibn Saud Islamic University')}
            </p>
          </div>
        </div>
        <p className="text-white/20 text-[11px]">
          {t('جميع الحقوق محفوظة', 'All Rights Reserved')} © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
