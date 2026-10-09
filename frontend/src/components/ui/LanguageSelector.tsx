import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface LanguageSelectorProps {
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = true }) => {
  const { selectedLanguage, setLanguage, currentLanguage, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-[#101A2C] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#173B57]/50 hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer shadow-2xs"
        aria-label="Select report language"
        aria-expanded={isOpen}
        title="Select Report Output Language"
      >
        <Globe className="w-3.5 h-3.5 text-[#173B57] dark:text-[#35C6B0] shrink-0" />
        <span className={compact ? 'hidden sm:inline font-semibold' : 'font-semibold'}>
          {currentLanguage.native}
        </span>
        <span className={compact ? 'sm:hidden font-semibold' : 'hidden'}>
          {currentLanguage.code.toUpperCase()}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/20 dark:bg-slate-950/60 backdrop-blur-[0.5px]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#101A2C] border border-slate-200 dark:border-white/10 shadow-2xl p-2 z-50 ring-1 ring-black/5 animate-in fade-in duration-150">
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#173B57] dark:text-[#35C6B0]" />
                Report Language
              </span>
              <span className="text-[9px] bg-[#173B57]/10 dark:bg-[#173B57]/80 text-[#173B57] dark:text-[#5EEAD4] font-bold px-1.5 py-0.5 rounded border border-[#173B57]/20 dark:border-[#35C6B0]/30">
                10 Languages
              </span>
            </div>

            <div className="py-1 max-h-72 overflow-y-auto space-y-0.5">
              {supportedLanguages.map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#173B57]/10 dark:bg-[#173B57]/70 text-[#173B57] dark:text-white font-bold border border-[#173B57]/20 dark:border-[#35C6B0]/40'
                        : 'hover:bg-slate-100 dark:hover:bg-[#173B57]/40 text-slate-700 dark:text-slate-300 font-medium border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{lang.native}</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        ({lang.label})
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#173B57] dark:text-[#35C6B0] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
