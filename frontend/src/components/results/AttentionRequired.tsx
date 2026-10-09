import React from 'react';
import { AlertTriangle, AlertCircle, Search } from 'lucide-react';
import { type ComplianceCheck } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface AttentionRequiredProps {
  failedChecks: ComplianceCheck[];
  reviewChecks: ComplianceCheck[];
  onViewEvidence: (ruleId: string, imageLabel?: string | null) => void;
}

const AttentionRequired: React.FC<AttentionRequiredProps> = ({
  failedChecks,
  reviewChecks,
  onViewEvidence,
}) => {
  const { t } = useLanguage();

  if (failedChecks.length === 0 && reviewChecks.length === 0) {
    return null;
  }

  const items = [
    ...failedChecks.map(c => ({ ...c, isFail: true })),
    ...reviewChecks.map(c => ({ ...c, isFail: false }))
  ];

  return (
    <div className="bg-white dark:bg-[#101A2C] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs mb-6 overflow-hidden">
      <div className="bg-slate-50/80 dark:bg-white/[0.02] p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold uppercase tracking-wider text-xs sm:text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          {t('results.attention_required')}
        </div>
        <div className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
          {items.length === 1 ? t('results.issues_count_single', { count: 1 }) : t('results.issues_count_multiple', { count: items.length })}
        </div>
      </div>
      
      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {items.map((check) => (
          <div key={check.rule_id} className="p-3.5 sm:p-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 flex items-start gap-3">
              {check.isFail ? (
                <div className="p-1 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mt-0.5 border border-rose-200/50 dark:border-rose-800/40">
                  <AlertCircle className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-1 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 mt-0.5 border border-amber-200/50 dark:border-amber-800/40">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    {check.field_label && check.field_label.length > 2 ? check.field_label : (check.field || check.rule_id)}
                  </span>
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-white/10">
                    {check.rule_id}
                  </span>
                  {check.detected_value && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('results.detected_value')}: <strong className="text-slate-700 dark:text-slate-200">{check.detected_value}</strong>
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 sm:line-clamp-1">
                  {check.explanation || 'Manual verification recommended for this declaration.'}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => onViewEvidence(check.rule_id, check.evidence_image_label)}
              className="self-start sm:self-center shrink-0 flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-200 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100/80 dark:hover:bg-teal-900/50 px-3 py-1.5 rounded-lg border border-teal-200/60 dark:border-teal-800/60 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              {t('results.inspect_evidence')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttentionRequired;
