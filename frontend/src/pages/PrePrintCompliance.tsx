import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { 
  Printer, 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Layers, 
  ChevronRight, 
  ChevronLeft, 
  RefreshCw, 
  Sliders, 
  FileCheck, 
  CheckSquare, 
  Eye, 
  Clock, 
  Tag, 
  AlertOctagon,
  Copy,
  Check,
  Package,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { 
  type ArtworkDocument, 
  type PreprintAnalysisResponse, 
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

export default function PrePrintCompliance() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const initialProductId = (searchParams.get('productId') || (location.state as any)?.productId || '').trim();
  const initialProductName = ((location.state as any)?.productName || '').trim();

  const [productId, setProductId] = useState<string>(initialProductId);
  const [productName, setProductName] = useState<string>(initialProductName);

  useEffect(() => {
    if (productId && !productName) {
      let isMounted = true;
      api.getProduct(productId).then(prod => {
        if (isMounted && prod?.product_name) {
          setProductName(prod.product_name);
        }
      }).catch(() => {});
      return () => { isMounted = false; };
    }
  }, [productId, productName]);
  
  // State
  const [artworks, setArtworks] = useState<ArtworkDocument[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkDocument | null>(null);
  const [analysis, setAnalysis] = useState<PreprintAnalysisResponse | null>(null);
  const [activePageNum, setActivePageNum] = useState<number>(1);
  const [showLayoutOverlay, setShowLayoutOverlay] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Approval Modal State
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [approvalDecision, setApprovalDecision] = useState<'APPROVED' | 'REJECTED' | 'REQUEST_CHANGES'>('APPROVED');
  const [approvalComments, setApprovalComments] = useState<string>('');
  const [disclaimerChecked, setDisclaimerChecked] = useState<boolean>(false);
  const [submittingApproval, setSubmittingApproval] = useState<boolean>(false);

  // Correction Re-upload State
  const [showCorrectionModal, setShowCorrectionModal] = useState<boolean>(false);
  const [correctionFile, setCorrectionFile] = useState<File | null>(null);
  const [uploadingCorrection, setUploadingCorrection] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const correctionFileInputRef = useRef<HTMLInputElement>(null);

  const runAnalysis = async (artworkId: string) => {
    setAnalyzing(true);
    setError(null);
    try {
      const resp = await api.analyzeArtwork(artworkId);
      setAnalysis(resp);
      const updatedDoc = await api.getArtwork(artworkId);
      setSelectedArtwork(updatedDoc);
    } catch (err: any) {
      setError(err?.message || 'Pre-print analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const selectArtwork = async (art: ArtworkDocument) => {
    setSelectedArtwork(art);
    setActivePageNum(1);
    if (art.analysis_result) {
      setAnalysis(art.analysis_result);
    } else {
      // Analyze immediately if not yet analyzed
      await runAnalysis(art.id);
    }
  };

  // Fetch artworks on load
  const loadArtworks = async () => {
    setLoading(true);
    try {
      const resp = await api.listArtworks();
      setArtworks(resp.artworks || []);
      if (resp.artworks && resp.artworks.length > 0 && !selectedArtwork) {
        selectArtwork(resp.artworks[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load pre-print artworks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtworks();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const uploadResp = await api.uploadArtwork(file, undefined, 1, productId.trim() ? productId.trim() : undefined);
      if (uploadResp.success) {
        // Run analysis immediately
        const analysisResp = await api.analyzeArtwork(uploadResp.artwork_id);
        await loadArtworks();
        const fullArt = await api.getArtwork(uploadResp.artwork_id);
        setSelectedArtwork(fullArt);
        setAnalysis(analysisResp);
        setActivePageNum(1);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to upload packaging artwork.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCorrectionUpload = async () => {
    if (!selectedArtwork || !correctionFile) return;
    setUploadingCorrection(true);
    setError(null);
    try {
      const resp = await api.uploadArtworkCorrection(selectedArtwork.id, correctionFile);
      setAnalysis(resp);
      await loadArtworks();
      const updatedDoc = await api.getArtwork(resp.artwork_id);
      setSelectedArtwork(updatedDoc);
      setShowCorrectionModal(false);
      setCorrectionFile(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload corrected artwork iteration.');
    } finally {
      setUploadingCorrection(false);
    }
  };

  const handleApprovalSubmit = async () => {
    if (!selectedArtwork) return;
    if (!disclaimerChecked) {
      setError('You must acknowledge the legal metrology pre-print disclaimer.');
      return;
    }

    setSubmittingApproval(true);
    setError(null);
    try {
      const resp = await api.submitArtworkApproval(selectedArtwork.id, {
        reviewer_name: user?.full_name || user?.username || 'Reviewer',
        reviewer_role: user?.role || 'MERCHANT_PUBLIC',
        decision: approvalDecision,
        comments: approvalComments,
        legal_disclaimer_acknowledged: disclaimerChecked,
      });

      setSelectedArtwork(resp.artwork);
      if (resp.artwork?.analysis_result) {
        setAnalysis(resp.artwork.analysis_result);
      }
      setShowApprovalModal(false);
      await loadArtworks();
    } catch (err: any) {
      setError(err?.message || 'Approval submission failed.');
    } finally {
      setSubmittingApproval(false);
    }
  };

  const copyDesignerChecklist = () => {
    if (!analysis) return;
    const text = analysis.designer_corrections
      .map(
        (c, idx) =>
          `${idx + 1}. [${c.severity}] ${c.field_name}: ${c.issue}\n   Action: ${c.suggested_action}\n   Ref: ${c.legal_reference}`
      )
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedItem('ALL');
    setTimeout(() => setCopiedItem(null), 2500);
  };

  // Helper for workflow status styling
  const getWorkflowBadge = (status: string) => {
    switch (status) {
      case 'READY_FOR_PRINT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {t('merchant.preprint.ready_for_print')}
          </span>
        );
      case 'CHANGES_REQUESTED':
      case 'ACTION_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            {t('merchant.preprint.action_required')}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            {t('merchant.preprint.rejected')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            {t('merchant.preprint.draft_pending')}
          </span>
        );
    }
  };

  const activePage = analysis?.pages?.find((p) => p.page_number === activePageNum) || analysis?.pages?.[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* ── Header Section ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#173B57] to-[#101A2C] text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shadow-lg shadow-teal-950/40 shrink-0">
              <Printer className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">{t('merchant.preprint.studio_title')}</h1>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {t('merchant.preprint.studio_desc')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 font-bold text-sm shadow-md shadow-teal-950/40 transition-all cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Upload className="w-4 h-4 text-slate-950" />
            )}
            <span>{t('merchant.preprint.upload_artwork')}</span>
          </button>

          {selectedArtwork && (
            <button
              onClick={() => setShowApprovalModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>{t('merchant.preprint.review_signoff')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Linked SKU Context Banner if productId is present */}
      {productId && (
        <div className="px-5 py-3.5 rounded-xl bg-teal-50 dark:bg-[#173B57]/30 border border-teal-200 dark:border-teal-500/30 flex items-center justify-between gap-3 text-xs text-teal-950 dark:text-teal-200 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Package className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              {t('sku_workflow.artwork_for_sku')}:
            </span>
            <span className="font-bold text-slate-900 dark:text-white truncate">
              {productName || productId}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setProductId('');
              setProductName('');
            }}
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>{t('sku_workflow.unlink')}</span>
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 dark:text-rose-400 hover:underline text-xs cursor-pointer">
            {t('merchant.preprint.dismiss')}
          </button>
        </div>
      )}

      {/* ── Main Layout: Sidebar of Artworks + Active Artwork Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left List of Artworks (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('merchant.preprint.artwork_versions')}</h2>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('merchant.preprint.total', { count: artworks.length })}</span>
            </div>

            {loading ? (
              <div className="space-y-2">
                <LoadingSkeleton variant="card" />
              </div>
            ) : artworks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                {t('merchant.preprint.no_artworks')}
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {artworks.map((art) => {
                  const isSelected = selectedArtwork?.id === art.id;
                  return (
                    <div
                      key={art.id}
                      onClick={() => selectArtwork(art)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-950/20 border-teal-500/50 dark:border-teal-500/40 shadow-xs'
                          : 'bg-slate-50/80 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                          {art.filename}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shrink-0">
                          v{art.iteration_number}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{art.file_type} • {art.page_count} pg</span>
                        <span className="font-medium">{art.workflow_status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Active Artwork Analysis Studio (9 Cols) */}
        <div className="lg:col-span-9 space-y-6">
          {selectedArtwork && analysis ? (
            <>
              {/* Top Summary Bar */}
              <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selectedArtwork.filename}</h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Iteration #{selectedArtwork.iteration_number}
                    </span>
                    {getWorkflowBadge(selectedArtwork.workflow_status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-teal-500" />
                      Source: <strong className="text-slate-800 dark:text-slate-200">{analysis.source_identity}</strong>
                    </span>
                    <span>•</span>
                    <span>Pages: <strong className="text-slate-800 dark:text-slate-200">{analysis.page_count}</strong></span>
                    <span>•</span>
                    <span>Score: <strong className="text-teal-600 dark:text-teal-400 font-bold">{analysis.overall_score}/100</strong></span>
                    <span>•</span>
                    <span>
                      Blocking Issues: <strong className={analysis.print_blocking_issues_count > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                        {analysis.print_blocking_issues_count}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCorrectionModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-white/10 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-teal-500" />
                    Upload Next Iteration
                  </button>
                  <button
                    onClick={copyDesignerChecklist}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-white/10 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedItem === 'ALL' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    Copy Checklist
                  </button>
                </div>
              </div>

              {/* Artwork Visual Canvas & Semantic Layout */}
              <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Artwork Layout & Zoning Map</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      (Page {activePageNum} of {analysis.page_count})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowLayoutOverlay(!showLayoutOverlay)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        showLayoutOverlay
                          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-500/50'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5 inline mr-1" />
                      {showLayoutOverlay ? 'Hide Zones' : 'Show Semantic Zones'}
                    </button>

                    {analysis.page_count > 1 && (
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-0.5">
                        <button
                          disabled={activePageNum <= 1}
                          onClick={() => setActivePageNum((p) => Math.max(1, p - 1))}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        </button>
                        <span className="px-2 text-xs font-mono text-slate-700 dark:text-slate-300">{activePageNum}</span>
                        <button
                          disabled={activePageNum >= analysis.page_count}
                          onClick={() => setActivePageNum((p) => Math.min(analysis.page_count, p + 1))}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Canvas Box */}
                <div className="relative bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/10 p-4 flex items-center justify-center min-h-[360px] overflow-hidden">
                  {activePage?.preview_image_path ? (
                    <div className="relative inline-block max-w-full">
                      <img
                        src={api.getAssetUrl(activePage.preview_image_path)}
                        alt={`Artwork Page ${activePageNum}`}
                        className="max-h-[500px] w-auto object-contain rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl"
                      />
                      {showLayoutOverlay &&
                        activePage.layout_regions.map((reg) => {
                          const [x1, y1, x2, y2] = reg.bbox_normalized;
                          const left = `${x1 * 100}%`;
                          const top = `${y1 * 100}%`;
                          const width = `${(x2 - x1) * 100}%`;
                          const height = `${(y2 - y1) * 100}%`;

                          const isMRP = reg.region_type === 'MRP_STAMP';
                          const isNetQty = reg.region_type === 'NET_QTY_AREA';
                          const isBrand = reg.region_type === 'BRAND_HEADER';

                          const borderClass = isMRP
                            ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                            : isNetQty
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : isBrand
                            ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                            : 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300';

                          return (
                            <div
                              key={reg.region_id}
                              style={{ left, top, width, height }}
                              className={`absolute border-2 rounded transition-all hover:bg-opacity-30 pointer-events-auto group ${borderClass}`}
                              title={`${reg.region_type} (${Math.round(reg.confidence * 100)}%)`}
                            >
                              <span className="absolute -top-5 left-0 px-1 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-900/90 text-white border border-slate-700 shadow whitespace-nowrap">
                                {reg.region_type.replace('_', ' ')}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                      <FileText className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                      Preview not rendered for this page.
                    </div>
                  )}
                </div>

                {/* Detected Semantic Zones Summary */}
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Detected Zones on this page:</span>
                  {activePage?.layout_regions && activePage.layout_regions.length > 0 ? (
                    activePage.layout_regions.map((reg) => (
                      <span
                        key={reg.region_id}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {reg.region_type} ({Math.round(reg.confidence * 100)}%)
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic">No isolated semantic zones detected.</span>
                  )}
                </div>
              </div>

              {/* ── Section 8 Cards Grid: Checklist & Placement Checks ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Mandatory Information Checklist */}
                <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">PCR Mandatory Checklist</h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {Object.values(analysis.mandatory_checklist).filter(Boolean).length}/
                      {Object.keys(analysis.mandatory_checklist).length} Present
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                    {Object.entries(analysis.mandatory_checklist).map(([field, present]) => (
                      <div
                        key={field}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {present ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          )}
                          <span className={present ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                            {field.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          present ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        }`}>
                          {present ? 'PRESENT' : 'MISSING'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Placement & Proximity Checks */}
                <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-teal-500" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Declaration Placement Checks</h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {analysis.placement_checks.filter((p) => p.passed).length}/{analysis.placement_checks.length} Passed
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                    {analysis.placement_checks.map((chk, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{chk.check_name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            chk.status === 'PASS'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          }`}>
                            {chk.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">{chk.finding}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                          <span>Zone: <strong className="text-slate-700 dark:text-slate-300">{chk.recommended_zone}</strong></span>
                          <span className="font-mono text-slate-400 dark:text-slate-500">{chk.legal_citation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* ── Section 8 Cards Grid: Font-Size Assistance & Designer Correction List ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 3. Font Size Assistance */}
                <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-500" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Font Size Assistance</h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 font-bold">
                      ESTIMATED
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                    {analysis.font_size_estimates.map((fnt, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">{fnt.field_name.replace(/_/g, ' ').toUpperCase()}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            fnt.is_compliant ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          }`}>
                            {fnt.is_compliant ? 'MEETS MINIMUM' : 'CHECK SIZE'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                          <div>Est. Height: <strong className="text-slate-900 dark:text-white">{fnt.estimated_height_mm} mm</strong> ({fnt.estimated_pt_size} pt)</div>
                          <div>Mandated Min: <strong className="text-slate-900 dark:text-white">{fnt.mandated_minimum_mm} mm</strong></div>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                          {fnt.disclaimer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Actionable Designer Correction Checklist */}
                <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Designer Correction Checklist</h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {analysis.designer_corrections.length} Action Items
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                    {analysis.designer_corrections.map((corr) => (
                      <div
                        key={corr.item_id}
                        className={`p-3 rounded-xl border space-y-1.5 text-xs ${
                          corr.severity === 'CRITICAL'
                            ? 'bg-rose-500/10 border-rose-500/30'
                            : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{corr.field_name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            corr.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                          }`}>
                            {corr.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">{corr.issue}</p>
                        <div className="bg-teal-50/60 dark:bg-slate-900/80 p-2 rounded-lg border border-teal-200/80 dark:border-slate-800 text-[11px] text-teal-900 dark:text-teal-200">
                          <strong>Action:</strong> {corr.suggested_action}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          Ref: {corr.legal_reference}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          ) : analyzing ? (
            <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl p-12 text-center space-y-4 shadow-xs">
              <RefreshCw className="w-8 h-8 text-teal-500 animate-spin mx-auto" />
              <p className="text-sm text-slate-800 dark:text-slate-300 font-semibold">Running multi-pass pre-print compliance engine...</p>
              <p className="text-xs text-slate-500">Checking vector typography, semantic layout zones, and statutory rules.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl p-16 text-center space-y-4 shadow-xs">
              <Printer className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-300">Select or Upload Packaging Artwork</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Upload packaging artwork in PDF, PNG, or JPG format to run automated pre-print compliance validation and generate designer checklists.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ── Approval Sign-Off Modal ── */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#101A2C] border border-slate-200 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Pre-Print Compliance Sign-Off</h3>
              </div>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('APPROVED')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                      approvalDecision === 'APPROVED'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Approve (Ready)
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('REQUEST_CHANGES')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                      approvalDecision === 'REQUEST_CHANGES'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Request Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('REJECTED')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                      approvalDecision === 'REJECTED'
                        ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300'
                        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reviewer Comments</label>
                <textarea
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  placeholder="Add notes for the print production or design team..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Legal Disclaimer Checkbox */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={disclaimerChecked}
                    onChange={(e) => setDisclaimerChecked(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong className="text-slate-800 dark:text-slate-200">Mandatory Statutory Disclaimer:</strong> I acknowledge that MetrCheck AI pre-print verification is an AI-assisted advisory workflow status (&quot;READY FOR PRINT&quot;) and does not constitute a statutory certificate of exemption or government immunity. Physical proofs should be verified prior to mass production.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingApproval || !disclaimerChecked}
                onClick={handleApprovalSubmit}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {submittingApproval && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Submit Sign-Off
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Correction Re-upload Modal ── */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#101A2C] border border-slate-200 dark:border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-teal-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Upload Corrected Artwork Iteration</h3>
              </div>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload the revised artwork file from the packaging designer. This will create iteration #{((selectedArtwork?.iteration_number || 1) + 1)} linked to this artwork.
            </p>

            <input
              type="file"
              ref={correctionFileInputRef}
              onChange={(e) => setCorrectionFile(e.target.files?.[0] || null)}
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-500 cursor-pointer"
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowCorrectionModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!correctionFile || uploadingCorrection}
                onClick={handleCorrectionUpload}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {uploadingCorrection && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Upload & Re-Analyze
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
