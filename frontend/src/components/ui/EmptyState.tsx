import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  actionLabel, 
  onAction, 
  className = '' 
}: Props) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#101A2C] rounded-2xl border border-dashed border-slate-200 dark:border-white/10 shadow-2xs ${className}`}>
      <div className="w-14 h-14 bg-[#173B57]/10 dark:bg-[#173B57]/50 border border-[#173B57]/20 dark:border-[#35C6B0]/30 rounded-2xl flex items-center justify-center mb-4 shadow-2xs">
        <Icon className="w-7 h-7 text-[#173B57] dark:text-[#35C6B0]" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1.5">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6">{description}</p>
      {action ? (
        action
      ) : actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-[#173B57] hover:bg-[#101A2C] dark:bg-[#35C6B0] dark:hover:bg-[#2db39f] text-white dark:text-slate-950 px-5 py-2.5 rounded-xl font-semibold text-xs shadow-2xs transition-all cursor-pointer"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

