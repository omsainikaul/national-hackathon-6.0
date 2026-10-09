import React from 'react';
import {
  BadgeCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Database,
  ShieldCheck,
  Layers
} from 'lucide-react';
import {
  type FSSAIVerificationResult,
  type GS1VerificationResult,
  type ExternalVerificationSummary,
  type CrossCheckFieldResult
} from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface ExternalVerificationProps {
  fssaiVerification?: FSSAIVerificationResult | null;
  gs1Verification?: GS1VerificationResult | null;
  fssaiLicense?: string | null;
  externalVerification?: ExternalVerificationSummary | null;
}

const VerificationCard: React.FC<{
  title: string;
  value: string;
  isValid: boolean;
  statusText?: string;
  message: string;
  provider: string;
  type: 'LIVE' | 'CACHE' | 'FORMAT';
}> = ({ title, value, isValid, statusText, message, provider, type }) => {
  const { t } = useLanguage();
  return (
    <div className="bg-slate-50/80 dark:bg-white/[0.02] rounded-xl p-4 border border-slate-100 dark:border-white/5 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</div>
            <div className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</div>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
            isValid ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
          }`}>
            {isValid ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {statusText || (isValid ? t('verification.status_valid', { defaultValue: 'VALID' }) : t('verification.status_invalid', { defaultValue: 'INVALID' }))}
          </div>
        </div>
        
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
          {message}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-200/60 dark:border-white/5">
        <span>{provider}</span>
        <span className={
          type === 'LIVE' ? 'text-emerald-600 dark:text-emerald-400 font-bold' :
          type === 'CACHE' ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'
        }>
          {type === 'LIVE' ? t('verification.type_live', { defaultValue: 'LIVE REGISTRY' }) : 
           type === 'CACHE' ? t('verification.type_cache', { defaultValue: 'PERSISTENT CACHE' }) : 
           t('verification.type_format', { defaultValue: 'FORMAT & CHECKSUM' })}
        </span>
      </div>
    </div>
  );
};

const CrossCheckRow: React.FC<{ item: CrossCheckFieldResult }> = ({ item }) => {
  const { t } = useLanguage();
  const getStatusBadge = () => {
    switch (item.status) {
      case 'MATCH':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"><CheckCircle className="w-3 h-3" /> {t('verification.status_match', { defaultValue: 'MATCH' })}</span>;
      case 'PARTIAL_MATCH':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"><AlertTriangle className="w-3 h-3" /> {t('verification.status_partial', { defaultValue: 'PARTIAL' })}</span>;
      case 'MISMATCH':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"><XCircle className="w-3 h-3" /> {t('verification.status_mismatch', { defaultValue: 'MISMATCH' })}</span>;
      case 'UNVERIFIED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-300 border-slate-200 dark:border-white/10"><HelpCircle className="w-3 h-3" /> {t('verification.status_unverified', { defaultValue: 'UNVERIFIED' })}</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-400">N/A</span>;
    }
  };

  return (
    <tr className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
      <td className="py-3 px-3.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
        {item.check_type.replace(/_/g, ' ')}
      </td>
      <td className="py-3 px-3.5 text-xs text-slate-600 dark:text-slate-300 font-mono">
        {item.extracted_value || <span className="text-slate-400 italic">None</span>}
      </td>
      <td className="py-3 px-3.5 text-xs text-slate-600 dark:text-slate-300 font-mono">
        {item.registry_value || <span className="text-slate-400 italic">—</span>}
      </td>
      <td className="py-3 px-3.5 text-center">
        {getStatusBadge()}
      </td>
      <td className="py-3 px-3.5 text-xs text-slate-500 dark:text-slate-400">
        {item.discrepancy_details || 'Verified consistent.'}
      </td>
    </tr>
  );
};

const ExternalVerification: React.FC<ExternalVerificationProps> = ({
  fssaiVerification,
  gs1Verification,
  fssaiLicense,
  externalVerification
}) => {
  const { t } = useLanguage();
  if (!fssaiVerification && !gs1Verification && !fssaiLicense && !externalVerification) return null;

  const fssai = externalVerification?.fssai_verification || fssaiVerification;
  const gs1 = externalVerification?.gs1_verification || gs1Verification;

  const fssaiNumber = fssai?.licence_number || fssaiLicense || t('verification.not_detected', { defaultValue: 'Not detected' });
  const fssaiValid = fssai ? fssai.status === 'VERIFIED' : (fssaiLicense ? fssaiLicense.length === 14 : false);
  const fssaiMsg = fssai?.message || (fssaiLicense && fssaiLicense.length === 14 ? t('verification.format_verified_14_digits', { defaultValue: 'Format verified (14 digits)' }) : t('verification.licence_format_invalid', { defaultValue: 'Licence format invalid' }));
  const fssaiProvider = fssai?.provider || 'FoSCoS Public Registry API';
  const fssaiType = fssai?.is_live ? 'LIVE' : (fssai?.provider?.includes('Cache') ? 'CACHE' : 'FORMAT');

  const gs1Gtin = gs1?.gtin || externalVerification?.barcode_detected || t('verification.not_detected', { defaultValue: 'Not detected' });
  const gs1Valid = gs1 ? gs1.status === 'VERIFIED' : false;
  const gs1Msg = gs1?.message || t('verification.barcode_checksum_check', { defaultValue: 'Barcode checksum check' });
  const gs1Provider = gs1?.provider || 'GS1 India DataKart';
  const gs1Type = gs1?.is_live ? 'LIVE' : (gs1?.provider?.includes('Cache') ? 'CACHE' : 'FORMAT');

  const confidence = externalVerification?.confidence;
  const crossChecks = externalVerification?.cross_checks || [];

  return (
    <div id="section-external-verification" className="bg-white dark:bg-[#101A2C] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs mb-6 overflow-hidden">
      <div className="bg-slate-50/80 dark:bg-white/[0.02] p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 text-teal-600 dark:text-teal-400">
            <BadgeCheck className="w-4 h-4" />
          </div>
          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider">
            {t('verification.title', { defaultValue: 'EXTERNAL REGISTRY VERIFICATION & CROSS-CHECKING' })}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40">
            {t('verification.sec13', { defaultValue: 'SEC 13' })}
          </span>
        </div>

        {confidence && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">{t('verification.confidence_tier', { defaultValue: 'Confidence Tier:' })}</span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
              confidence.tier === 'HIGH' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' :
              confidence.tier === 'MEDIUM' ? 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20' :
              'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
            }`}>
              {confidence.tier} ({Math.round(confidence.score * 100)}%)
            </span>
          </div>
        )}
      </div>

      {/* Registry Cards */}
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {(fssaiLicense || fssai) && (
          <VerificationCard
            title={t('verification.fssai_registry', { defaultValue: 'FSSAI / FoSCoS Registry' })}
            value={fssaiNumber}
            isValid={fssaiValid}
            statusText={fssai?.status ? (fssai.status === 'VERIFIED' ? t('verification.status_valid', { defaultValue: 'VALID' }) : fssai.status) : (fssaiValid ? t('verification.status_valid', { defaultValue: 'VALID' }) : t('verification.status_invalid', { defaultValue: 'INVALID' }))}
            message={fssaiMsg}
            provider={fssaiProvider}
            type={fssaiType}
          />
        )}
        
        {(gs1 || externalVerification?.barcode_detected) && (
          <VerificationCard
            title={t('verification.gs1_registry', { defaultValue: 'GS1 DataKart / GTIN' })}
            value={gs1Gtin}
            isValid={gs1Valid}
            statusText={gs1?.status ? (gs1.status === 'VERIFIED' ? t('verification.status_valid', { defaultValue: 'VALID' }) : gs1.status) : (gs1Valid ? t('verification.status_valid', { defaultValue: 'VALID' }) : t('verification.status_checked', { defaultValue: 'CHECKED' }))}
            message={gs1Msg}
            provider={gs1Provider}
            type={gs1Type}
          />
        )}
      </div>

      {/* Cross-Checking Consistency Matrix */}
      {crossChecks.length > 0 && (
        <div className="p-4 sm:p-5 pt-0">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            {t('verification.matrix_title', { defaultValue: 'Statutory Cross-Checking Consistency Matrix' })}
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-white/10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-white/[0.04] text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200/80 dark:border-white/10">
                  <th className="py-2.5 px-3.5">{t('verification.col_target', { defaultValue: 'Cross-Check Target' })}</th>
                  <th className="py-2.5 px-3.5">{t('verification.col_extracted', { defaultValue: 'Extracted on Label' })}</th>
                  <th className="py-2.5 px-3.5">{t('verification.col_registry', { defaultValue: 'Registry / QR Record' })}</th>
                  <th className="py-2.5 px-3.5 text-center">{t('verification.col_status', { defaultValue: 'Status' })}</th>
                  <th className="py-2.5 px-3.5">{t('verification.col_findings', { defaultValue: 'Findings & Provenance' })}</th>
                </tr>
              </thead>
              <tbody>
                {crossChecks.map((cc, idx) => (
                  <CrossCheckRow key={idx} item={cc} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Offline & API Connectivity Banner */}
      <div className="bg-slate-50/80 dark:bg-white/[0.01] px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            {t('verification.wal_cache_active', { defaultValue: 'SQLite Persistent WAL Cache Active' })}
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {t('verification.air_gap_ready', { defaultValue: 'Offline Air-Gap Verification Ready' })}
          </span>
        </div>
        {externalVerification?.summary_verdict && (
          <span className="italic text-slate-600 dark:text-slate-300 truncate max-w-md">
            {externalVerification.summary_verdict}
          </span>
        )}
      </div>
    </div>
  );
};

export default ExternalVerification;


