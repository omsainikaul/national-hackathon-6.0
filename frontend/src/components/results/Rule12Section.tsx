import React, { useState } from 'react';
import { Ruler, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';
import { type FontSizeAnalysis, type CalibrationResult } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface Rule12SectionProps {
  fontSizeAnalysis: FontSizeAnalysis | undefined;
  calibrationResult: CalibrationResult | null | undefined;
}

const Rule12Section: React.FC<Rule12SectionProps> = ({ fontSizeAnalysis, calibrationResult }) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  if (!fontSizeAnalysis) return null;

  const isEstimated = !calibrationResult || calibrationResult.status !== 'PHYSICAL_MEASUREMENT_VERIFIED';

  return (
    <div className="bg-white dark:bg-[#101A2C] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs mb-6 overflow-hidden">
      <div className="bg-slate-50/80 dark:bg-white/[0.02] p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold uppercase tracking-wider text-xs sm:text-sm">
          <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 text-teal-600 dark:text-teal-400">
            <Ruler className="w-4 h-4" />
          </div>
          {t('results.rule12_readability')}
        </div>
        <div className={`px-2.5 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 ${
          isEstimated 
            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' 
            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
        }`}>
          {isEstimated ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
          {isEstimated ? t('results.estimated_measurement') : t('results.calibrated')}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {isEstimated && (
          <div className="mb-4 text-xs text-amber-800 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span className="leading-relaxed">{t('results.no_marker_note')}</span>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50/80 dark:bg-white/[0.02] p-3 sm:p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1 tracking-wider">{t('results.net_qty_height')}</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {fontSizeAnalysis.net_quantity_font_height_mm ? `${fontSizeAnalysis.net_quantity_font_height_mm.toFixed(1)} mm` : 'N/A'}
            </div>
          </div>
          <div className="bg-slate-50/80 dark:bg-white/[0.02] p-3 sm:p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1 tracking-wider">{t('results.required_height')}</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {fontSizeAnalysis.min_required_font_height_mm ? `${fontSizeAnalysis.min_required_font_height_mm.toFixed(1)} mm` : 'N/A'}
            </div>
          </div>
          <div className="bg-slate-50/80 dark:bg-white/[0.02] p-3 sm:p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1 tracking-wider">{t('results.mrp_height')}</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {fontSizeAnalysis.mrp_font_height_mm ? `${fontSizeAnalysis.mrp_font_height_mm.toFixed(1)} mm` : 'N/A'}
            </div>
          </div>
          <div className="bg-slate-50/80 dark:bg-white/[0.02] p-3 sm:p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1 tracking-wider">{t('results.readability')}</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {fontSizeAnalysis.readability_score !== null && fontSizeAnalysis.readability_score !== undefined
                ? `${fontSizeAnalysis.readability_score.toFixed(1)} / 100` 
                : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full border-t border-slate-100 dark:border-white/10 p-3 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none"
      >
        {expanded ? (
          <><ChevronUp className="w-4 h-4" /> {t('results.hide_technical_details')}</>
        ) : (
          <><ChevronDown className="w-4 h-4" /> {t('results.show_technical_details')}</>
        )}
      </button>

      {expanded && (
        <div className="p-4 sm:p-5 bg-slate-50/40 dark:bg-white/[0.01] text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-white/10 grid gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div><span className="font-semibold text-slate-900 dark:text-slate-200">{t('results.pixels_per_mm')}:</span> {fontSizeAnalysis.pixels_per_mm?.toFixed(2) || 'N/A'}</div>
            <div><span className="font-semibold text-slate-900 dark:text-slate-200">{t('results.verdict')}:</span> {fontSizeAnalysis.rule_12_verdict}</div>
          </div>
          {calibrationResult && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div><span className="font-semibold text-slate-900 dark:text-slate-200">{t('dashboard.table.status')}:</span> {calibrationResult.status}</div>
              <div><span className="font-semibold text-slate-900 dark:text-slate-200">Target:</span> {calibrationResult.target_type || 'None'}</div>
            </div>
          )}
          {fontSizeAnalysis.details && (
            <div className="p-2.5 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
              <span className="font-semibold text-slate-900 dark:text-slate-200 block mb-1">Details:</span>
              <p className="leading-relaxed">{fontSizeAnalysis.details}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Rule12Section;
