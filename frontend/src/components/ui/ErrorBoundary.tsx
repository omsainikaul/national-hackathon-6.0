import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertCircle, RotateCcw, ArrowLeft, Sparkles } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto my-12 p-8 bg-white dark:bg-[#101A2C] rounded-2xl shadow-2xs border border-slate-200 dark:border-white/10 text-center space-y-5 animate-in fade-in duration-200">
          <div className="inline-flex p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {this.props.fallbackTitle || 'Analysis could not be displayed'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
              {this.props.fallbackMessage ||
                'An unexpected rendering issue occurred while displaying this analysis record. The underlying data remains intact.'}
            </p>
          </div>

          {this.state.error && (
            <div className="p-3 bg-slate-50 dark:bg-[#0E1726] rounded-xl border border-slate-200/80 dark:border-white/10 text-left">
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block truncate">
                {this.state.error.message || 'Unknown error'}
              </span>
            </div>
          )}

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#173B57] hover:bg-[#101A2C] dark:bg-[#35C6B0] dark:hover:bg-[#2db39f] text-white dark:text-slate-950 rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
            <a
              href="/history"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/10 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Screening History</span>
            </a>
            <a
              href="/demo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/10 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Demo Benchmarks</span>
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
