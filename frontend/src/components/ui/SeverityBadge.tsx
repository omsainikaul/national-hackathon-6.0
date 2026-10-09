interface Props {
  severity?: 'high' | 'medium' | 'low' | string | null;
  className?: string;
}

export default function SeverityBadge({ severity, className = '' }: Props) {
  const norm = (severity || 'medium').toLowerCase();
  
  let colorClass = 'bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10';
  let dotColor = 'bg-slate-400 dark:bg-slate-500';
  
  if (norm === 'high') {
    colorClass = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60 font-bold';
    dotColor = 'bg-rose-500 dark:bg-rose-400';
  } else if (norm === 'medium') {
    colorClass = 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60 font-semibold';
    dotColor = 'bg-amber-500 dark:bg-amber-400';
  } else if (norm === 'low') {
    colorClass = 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60 font-medium';
    dotColor = 'bg-sky-500 dark:bg-sky-400';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border shadow-2xs select-none ${colorClass} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      <span>{norm}</span>
    </span>
  );
}
