import React, { useState } from 'react';
import { ListChecks, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { type Recommendation } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface ActionQueueProps {
  recommendations: Recommendation[];
  passedRecs: Recommendation[];
  onViewEvidence: (ruleId: string, imageLabel?: string | null) => void;
  onNavigateAnalyze: () => void;
}

const ActionRow: React.FC<{ rec: Recommendation, onViewEvidence: (r: string) => void }> = ({ rec, onViewEvidence }) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const isHigh = rec.priority === 'HIGH';

  return (
    <div className="border-b border-slate-100 dark:border-white/5 last:border-0">
      <div 
        className="p-3.5 sm:p-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer flex items-center gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`shrink-0 w-1.5 h-7 rounded-full ${isHigh ? 'bg-rose-500' : 'bg-amber-500'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${
              isHigh 
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40' 
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40'
            }`}>
              {rec.priority}
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
              {rec.issue}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
            {rec.recommended_action}
          </div>
        </div>
        <div className="shrink-0 text-slate-400 dark:text-slate-500">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 bg-slate-50/60 dark:bg-white/[0.02] text-sm border-t border-slate-100/60 dark:border-white/5">
          <div className="grid gap-3 pl-4 sm:pl-5">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-xs">{t('results.action')}</span>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">{rec.corrective_action || rec.recommended_action}</p>
            </div>
            {rec.verification_step && (
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-xs">{t('results.verified')}</span>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">{rec.verification_step}</p>
              </div>
            )}
            {rec.source_reference && (
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-xs">{t('results.legal_basis')}</span>
                <a href={rec.source_url || undefined} target="_blank" rel="noreferrer" className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline text-xs">
                  {rec.source_reference}
                </a>
              </div>
            )}
            <div className="mt-1">
               <button
                onClick={(e) => { e.stopPropagation(); onViewEvidence(rec.rule_id); }}
                className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold hover:underline text-xs cursor-pointer"
              >
                {t('results.inspect_associated_evidence')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ActionQueue: React.FC<ActionQueueProps> = ({
  recommendations,
  passedRecs,
  onViewEvidence,
}) => {
  const { t } = useLanguage();
  const actionable = recommendations.filter(r => r.status !== 'PASS');
  const [showPassed, setShowPassed] = useState(false);

  return (
    <div className="bg-white dark:bg-[#101A2C] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs mb-6 overflow-hidden">
      <div className="bg-slate-50/80 dark:bg-white/[0.02] p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold uppercase tracking-wider text-xs sm:text-sm">
          <ListChecks className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          {t('results.action_queue')}
        </div>
        <div className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-white/[0.08] dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
          {actionable.length === 1 ? t('results.actions_count_single', { count: 1 }) : t('results.actions_count_multiple', { count: actionable.length })}
        </div>
      </div>

      {actionable.length === 0 ? (
        <div className="p-6 text-center text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-2 bg-emerald-50/40 dark:bg-emerald-950/20">
          <CheckCircle className="w-5 h-5" />
          {t('results.no_corrective_actions')}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {actionable.map(rec => (
            <ActionRow key={rec.rule_id} rec={rec} onViewEvidence={onViewEvidence} />
          ))}
        </div>
      )}

      {passedRecs.length > 0 && (
        <div className="border-t border-slate-100 dark:border-white/10">
          <button
            onClick={() => setShowPassed(!showPassed)}
            className="w-full p-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              {t('results.passed_and_verified', { count: passedRecs.length })}
            </span>
            {showPassed ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          
          {showPassed && (
            <div className="bg-slate-50/50 dark:bg-white/[0.02] p-4 text-xs text-slate-500 dark:text-slate-400 grid gap-2 border-t border-slate-100/60 dark:border-white/5">
              {passedRecs.map(rec => (
                <div key={rec.rule_id} className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-white/10">{rec.rule_id}</span>
                  <span className="truncate">{rec.issue}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionQueue;
