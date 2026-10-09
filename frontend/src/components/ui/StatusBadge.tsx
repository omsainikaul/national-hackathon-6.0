import { CheckCircle2, AlertTriangle, XCircle, MinusCircle, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  status?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export default function StatusBadge({ status, size = 'md', showIcon = true, className = '' }: Props) {
  const { t } = useLanguage();
  const rawStatus = (status || 'UNKNOWN').toUpperCase().replace(/-/g, '_');
  
  let colorClass = 'bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 font-medium';
  let displayText = rawStatus.replace(/_/g, ' ');
  let Icon = HelpCircle;

  if (rawStatus === 'COMPLIANT' || rawStatus === 'PASS') {
    colorClass = 'bg-teal-50 dark:bg-[#35C6B0]/15 text-teal-800 dark:text-[#5EEAD4] border-teal-200/80 dark:border-[#35C6B0]/30 font-semibold';
    displayText = rawStatus === 'COMPLIANT' ? t('status.compliant') : t('status.pass');
    Icon = CheckCircle2;
  } else if (rawStatus === 'REVIEW_REQUIRED' || rawStatus === 'NEEDS_REVIEW') {
    colorClass = 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/60 font-semibold';
    displayText = rawStatus === 'REVIEW_REQUIRED' ? t('status.review_required') : t('status.needs_review');
    Icon = AlertTriangle;
  } else if (rawStatus === 'WARNING') {
    colorClass = 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/60 font-semibold';
    displayText = t('status.warning');
    Icon = AlertTriangle;
  } else if (rawStatus === 'NOT_APPLICABLE' || rawStatus === 'N/A') {
    colorClass = 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 font-medium';
    displayText = t('status.na');
    Icon = MinusCircle;
  } else if (rawStatus.includes('NON_COMPLIANCE') || rawStatus === 'FAIL') {
    colorClass = 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60 font-semibold';
    displayText = rawStatus === 'FAIL' ? t('status.fail') : t('status.non_compliant');
    Icon = XCircle;
  }

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-0.5',
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm gap-2'
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <span className={`inline-flex items-center rounded-full border shadow-2xs transition-colors select-none ${sizeClasses[size]} ${colorClass} ${className}`}>
      {showIcon && <Icon className={`${iconSizes[size]} shrink-0`} />}
      <span>{displayText}</span>
    </span>
  );
}
