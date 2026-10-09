import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  RefreshCw,
  Compass,
  Clock,
  Zap
} from 'lucide-react';

import { api } from '../services/api';
import { type DemoCaseMeta } from '../types';
import Card from '../components/ui/Card';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

export default function DemoCases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<DemoCaseMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCaseId, setLoadingCaseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  // Fallback fixtures if backend is starting up
  const fallbackCases: DemoCaseMeta[] = [
    {
      id: '1',
      name: 'Royal Gold Premium Basmati Rice',
      brand: 'Royal Gold',
      category: 'Packaged Food / Grains',
      purpose: 'Strong Compliant Package Benchmark',
      description: 'Demonstrates a fully compliant food package with complete statutory declarations including net quantity, MRP, batch number, FSSAI licence, and consumer care details.',
      panels: ['Front', 'Back'],
      expected_score: 95.5,
      expected_status: 'COMPLIANT',
      badge_type: 'compliant',
      tags: ['Full Declarations', 'FSSAI Valid', 'Dual Panel Evidence']
    },
    {
      id: '2',
      name: 'FreshVita Mixed Fruit Juice',
      brand: 'FreshVita',
      category: 'Beverages / Packaged Juice',
      purpose: 'Review & Corrective Action Workflow',
      description: 'Demonstrates detection of missing expiry date and consumer care contact declarations under Legal Metrology Rule 6(1) with prioritized corrective actions.',
      panels: ['Front', 'Back'],
      expected_score: 76.9,
      expected_status: 'POTENTIAL NON-COMPLIANCE',
      badge_type: 'warning',
      tags: ['Missing Expiry', 'Missing Consumer Care', 'Corrective Guidance']
    },
    {
      id: '3',
      name: 'QuickBite Instant Noodles',
      brand: 'QuickBite',
      category: 'Processed Foods',
      purpose: 'Multiple Non-Compliance Benchmark',
      description: 'Demonstrates automated screening on heavily deficient packaging missing manufacturer address, net quantity, MRP, and date markings.',
      panels: ['Front'],
      expected_score: 37.9,
      expected_status: 'POTENTIAL NON-COMPLIANCE',
      badge_type: 'violation',
      tags: ['Multiple Violations', 'High Priority Actions', 'Statutory Penalties']
    }
  ];

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const data = await api.getDemoCases();
        if (data && data.length > 0) {
          setCases(data);
        } else {
          setCases(fallbackCases);
        }
      } catch {
        setCases(fallbackCases);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const handleLoadDemo = async (caseId: string) => {
    setLoadingCaseId(caseId);
    setError(null);
    try {
      const result = await api.getDemoCase(caseId);
      navigate(`/results/${result.id}`, { 
        state: { 
          analysisData: result,
          isDemo: true,
          demoCaseId: caseId
        } 
      });
    } catch (err: any) {
      setError(err?.message || 'Demo benchmark could not be loaded. Please try again.');
      setLoadingCaseId(null);
    }
  };

  const getBadgeStyles = (type: string) => {
    switch (type) {
      case 'compliant':
      case 'success':
        return {
          bg: 'bg-teal-50 dark:bg-[#35C6B0]/15 text-teal-800 dark:text-[#5EEAD4] border-teal-200/80 dark:border-[#35C6B0]/30',
          icon: ShieldCheck,
          iconColor: 'text-teal-600 dark:text-[#35C6B0]',
          label: 'Compliant Benchmark'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
          icon: AlertTriangle,
          iconColor: 'text-amber-600 dark:text-amber-400',
          label: 'Review Required Benchmark'
        };
      case 'violation':
      case 'danger':
      default:
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
          icon: XCircle,
          iconColor: 'text-rose-600 dark:text-rose-400',
          label: 'Non-Compliance Benchmark'
        };
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Top Banner Header */}
      <div className="bg-gradient-to-r from-[#101A2C] via-[#173B57] to-[#101A2C] rounded-3xl p-8 text-white shadow-md relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400/40 rounded-full text-xs font-bold text-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>PRECOMPUTED DEMO BENCHMARKS</span>
            </span>
            <span className="text-[11px] font-mono text-teal-300/90 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/30">
              Prepared Presentation Fixtures
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white">Precomputed Demo Scenarios</h1>
          <p className="text-slate-200 text-sm leading-relaxed">
            Explore prepared benchmark scenarios instantly with precomputed OCR results and statutory rules scoring — without running a live OCR workload.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold transition-all cursor-pointer text-white"
            >
              <Info className="w-4 h-4 text-teal-300" />
              <span>{showGuide ? 'Hide' : 'View'} Presentation Walkthrough</span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => navigate('/analyze')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-98"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Run Live AI Scanner</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Informational Separation Card */}
      <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl flex items-start gap-3.5 text-xs text-amber-950 dark:text-amber-200 shadow-2xs">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-xl shrink-0 mt-0.5">
          <Clock className="w-4 h-4" />
        </div>
        <div className="space-y-1 leading-relaxed">
          <p className="font-bold text-amber-950 dark:text-amber-100">
            PRECOMPUTED BENCHMARK NOTICE — Offline Synthetic Scenarios
          </p>
          <p className="text-amber-900/90 dark:text-amber-300/90">
            Demo cases load prepared benchmark responses from <code className="font-mono bg-amber-100 dark:bg-amber-900/80 px-1 py-0.5 rounded text-[11px]">/api/demo/{'{case_id}'}</code> to demonstrate reporting and UI features without initiating real-time GPU/CPU OCR inference. To test live OCR and rules evaluation, use the <strong>Live AI Scanner</strong> on the Analyze page.
          </p>
        </div>
      </div>

      {/* Error Alert if any */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 p-4 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button 
            type="button"
            onClick={() => setError(null)}
            className="text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Collapsible Presentation Guide */}
      {showGuide && (
        <Card className="border-teal-500/20 dark:border-teal-500/20 bg-teal-50/20 dark:bg-[#101A2C] p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-teal-500/15 text-teal-700 dark:text-teal-300 rounded-lg">
                <Compass className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">SIH Judge Presentation Script (3–5 Minute Walkthrough)</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mt-4 text-xs">
            <div className="bg-white dark:bg-[#173B57]/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <span className="w-5 h-5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center justify-center text-[11px] font-bold">1</span>
                <span>Select Case</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">Choose a benchmark package (Compliant, Review Required, or Non-Compliant).</p>
            </div>
            <div className="bg-white dark:bg-[#173B57]/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <span className="w-5 h-5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center justify-center text-[11px] font-bold">2</span>
                <span>Screening Score</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">Show explainable score, overall status, and PASS/REVIEW/FAIL counts.</p>
            </div>
            <div className="bg-white dark:bg-[#173B57]/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <span className="w-5 h-5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center justify-center text-[11px] font-bold">3</span>
                <span>Recommended Actions</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">Demonstrate prioritized corrective actions and verification steps.</p>
            </div>
            <div className="bg-white dark:bg-[#173B57]/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <span className="w-5 h-5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center justify-center text-[11px] font-bold">4</span>
                <span>Evidence Inspector</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">Click "View Evidence" to inspect localized label artwork &amp; bbox overlays.</p>
            </div>
            <div className="bg-white dark:bg-[#173B57]/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <span className="w-5 h-5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center justify-center text-[11px] font-bold">5</span>
                <span>Export PDF</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">Click "Export PDF Report" to download the offline compliance dossier.</p>
            </div>
          </div>
        </Card>
      )}

      {/* 4. Demo Case Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Available Demonstration Benchmarks</h2>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {cases.length} Pre-Configured Benchmarks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cases.map((c) => {
            const badge = getBadgeStyles(c.badge_type);
            const BadgeIcon = badge.icon;
            const isCurrentLoading = loadingCaseId === c.id;

            return (
              <Card 
                key={c.id} 
                className="flex flex-col justify-between hover:shadow-md hover:border-teal-500/40 dark:hover:border-teal-500/30 transition-all border-slate-200/90 dark:border-white/10 relative overflow-hidden"
              >
                <div>
                  {/* Category & Status Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {c.category}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg}`}>
                      <BadgeIcon className={`w-3 h-3 ${badge.iconColor}`} />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  {/* Product Title */}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    {c.name}
                  </h3>

                  {/* Purpose */}
                  <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mb-3">
                    {c.purpose}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {c.description}
                  </p>

                  {/* Tags */}
                  {c.tags && (
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {c.tags.map((tag, idx) => (
                        <span 
                          key={idx}
                          className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 rounded-md border border-slate-200/60 dark:border-white/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Panel Info & CTA Button */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>{c.panels?.length || 1} Panels</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLoadDemo(c.id)}
                    disabled={isCurrentLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-98"
                  >
                    {isCurrentLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading Demo...</span>
                      </>
                    ) : (
                      <>
                        <span>Launch Demo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 5. Real Custom Analysis Callout */}
      <div className="bg-white dark:bg-[#101A2C] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Want to test with real live package photos?</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Switch to real analysis mode to upload custom multi-image product packaging (Front + Back) through the full PaddleOCR pipeline.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/analyze')}
          className="shrink-0 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-[#173B57] dark:hover:bg-[#1f4a6d] border border-transparent text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-98"
        >
          Go to Real Image Upload
        </button>
      </div>
    </div>
  );
}
