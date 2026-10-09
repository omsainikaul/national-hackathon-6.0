import { type ReactNode, useState } from 'react';
import { type LucideIcon, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  id?: string;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  action?: ReactNode;
  compact?: boolean;
  collapsible?: boolean;
}

export default function Card({ 
  id,
  title, 
  subtitle,
  icon: Icon, 
  iconColor = 'text-indigo-600',
  children, 
  className = '', 
  bodyClassName,
  action,
  compact = false,
  collapsible = false
}: Props) {
  const [isOpen, setIsOpen] = useState(true);

  const headerPadding = compact ? 'px-4 py-2.5' : 'px-6 py-4';
  const resolvedBodyClassName = bodyClassName !== undefined ? bodyClassName : (compact ? 'p-4' : 'p-6');

  return (
    <div id={id} className={`bg-white dark:bg-[#101A2C] rounded-2xl shadow-2xs border border-slate-200/90 dark:border-white/10 overflow-hidden transition-all duration-200 ${className}`}>
      {(title || Icon || action || collapsible) && (
        <div 
          className={`${headerPadding} border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#173B57]/20 ${collapsible ? 'cursor-pointer hover:bg-slate-100/70 dark:hover:bg-[#173B57]/40 transition-colors' : ''}`}
          onClick={() => collapsible && setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-xl bg-white dark:bg-[#101A2C] border border-slate-200/80 dark:border-white/10 shadow-2xs">
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
            )}
            <div>
              {title && <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {action && (
              <div onClick={(e) => collapsible && e.stopPropagation()}>
                {action}
              </div>
            )}
            {collapsible && (
              <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors">
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            )}
          </div>
        </div>
      )}
      {(!collapsible || isOpen) && (
        <div className={resolvedBodyClassName}>
          {children}
        </div>
      )}
    </div>
  );
}
