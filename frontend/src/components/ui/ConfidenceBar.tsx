interface Props {
  label: string;
  value: number;
  className?: string;
}

export default function ConfidenceBar({ label, value, className = '' }: Props) {
  // Determine color and badge style based on threshold
  let colorClass = 'bg-[#35C6B0] dark:bg-[#35C6B0]';
  let badgeClass = 'text-teal-700 dark:text-[#5EEAD4] bg-teal-50 dark:bg-[#35C6B0]/15 border-teal-200 dark:border-[#35C6B0]/30';
  if (value < 70) {
    colorClass = 'bg-rose-500 dark:bg-rose-400';
    badgeClass = 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/80';
  } else if (value < 90) {
    colorClass = 'bg-amber-500 dark:bg-amber-400';
    badgeClass = 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80';
  }

  // Ensure value is between 0 and 100
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const roundedPercent = Math.round(normalizedValue);

  return (
    <div className={`bg-slate-50/80 dark:bg-[#101A2C] p-3 rounded-xl border border-slate-200/80 dark:border-white/10 flex flex-col justify-between gap-2.5 min-w-0 transition-colors ${className}`}>
      <div className="flex items-start justify-between gap-2 min-w-0">
        <span 
          className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate leading-snug"
          title={label}
        >
          {label}
        </span>
        <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded-md border shrink-0 ${badgeClass}`}>
          {roundedPercent}%
        </span>
      </div>
      
      <div className="w-full h-1.5 bg-slate-200 dark:bg-[#173B57] rounded-full overflow-hidden flex items-center">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`} 
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  );
}

