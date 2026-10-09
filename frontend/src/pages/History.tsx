import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History as HistoryIcon, 
  Search,
  Trash2, 
  Loader2,
  FileSpreadsheet,
  ScanSearch,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  FileText,
  Lock
} from 'lucide-react';
import { api } from '../services/api';
import { type HistoryItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { formatAnalysisDateTime } from '../utils/datetime';

interface HistoryThumbnailProps {
  itemId: string;
  imageUrl?: string | null;
  productName?: string;
  onBlobCreated?: (url: string) => void;
}

const HistoryThumbnail: React.FC<HistoryThumbnailProps> = ({
  itemId: _itemId,
  imageUrl,
  productName,
  onBlobCreated,
}) => {
  const [blobSrc, setBlobSrc] = useState<string>(() => {
    if (imageUrl && (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:'))) {
      return imageUrl;
    }
    return '';
  });
  const [loading, setLoading] = useState<boolean>(() => {
    return Boolean(imageUrl && imageUrl !== '/placeholder.png' && !imageUrl.startsWith('data:') && !imageUrl.startsWith('blob:'));
  });
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    if (!imageUrl || imageUrl === '/placeholder.png') {
      setBlobSrc('');
      setLoading(false);
      setHasError(false);
      return;
    }

    if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
      setBlobSrc(imageUrl);
      setLoading(false);
      setHasError(false);
      return;
    }

    setLoading(true);
    setHasError(false);

    api.fetchImageBlobUrl(imageUrl)
      .then((resolvedUrl) => {
        if (!isCancelled) {
          if (resolvedUrl) {
            if (resolvedUrl.startsWith('blob:') && onBlobCreated) {
              onBlobCreated(resolvedUrl);
            }
            setBlobSrc(resolvedUrl);
            setHasError(false);
          } else {
            setBlobSrc('');
            setHasError(true);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setBlobSrc('');
          setHasError(true);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [imageUrl]);

  const hasValidImageUrl = Boolean(imageUrl && imageUrl !== '/placeholder.png');

  return (
    <div className="w-10 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/80 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs relative">
      {loading ? (
        <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800/80">
          <div className="w-3.5 h-3.5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : blobSrc && !hasError ? (
        <img
          src={blobSrc}
          alt={productName || 'Product'}
          className="w-full h-full object-contain p-0.5"
          loading="lazy"
          onError={() => {
            setHasError(true);
          }}
        />
      ) : hasValidImageUrl ? (
        <ImageIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
      ) : (
        <FileText className="w-4 h-4 text-teal-600/70 dark:text-teal-400/70" />
      )}
    </div>
  );
};

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user?.role === 'ADMIN';
  const isOfficer = user?.role === 'ENFORCEMENT_OFFICER';
  const isMerchant = user?.role === 'MERCHANT_PUBLIC';
  const isNormalUser = user?.role === 'PUBLIC_USER' || user?.role === 'NORMAL_USER';

  const canDeleteItem = (item: HistoryItem) => {
    if (isAdmin || isOfficer) return true;
    if (isMerchant || isNormalUser) {
      if (!item.owner_user_id || !user?.username) return false;
      return item.owner_user_id.toLowerCase() === user.username.toLowerCase();
    }
    return false;
  };

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track created blob URLs for memory cleanup on unmount / clear
  const createdBlobUrlsRef = useRef<Set<string>>(new Set());

  // Search, Filter, Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLIANT' | 'REVIEW_REQUIRED' | 'NON_COMPLIANT'>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: keyof HistoryItem | null, direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });

  // Deletion state
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getHistory();
      setHistory(data || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load analysis history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Clean up object URLs on unmount
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

  const exportHistoryToCSV = () => {
    if (history.length === 0) return;
    const headers = ["Inspection ID", "Product Name", "Compliance Score", "Status", "Date & Time"];
    const rows = history.map(item => [
      `"${item.id}"`,
      `"${(item.product_name || 'Unknown').replace(/"/g, '""')}"`,
      item.score,
      `"${item.status}"`,
      `"${formatAnalysisDateTime(item.created_at)}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `metrcheck-history-export-${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteSingle = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteAnalysis(itemToDelete.id);
      setHistory(prev => prev.filter(item => item.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.clearHistory();
      
      createdBlobUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
      createdBlobUrlsRef.current.clear();

      setHistory([]);
      setShowClearModal(false);
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to clear history.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSort = (key: keyof HistoryItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedHistory = useMemo(() => {
    let result = history.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesName = (item.product_name || '').toLowerCase().includes(q);
        const matchesId = (item.id || '').toLowerCase().includes(q);
        const matchesStatus = (item.status || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesStatus) return false;
      }

      if (statusFilter !== 'ALL') {
        const s = (item.status || '').toUpperCase();
        if (statusFilter === 'COMPLIANT' && s !== 'COMPLIANT') return false;
        if (statusFilter === 'REVIEW_REQUIRED' && !s.includes('REVIEW')) return false;
        if (statusFilter === 'NON_COMPLIANT' && !s.includes('FAIL') && !s.includes('NON_COMPLIANT') && !s.includes('POTENTIAL')) return false;
      }
      return true;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key as keyof HistoryItem] ?? '';
        let bVal = b[sortConfig.key as keyof HistoryItem] ?? '';

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [history, searchQuery, statusFilter, sortConfig]);

  if (loading) {
    return <div className="p-8"><LoadingSkeleton variant="page" /></div>;
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        <button onClick={fetchHistory} className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-98">
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <EmptyState 
        icon={HistoryIcon}
        title={isNormalUser ? t('history_page.no_records_consumer') : t('dashboard.no_screenings')}
        description={isNormalUser ? t('history_page.no_records_desc_consumer') : t('dashboard.no_screenings_desc')}
        actionLabel={isNormalUser ? t('navigation.check_product') : t('navigation.analyze_package')}
        onAction={() => navigate('/analyze')}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {isNormalUser ? t('history_page.title') : t('navigation.screening_history')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isNormalUser ? t('history_page.subtitle_consumer') : t('history_page.subtitle_default')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <button
              onClick={() => setShowClearModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#101A2C] border border-slate-200 dark:border-white/10 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 dark:hover:bg-rose-950/30 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('common.delete')}
            </button>
          )}
          <button
            onClick={exportHistoryToCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#101A2C] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#173B57]/50 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {t('common.export')} CSV
          </button>
          <button
            onClick={() => navigate('/analyze')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <ScanSearch className="w-3.5 h-3.5" />
            {isNormalUser ? t('navigation.check_product') : t('navigation.analyze_package')}
          </button>
        </div>
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#101A2C] p-3 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${t('common.search')}...`}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'COMPLIANT', 'REVIEW_REQUIRED', 'NON_COMPLIANT'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === status 
                  ? 'bg-teal-600 text-white shadow-2xs' 
                  : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.1]'
              }`}
            >
              {status === 'ALL' ? t('common.all') : status === 'REVIEW_REQUIRED' ? t('status.needs_review') : status === 'NON_COMPLIANT' ? t('status.fail') : t('status.compliant')}
            </button>
          ))}
        </div>
      </div>

      {/* Investigation Table */}
      <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-[#173B57]/20 border-b border-slate-200/80 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-[#173B57]/40 transition-colors" onClick={() => handleSort('product_name')}>
                  <div className="flex items-center gap-1.5">
                    <span>{t('dashboard.table.product')}</span>
                    {sortConfig.key === 'product_name' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-[#173B57]/40 transition-colors" onClick={() => handleSort('score')}>
                  <div className="flex items-center gap-1.5">
                    <span>{t('dashboard.table.score')}</span>
                    {sortConfig.key === 'score' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-[#173B57]/40 transition-colors" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1.5">
                    <span>{t('dashboard.table.status')}</span>
                    {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-[#173B57]/40 transition-colors" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center gap-1.5">
                    <span>{t('dashboard.table.date')}</span>
                    {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                  </div>
                </th>
                <th className="py-3 px-4 text-right">{t('dashboard.table.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {filteredAndSortedHistory.length > 0 ? (
                filteredAndSortedHistory.map((item) => {
                  return (
                    <tr 
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#173B57]/30 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/results/${item.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <HistoryThumbnail
                            itemId={item.id}
                            imageUrl={item.image_url}
                            productName={item.product_name}
                            onBlobCreated={(url) => {
                              createdBlobUrlsRef.current.add(url);
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[180px] sm:max-w-xs" title={item.product_name || 'Unknown Product'}>
                              {item.product_name || 'Unknown Product'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-mono font-medium ${typeof item.score === 'number' && item.score >= 90 ? 'text-teal-600 dark:text-[#5EEAD4]' : typeof item.score === 'number' && item.score >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {typeof item.score === 'number' ? item.score.toFixed(1) : item.score}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={item.status} size="xs" />
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatAnalysisDateTime(item.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/results/${item.id}`); }}
                            className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors cursor-pointer"
                          >
                            Open
                          </button>
                          {canDeleteItem(item) ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteError(null); setItemToDelete(item); }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title="Delete screening record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : isMerchant ? (
                            <span 
                              className="p-1 text-slate-300 dark:text-slate-600 cursor-not-allowed inline-flex items-center" 
                              title="Deletion unavailable — ownership could not be verified."
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#101A2C] rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200/90 dark:border-white/10 shadow-xl">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {isNormalUser ? 'Delete this scan from your history?' : 'Delete Screening Record?'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-200">"{itemToDelete.product_name || 'this product'}"</span>? This action cannot be undone.
            </p>
            {deleteError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-600 dark:text-rose-400">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => { setItemToDelete(null); setDeleteError(null); }} 
                disabled={isDeleting} 
                className="px-4 py-2 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteSingle} 
                disabled={isDeleting} 
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all disabled:opacity-50 active:scale-98"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#101A2C] rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200/90 dark:border-white/10 shadow-xl">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Clear All History?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">This will permanently delete all records.</p>
            {deleteError && <p className="text-xs text-rose-500">{deleteError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowClearModal(false)} disabled={isDeleting} className="px-4 py-2 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors">Cancel</button>
              <button onClick={handleClearAll} disabled={isDeleting} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-98">
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}