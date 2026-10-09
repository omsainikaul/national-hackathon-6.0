import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, ChevronDown, AlertTriangle, Trash2, 
  FileText, FileSpreadsheet, FileJson, RotateCcw, Package,
  Globe, Zap, Clock
} from 'lucide-react';
import { formatAnalysisDateTime } from '../../utils/datetime';
import { type MultilingualMetadata, SUPPORTED_REPORT_LANGUAGES } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';

interface ResultsHeaderProps {
  productName: string;
  brand: string | null;
  analysisId: string;
  createdAt: string;
  isDemo: boolean;
  imageCount: number;
  extractionMode?: string;
  frontImageUrl?: string | null;
  canDelete: boolean;
  canUseEnforcement: boolean;
  multilingual?: MultilingualMetadata | null;
  onNavigateBack: () => void;
  onNavigateAnalyze: () => void;
  onShowNotice: () => void;
  onShowDelete: () => void;
  exportUrls?: {
    csv: string;
    xlsx: string;
    json: string;
    pdf: string;
  };
}

const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  productName,
  brand,
  analysisId,
  createdAt,
  isDemo,
  imageCount,
  extractionMode,
  frontImageUrl,
  canDelete,
  canUseEnforcement,
  multilingual,
  onNavigateBack,
  onNavigateAnalyze,
  onShowNotice,
  onShowDelete,
  exportUrls: _exportUrls,
}) => {
  const [showExport, setShowExport] = useState(false);
  const [resolvedFrontImg, setResolvedFrontImg] = useState<string>(() => {
    if (frontImageUrl && (frontImageUrl.startsWith('data:') || frontImageUrl.startsWith('blob:'))) {
      return frontImageUrl;
    }
    return '';
  });
  const { selectedLanguage: selectedReportLang, setLanguage: setSelectedReportLang, t } = useLanguage();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const createdBlobUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isCancelled = false;
    if (frontImageUrl && frontImageUrl !== '/placeholder.png') {
      if (frontImageUrl.startsWith('data:') || frontImageUrl.startsWith('blob:')) {
        setResolvedFrontImg(frontImageUrl);
        return;
      }
      api.fetchImageBlobUrl(frontImageUrl).then((blobUrl) => {
        if (!isCancelled && blobUrl) {
          if (blobUrl.startsWith('blob:')) {
            createdBlobUrlsRef.current.add(blobUrl);
          }
          setResolvedFrontImg(blobUrl);
        }
      }).catch(() => {
        if (!isCancelled) {
          setResolvedFrontImg('');
        }
      });
    } else {
      setResolvedFrontImg('');
    }
    return () => {
      isCancelled = true;
    };
  }, [frontImageUrl]);

  useEffect(() => {
    return () => {
      createdBlobUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
      createdBlobUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExport(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowExport(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const handleDownload = async (format: 'pdf' | 'csv' | 'xlsx' | 'json', lang?: string) => {
    setDownloadingFormat(format);
    try {
      await api.downloadReportFile(analysisId, format, lang || selectedReportLang);
    } finally {
      setDownloadingFormat(null);
      setShowExport(false);
    }
  };

  const selectedLangObj = SUPPORTED_REPORT_LANGUAGES.find(l => l.code === selectedReportLang) || SUPPORTED_REPORT_LANGUAGES[0];

  return (
    <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl p-4 sm:p-5 relative z-30 shadow-xs space-y-3.5">
      {/* ROW 1: Back Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          type="button"
          onClick={onNavigateBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>{isDemo ? t('navigation.demo_cases') : t('navigation.screening_history')}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Visible Language Selector */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 rounded-lg text-xs transition-colors">
            <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <label htmlFor="report-language-select" className="text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap text-xs">
              {t('common.language')}:
            </label>
            <select
              id="report-language-select"
              aria-label={t('common.report_language')}
              value={selectedReportLang}
              onChange={(e) => setSelectedReportLang(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-100 font-semibold focus:outline-hidden cursor-pointer text-xs"
            >
              {SUPPORTED_REPORT_LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="bg-white dark:bg-[#101A2C] text-slate-800 dark:text-slate-200">
                  {l.native} ({l.label})
                </option>
              ))}
            </select>
          </div>

          {/* Quick PDF Report Download Button in Selected Language */}
          <button
            type="button"
            onClick={() => handleDownload('pdf', selectedReportLang)}
            disabled={downloadingFormat === 'pdf'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#173B57] hover:bg-[#101A2C] dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-[#101A2C] rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title={`${t('results.download_pdf')} (${selectedLangObj.label})`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>{downloadingFormat === 'pdf' ? 'Downloading...' : t('results.download_pdf')}</span>
          </button>

          <button
            type="button"
            onClick={onNavigateAnalyze}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] rounded-lg border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
            title={t('common.rescan')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('common.rescan')}</span>
          </button>

          {canUseEnforcement && (
            <button
              type="button"
              onClick={onShowNotice}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg border border-amber-200 dark:border-amber-800/80 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{t('common.notice')}</span>
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={onShowDelete}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition-colors cursor-pointer"
              title={t('common.delete')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Export Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowExport(!showExport)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 rounded-lg transition-colors cursor-pointer"
              aria-expanded={showExport}
            >
              <span>{t('common.more_exports')}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showExport ? 'rotate-180' : ''}`} />
            </button>

            {showExport && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#101A2C] border border-slate-200 dark:border-white/15 rounded-xl shadow-xl py-2 z-50 ring-1 ring-black/5 animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={() => handleDownload('csv')}
                  className="w-full text-left flex items-center px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t('reports.csv_report')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload('xlsx')}
                  className="w-full text-left flex items-center px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{t('reports.xlsx_report')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload('json')}
                  className="w-full text-left flex items-center px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <FileJson className="w-4 h-4 mr-2.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{t('reports.json_report')}</span>
                </button>

                <div className="border-t border-slate-100 dark:border-white/10 mt-1.5 pt-2 px-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('reports.report_language')}
                    </span>
                    <select
                      value={selectedReportLang}
                      onChange={(e) => setSelectedReportLang(e.target.value)}
                      className="text-xs bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-white/10 px-1.5 py-0.5"
                    >
                      {SUPPORTED_REPORT_LANGUAGES.map(l => (
                        <option key={l.code} value={l.code}>
                          {l.native} ({l.label})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload('pdf', selectedReportLang)}
                    className="w-full text-left flex items-center py-1.5 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 mr-2.5 shrink-0" />
                    <span>{t('reports.download_pdf')} ({selectedLangObj.label})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 2: Product Identity & Thumbnail & Metadata */}
      <div className="flex items-center gap-3.5 sm:gap-4 pt-2 border-t border-slate-100 dark:border-white/10">
        {/* Product Front Thumbnail */}
        <div className="w-14 sm:w-16 h-16 sm:h-20 shrink-0 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xs">
          {resolvedFrontImg && resolvedFrontImg !== '/placeholder.png' ? (
            <img
              src={resolvedFrontImg}
              alt={productName}
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <Package className="w-6 h-6 text-slate-500 dark:text-slate-400" />
          )}
        </div>

        {/* Identity & Metadata Details */}
        <div className="min-w-0 flex-1 space-y-1">
          {/* Mode Indicator Badge */}
          <div className="flex items-center gap-2">
            {isDemo ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800/80 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>PRECOMPUTED DEMO</span>
                <span className="hidden sm:inline font-normal text-amber-700 dark:text-amber-300">
                  • Prepared Benchmark Fixture
                </span>
              </span>
            ) : extractionMode === 'manual' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800/80 shadow-2xs">
                <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>MANUAL PRODUCT CHECK</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/80 shadow-2xs">
                <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>LIVE AI ANALYSIS</span>
                <span className="hidden sm:inline font-normal text-emerald-700 dark:text-emerald-300">
                  • Real-time PaddleOCR & Statutory Engine Run
                </span>
              </span>
            )}
          </div>

          {/* Product Name */}
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight truncate">
            {productName}
          </h1>

          {/* Brand */}
          {brand && (
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
              {brand}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono text-[11px] bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
              ID: {analysisId ? (analysisId.length > 12 ? analysisId.substring(0, 12) + '...' : analysisId) : 'N/A'}
            </span>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
            <span className="text-[11px] sm:text-xs">
              {formatAnalysisDateTime(createdAt)}
            </span>
            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
            {extractionMode === 'manual' ? (
              <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded text-[11px] font-semibold border border-amber-200/60 dark:border-amber-900/60">
                Manual Product Check
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded text-[11px] font-semibold border border-teal-200/60 dark:border-teal-900/60">
                {imageCount} Panel{imageCount !== 1 ? 's' : ''}
              </span>
            )}

            {/* Multilingual Detected Languages Badge */}
            {multilingual?.detected_languages && multilingual.detected_languages.length > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
                <span 
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 rounded text-[11px] font-semibold border border-teal-200/60 dark:border-teal-900/60"
                  title={`Detected Scripts: ${multilingual.detected_scripts?.join(', ') || 'Latin'}`}
                >
                  <Globe className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                  <span>
                    {multilingual.detected_languages.map(l => `${l.name} (${Math.round(l.confidence * 100)}%)`).join(', ')}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsHeader;
