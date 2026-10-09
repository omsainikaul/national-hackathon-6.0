import React, { useState } from 'react';
import { Eye, ChevronDown } from 'lucide-react';
import { type ProductInfo } from '../../types';
import ConfidenceBar from '../ui/ConfidenceBar';
import { useLanguage } from '../../context/LanguageContext';

interface ConfidencePanelProps {
  productInfo: ProductInfo;
}

const ConfidencePanel: React.FC<ConfidencePanelProps> = ({ productInfo = {} as any }) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const info = productInfo || ({} as any);

  // Extract from declaration_confidences or find field confidences
  const confidences = info.declaration_confidences || {};
  let confidenceData = Object.entries(confidences)
    .map(([key, score]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: typeof score === 'number' ? score : 0,
    }))
    .filter(item => typeof item.value === 'number')
    .sort((a, b) => b.value - a.value);

  if (confidenceData.length === 0) {
    // Fallback: search keys ending with _confidence if any
    confidenceData = Object.entries(info)
      .filter(([key]) => key.endsWith('_confidence'))
      .map(([key, value]) => {
        const fieldKey = key.replace('_confidence', '');
        return {
          label: fieldKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: typeof value === 'number' ? value : 0,
        };
      })
      .filter(item => typeof item.value === 'number')
      .sort((a, b) => b.value - a.value);
  }

  if (confidenceData.length === 0) return null;

  const topFields = confidenceData.slice(0, 8);
  const remainingFields = confidenceData.slice(8);

  return (
    <div className="bg-white dark:bg-[#101A2C] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs mb-6 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50/80 dark:bg-white/[0.02] p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 text-teal-600 dark:text-teal-400">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              {t('results.data_confidence')}
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {t('results.subtitle')}
            </span>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-600 dark:text-slate-300 font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10">
          {confidenceData.length}
        </span>
      </div>

      {/* Grid: 4 cols on desktop, 2 on tablet, 1 on mobile */}
      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {topFields.map((item) => (
          <ConfidenceBar key={item.label} value={item.value} label={item.label} />
        ))}
      </div>

      {/* Detailed fields toggle */}
      {remainingFields.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-full border-t border-slate-100 dark:border-white/10 p-3 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none"
            aria-expanded={expanded}
          >
            <span>{expanded ? t('results.hide_confidence_details') : t('results.show_confidence_details')}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
          
          {expanded && (
            <div className="p-4 sm:p-5 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 border-t border-slate-100 dark:border-white/10 bg-slate-50/30 dark:bg-white/[0.01]">
              {remainingFields.map((item) => (
                <ConfidenceBar key={item.label} value={item.value} label={item.label} />
              ))}
            </div>
          )}
        </>
      )}

      <div className="p-3.5 bg-slate-50/50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/10 text-[11px] text-center text-slate-500 dark:text-slate-400">
        {t('results.confidence_footer_note')}
      </div>
    </div>
  );
};

export default ConfidencePanel;

