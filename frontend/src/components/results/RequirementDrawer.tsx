import React from 'react';
import { ExternalLink, Search, Shield } from 'lucide-react';
import { type ComplianceCheck } from '../../types';
import Drawer from '../ui/Drawer';
import StatusBadge from '../ui/StatusBadge';
import ConfidenceBar from '../ui/ConfidenceBar';
import { useLanguage } from '../../context/LanguageContext';

interface RequirementDrawerProps {
  check: ComplianceCheck | null;
  onClose: () => void;
  onViewEvidence: (ruleId: string, imageLabel?: string | null) => void;
}

const RequirementDrawer: React.FC<RequirementDrawerProps> = ({
  check,
  onClose,
  onViewEvidence,
}) => {
  const { t } = useLanguage();

  return (
    <Drawer open={check !== null} onClose={onClose} title={t('results.requirement_details')}>
      {check && (
        <div className="flex flex-col h-full">
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div>
              <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                <span className="font-mono text-xs bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-200/80 dark:border-white/10 font-bold">
                  {check.rule_id}
                </span>
                <StatusBadge status={check.status} size="lg" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {check.field_label && check.field_label.length > 2 ? check.field_label : (check.field || check.rule_id)}
              </h3>
            </div>

            <section>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">{t('results.detected_value')}</h4>
              <div className="p-4 bg-slate-50/90 dark:bg-white/[0.03] rounded-xl border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium break-words shadow-2xs">
                {check.detected_value || <span className="italic text-slate-400 dark:text-slate-500">{t('results.not_reliably_detected')}</span>}
              </div>
            </section>

            {check.explanation && (
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">{t('results.analysis_explanation')}</h4>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {check.explanation}
                </p>
              </section>
            )}

            {check.confidence !== undefined && check.confidence !== null && (
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">{t('results.detection_confidence')}</h4>
                <ConfidenceBar value={check.confidence} label={t('results.confidence')} />
              </section>
            )}

            <section>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">{t('results.legal_basis')}</h4>
              <div className="bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-800/40 rounded-xl p-4 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-teal-100/80 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-teal-950 dark:text-teal-200 text-sm">
                      {check.source_name || 'Legal Metrology Rules'}
                    </div>
                    <div className="text-teal-800/90 dark:text-teal-400 text-xs mt-1 leading-relaxed">
                      {check.source_reference}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="p-5 border-t border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-[#101A2C] flex flex-col gap-2.5">
            <button
              onClick={() => {
                onClose();
                onViewEvidence(check.rule_id, check.evidence_image_label);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#173B57] hover:bg-[#101A2C] dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-[#101A2C] rounded-xl font-semibold shadow-xs transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              <Search className="w-4 h-4" />
              {t('results.inspect_evidence')}
            </button>
            {check.source_url && (
              <a
                href={check.source_url}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-slate-400"
              >
                <ExternalLink className="w-4 h-4" />
                {t('results.view_legal_source')}
              </a>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default RequirementDrawer;
