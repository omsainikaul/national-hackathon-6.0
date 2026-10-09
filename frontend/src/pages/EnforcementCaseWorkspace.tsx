import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Scale,
  FileText,
  Clock,
  AlertTriangle,
  Layers,
  Lock,
  ChevronRight,
  UserCheck,
  Copy,
  Check,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  Gavel,
  FileCheck2,
  X,
  MapPin,
  ShieldCheck,
  History
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type {
  EnforcementCaseDetail,
  EnforcementNotice
} from '../types';

export default function EnforcementCaseWorkspace() {
  const { caseId } = useParams<{ caseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<EnforcementCaseDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VIOLATIONS' | 'PENALTIES' | 'NOTICES' | 'TIMELINE'>('OVERVIEW');

  // Action Modals
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [selectedEnforcementOfficer, setSelectedEnforcementOfficer] = useState<string>('');
  const [assignComments, setAssignComments] = useState<string>('');
  const [enforcementOfficers, setEnforcementOfficers] = useState<Array<{ username: string; full_name: string; role: string }>>([]);
  const [assigningOfficer, setAssigningOfficer] = useState<boolean>(false);

  const [showPenaltyModal, setShowPenaltyModal] = useState<boolean>(false);
  const [repeatOffence, setRepeatOffence] = useState<boolean>(false);
  const [priorNotices, setPriorNotices] = useState<number>(0);
  const [penaltyReason, setPenaltyReason] = useState<string>('');
  const [calculatingPenalty, setCalculatingPenalty] = useState<boolean>(false);

  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(false);
  const [noticeType, setNoticeType] = useState<string>('SHOW_CAUSE');
  const [officerName, setOfficerName] = useState<string>(user?.full_name || 'Legal Metrology Inspector');
  const [officerDesignation, setOfficerDesignation] = useState<string>('Inspector, Legal Metrology');
  const [deadlineDays, setDeadlineDays] = useState<number>(15);
  const [issuingNotice, setIssuingNotice] = useState<boolean>(false);

  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [closureReason, setClosureReason] = useState<string>('');
  const [resolutionType, setResolutionType] = useState<string>('COMPOUNDED');
  const [closingCase, setClosingCase] = useState<boolean>(false);

  const [showTransitionModal, setShowTransitionModal] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [transitionReason, setTransitionReason] = useState<string>('');
  const [transitioning, setTransitioning] = useState<boolean>(false);

  const [showReopenModal, setShowReopenModal] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [reopenComments, setReopenComments] = useState<string>('');
  const [reopeningCase, setReopeningCase] = useState<boolean>(false);

  const [selectedNoticeView, setSelectedNoticeView] = useState<EnforcementNotice | null>(null);
  const [copiedNoticeId, setCopiedNoticeId] = useState<string | null>(null);

  const loadCase = async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      const data = await api.getEnforcementCase(caseId);
      setCaseData(data);
    } catch (err) {
      console.error('Failed to load enforcement case:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCase();
  }, [caseId]);

  const openAssignModal = async () => {
    try {
      const res = await api.getAvailableEnforcementOfficers();
      setEnforcementOfficers(res.officers || []);
      setSelectedEnforcementOfficer(caseData?.assigned_officer || '');
      setShowAssignModal(true);
    } catch (err) {
      console.error('Failed to load enforcement officers:', err);
    }
  };

  const handleAssignOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !selectedEnforcementOfficer) return;
    setAssigningOfficer(true);
    try {
      await api.assignEnforcementCase(caseId, selectedEnforcementOfficer, assignComments);
      setShowAssignModal(false);
      setAssignComments('');
      await loadCase();
    } catch (err: any) {
      alert(err.message || 'Failed to assign enforcement case.');
    } finally {
      setAssigningOfficer(false);
    }
  };

  const handleCalculatePenalty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId) return;
    setCalculatingPenalty(true);
    try {
      await api.calculateCasePenalty(caseId, repeatOffence, priorNotices, penaltyReason);
      setShowPenaltyModal(false);
      setPenaltyReason('');
      await loadCase();
      setActiveTab('PENALTIES');
    } catch (err: any) {
      alert(err.message || 'Failed to calculate statutory penalty.');
    } finally {
      setCalculatingPenalty(false);
    }
  };

  const handleIssueNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId) return;
    setIssuingNotice(true);
    try {
      await api.issueCaseNotice(caseId, {
        notice_type: noticeType,
        officer_name: officerName,
        officer_designation: officerDesignation,
        deadline_days: deadlineDays
      });
      setShowNoticeModal(false);
      await loadCase();
      setActiveTab('NOTICES');
    } catch (err: any) {
      alert(err.message || 'Failed to issue statutory notice.');
    } finally {
      setIssuingNotice(false);
    }
  };

  const handleCloseCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !closureReason) return;
    setClosingCase(true);
    try {
      await api.closeEnforcementCase(caseId, closureReason, resolutionType);
      setShowCloseModal(false);
      await loadCase();
    } catch (err: any) {
      alert(err.message || 'Failed to close enforcement case.');
    } finally {
      setClosingCase(false);
    }
  };

  const handleReopenCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !reopenReason) return;
    setReopeningCase(true);
    try {
      await api.reopenEnforcementCase(caseId, reopenReason, reopenComments);
      setShowReopenModal(false);
      setReopenReason('');
      setReopenComments('');
      await loadCase();
    } catch (err: any) {
      alert(err.message || 'Failed to reopen enforcement case.');
    } finally {
      setReopeningCase(false);
    }
  };

  const handleTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !targetStatus || !transitionReason) return;
    setTransitioning(true);
    try {
      await api.transitionEnforcementCase(caseId, targetStatus, transitionReason);
      setShowTransitionModal(false);
      setTargetStatus('');
      setTransitionReason('');
      await loadCase();
    } catch (err: any) {
      alert(err.message || 'Failed to transition case status.');
    } finally {
      setTransitioning(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNoticeId(id);
    setTimeout(() => {
      setCopiedNoticeId(null);
    }, 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
      case 'INVESTIGATION':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'PENALTY_REVIEW':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30';
      case 'NOTICE_ISSUED':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30';
      case 'HEARING':
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'CLOSED':
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'LOW':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <Gavel className="w-5 h-5 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Loading Enforcement Docket</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Fetching legal contraventions, statutory notices, and penalty ledger…</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Enforcement Docket Not Found</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          The requested legal docket reference does not exist or you lack official authorization to inspect it.
        </p>
        <button
          onClick={() => navigate('/enforcement')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Enforcement Docket</span>
        </button>
      </div>
    );
  }

  const isClosed = caseData.status === 'CLOSED';
  const latestPenalty = caseData.penalties && caseData.penalties.length > 0 ? caseData.penalties[0] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── Top Header & Command Bar ───────────────────────────────── */}
      <div className="bg-white dark:bg-[#101A2C] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <button
              onClick={() => navigate('/enforcement')}
              className="p-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Return to Enforcement Docket"
              aria-label="Return to Enforcement Docket"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  {caseData.case_reference}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(caseData.status)}`}>
                  {caseData.status}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getSeverityBadge(caseData.severity)}`}>
                  {caseData.severity} SEVERITY
                </span>
                {caseData.jurisdiction_state && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{caseData.jurisdiction_district ? `${caseData.jurisdiction_district}, ` : ''}{caseData.jurisdiction_state}</span>
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {caseData.product_name}
              </h1>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {!isClosed ? (
              <>
                <button
                  onClick={openAssignModal}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{caseData.assigned_officer ? 'Reassign' : 'Assign Officer'}</span>
                </button>

                <button
                  onClick={() => setShowPenaltyModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Evaluate Penalty</span>
                </button>

                <button
                  onClick={() => setShowNoticeModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Issue SCN Notice</span>
                </button>

                <button
                  onClick={() => setShowTransitionModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>Update State</span>
                </button>

                <button
                  onClick={() => setShowCloseModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-300 dark:border-rose-800/50 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Close Case</span>
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Case Closed ({caseData.closure_reason || 'Resolved / Archived'})</span>
                </div>
                <button
                  onClick={() => setShowReopenModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reopen Case</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Docket Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#173B57]/20 border border-slate-200/70 dark:border-slate-800/70">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Investigating Officer</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate block">
              {caseData.assigned_officer ? `@${caseData.assigned_officer}` : 'Unassigned'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#173B57]/20 border border-slate-200/70 dark:border-slate-800/70">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Violations Recorded</span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
              {caseData.violations?.length || 0} Statutory Items
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#173B57]/20 border border-slate-200/70 dark:border-slate-800/70">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Statutory Fine Assessment</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
              {latestPenalty ? `₹${latestPenalty.estimated_fine_inr.toLocaleString('en-IN')}` : 'Pending Evaluation'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#173B57]/20 border border-slate-200/70 dark:border-slate-800/70">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Notices Served</span>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 block">
              {caseData.notices?.length || 0} Notice(s)
            </span>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'Docket Overview', icon: Layers, count: null },
          { id: 'VIOLATIONS', label: 'Violations', icon: AlertTriangle, count: caseData.violations.length },
          { id: 'PENALTIES', label: 'Penalty Ledger', icon: Scale, count: caseData.penalties.length },
          { id: 'NOTICES', label: 'Statutory Notices', icon: FileText, count: caseData.notices.length },
          { id: 'TIMELINE', label: 'Audit Timeline', icon: Clock, count: caseData.timeline.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab 1: Docket Overview ─────────────────────────────────── */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Violation & Case Summary */}
            <div className="bg-white dark:bg-[#101A2C] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Violation & Case Summary</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Docket ID: <strong className="font-mono text-slate-700 dark:text-slate-300">{caseData.id}</strong>
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
                  {caseData.violation_summary || 'No summary notes specified for this legal metrology contravention.'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">State Jurisdiction</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{caseData.jurisdiction_state || 'National / Central Directorate'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">District Jurisdiction</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{caseData.jurisdiction_district || 'Directorate HQ'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Investigating Officer</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {caseData.assigned_officer ? `@${caseData.assigned_officer}` : 'Unassigned'}
                    </span>
                  </div>
                  {!isClosed && (
                    <button
                      onClick={openAssignModal}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {caseData.assigned_officer ? 'Change' : 'Assign'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Linked Source Packaging Screening */}
            {caseData.source_analysis && (
              <div className="bg-white dark:bg-[#101A2C] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-500" />
                    <span>Source Packaging Inspection Evidence</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/results/${caseData.analysis_id}`)}
                      className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-500 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <span>Inspection Report</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    {caseData.review_id && (
                      <button
                        onClick={() => navigate(`/reviews/${caseData.review_id}`)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 font-semibold ml-2 cursor-pointer"
                      >
                        <span>Audit Review</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                  {caseData.source_analysis.image_filename ? (
                    <img
                      src={`/api/images/${caseData.source_analysis.image_filename}`}
                      alt="Package specimen evidence"
                      className="w-20 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 bg-white"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <Layers className="w-8 h-8" />
                    </div>
                  )}

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {caseData.source_analysis.product_name || caseData.product_name}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>Screening Score:</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                        {caseData.source_analysis.score ?? 'N/A'}/100
                      </span>
                      <span>·</span>
                      <span>Screening Status: <strong className="text-slate-700 dark:text-slate-300">{caseData.source_analysis.status}</strong></span>
                    </div>
                    {caseData.source_analysis.barcode && (
                      <div className="text-xs text-slate-500 font-mono">
                        GTIN / Barcode: {caseData.source_analysis.barcode}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Statutory Status & Details */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#101A2C] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Gavel className="w-4 h-4 text-indigo-500" />
                <span>Statutory Docket Metadata</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Opened Timestamp</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{new Date(caseData.opened_at).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Initiating Officer</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">@{caseData.created_by}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Enforcement Authority</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{caseData.organization_id}</span>
                </div>
                {caseData.merchant_organization_id && (
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Target Merchant Org</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{caseData.merchant_organization_id}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Notices Served</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">{caseData.notices.length} Show-Cause Notice(s)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 dark:text-slate-400">Estimated Fine</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {latestPenalty ? `₹${latestPenalty.estimated_fine_inr.toLocaleString('en-IN')}` : 'Not Evaluated'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Helper */}
            <div className="bg-gradient-to-br from-amber-500/10 to-indigo-500/10 border border-amber-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                <FileCheck2 className="w-4 h-4" />
                <span>Statutory Protocol</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Cases under Legal Metrology Act, 2009 require an advisory penalty calculation before issuing official Section 32 Show Cause Notices.
              </p>
              {!isClosed && (
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={() => setShowPenaltyModal(true)}
                    className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold text-center transition-colors cursor-pointer"
                  >
                    Evaluate Penalty Brackets
                  </button>
                  <button
                    onClick={() => setShowNoticeModal(true)}
                    className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold text-center transition-colors cursor-pointer"
                  >
                    Prepare Show Cause Notice
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Detected Violations ─────────────────────────────── */}
      {activeTab === 'VIOLATIONS' && (
        <div className="bg-white dark:bg-[#101A2C] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <span>Detected Packaging Contraventions</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Statutory non-compliances identified under Legal Metrology (Packaged Commodities) Rules, 2011.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 self-start sm:self-auto">
              {caseData.violations.length} Recorded Violations
            </span>
          </div>

          {caseData.violations.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500" />
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Violations Found</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No statutory non-compliances are currently attached to this enforcement docket.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseData.violations.map((v, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-950/80 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                      {v.rule_id || 'STATUTORY RULE'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSeverityBadge(v.severity)}`}>
                      {v.severity.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{v.what}</div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{v.why}</p>
                  </div>

                  {v.source_reference && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Statutory Reference:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{v.source_reference}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Penalty Calculation Ledger ───────────────────────── */}
      {activeTab === 'PENALTIES' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#101A2C] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-500" />
                  <span>Advisory Statutory Penalty Ledger</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Calculated under Section 36(1) and Section 38 of the Legal Metrology Act, 2009.
                </p>
              </div>
              {!isClosed && (
                <button
                  onClick={() => setShowPenaltyModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Scale className="w-4 h-4" />
                  <span>Evaluate Penalty</span>
                </button>
              )}
            </div>

            {caseData.penalties.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Scale className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Penalty Evaluations Recorded</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click "Evaluate Penalty" to calculate the statutory fine range based on the violation severity and prior offence history.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {caseData.penalties.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="bg-slate-50 dark:bg-slate-950/80 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                          ₹{p.estimated_fine_inr.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          (Statutory Bracket: ₹{p.fine_range_min_inr.toLocaleString('en-IN')} – ₹{p.fine_range_max_inr.toLocaleString('en-IN')})
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Evaluated on {new Date(p.calculated_at).toLocaleString('en-IN')} by @{p.calculated_by}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Statutory Basis & Computation Rationale
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-[#101A2C] p-3.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                        {p.basis}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs text-slate-500 mr-1">Applicable Sections:</span>
                      {p.sections?.map((sec, i) => (
                        <span key={i} className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 rounded-md text-[10px] font-semibold">
                          {sec}
                        </span>
                      ))}
                      {p.repeat_offence && (
                        <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 rounded-md text-[10px] font-bold">
                          Subsequent Offence Clause Applied
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 4: Statutory Notices ───────────────────────────────── */}
      {activeTab === 'NOTICES' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#101A2C] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  <span>Statutory Show Cause Notice Ledger</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Court-ready statutory notices issued to manufacturer, packer, or e-commerce entity.
                </p>
              </div>
              {!isClosed && (
                <button
                  onClick={() => setShowNoticeModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
                >
                  <FileText className="w-4 h-4" />
                  <span>Issue New Notice</span>
                </button>
              )}
            </div>

            {caseData.notices.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <FileText className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Notices Issued</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No statutory show-cause notices have been issued for this docket yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {caseData.notices.map((n) => (
                  <div
                    key={n.id}
                    className="bg-slate-50 dark:bg-slate-950/80 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                          {n.notice_reference}
                        </span>
                        <span className="px-2.5 py-0.5 bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 rounded-full text-[10px] font-bold">
                          {n.notice_type}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Issued on {new Date(n.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} by @{n.issued_by}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <div>
                        Recipient Entity: <strong className="text-slate-800 dark:text-white">{n.recipient_name}</strong>
                      </div>
                      <div>
                        Response Window: <strong className="text-amber-600 dark:text-amber-400">{n.deadline_days} days from service</strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <button
                        onClick={() => setSelectedNoticeView(n)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        Inspect Full Notice Text
                      </button>
                      <button
                        onClick={() => copyToClipboard(n.content, n.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        {copiedNoticeId === n.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Text</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 5: Immutable Case Timeline ─────────────────────────── */}
      {activeTab === 'TIMELINE' && (
        <div className="bg-white dark:bg-[#101A2C] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                <span>Immutable Case Audit Trail</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cryptographically tracked lifecycle events and authorized officer interventions.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {caseData.timeline.length} Recorded Events
            </span>
          </div>
          
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {caseData.timeline.map((evt, idx) => (
              <div key={evt.event_id || idx} className="relative space-y-1.5 text-xs">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-white dark:ring-[#101A2C]" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide">
                    {evt.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">by @{evt.actor_username}</span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-slate-500 dark:text-slate-400">{new Date(evt.timestamp).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                  {evt.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal: Calculate Penalty ────────────────────────────────── */}
      {showPenaltyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#101A2C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-500" />
                <span>Evaluate Statutory Penalty</span>
              </h3>
              <button
                onClick={() => setShowPenaltyModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Calculates statutory fine brackets under Section 36(1) and Section 38 of the Legal Metrology Act, 2009 based on violation severity and repeat offence weighting.
            </p>
            
            <form onSubmit={handleCalculatePenalty} className="space-y-4">
              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repeatOffence}
                  onChange={(e) => setRepeatOffence(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Subsequent / Repeat Offence</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Applies higher statutory multiplier under Section 36(2)</span>
                </div>
              </label>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Prior Notices Served</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={priorNotices}
                  onChange={(e) => setPriorNotices(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Evaluation Notes (Optional)</label>
                <input
                  type="text"
                  value={penaltyReason}
                  onChange={(e) => setPenaltyReason(e.target.value)}
                  placeholder="Record compounding remarks or basis..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPenaltyModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={calculatingPenalty}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  {calculatingPenalty ? 'Computing Brackets...' : 'Run Penalty Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Issue SCN Notice ────────────────────────────────── */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#101A2C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                <span>Issue Statutory Show-Cause Notice</span>
              </h3>
              <button
                onClick={() => setShowNoticeModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Generates a legal Show-Cause Notice citing specific packaging contraventions under Rule 32 of Legal Metrology (Packaged Commodities) Rules, 2011.
            </p>
            
            <form onSubmit={handleIssueNotice} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notice Type</label>
                <select
                  value={noticeType}
                  onChange={(e) => setNoticeType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="SHOW_CAUSE">Statutory Show Cause Notice (Rule 32)</option>
                  <option value="COMPOUNDING">Notice of Compounding Offence (Section 48)</option>
                  <option value="SEIZURE_WARNING">Seizure & Inspection Warning Notice</option>
                  <option value="INSPECTION_SUMMONS">Official Summons / Inspection Notice</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Signing Officer Name</label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Officer Designation</label>
                <input
                  type="text"
                  value={officerDesignation}
                  onChange={(e) => setOfficerDesignation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Response Window (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(parseInt(e.target.value) || 15)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuingNotice}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  {issuingNotice ? 'Drafting & Serving...' : 'Issue & Archive Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: View Notice Content ────────────────────────────── */}
      {selectedNoticeView && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#101A2C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  <span>{selectedNoticeView.notice_reference}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Issued on {new Date(selectedNoticeView.issued_at).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedNoticeView(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {selectedNoticeView.content}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => copyToClipboard(selectedNoticeView.content, selectedNoticeView.id)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedNoticeId === selectedNoticeView.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Notice Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Notice</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedNoticeView(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Update Case State ───────────────────────────────── */}
      {showTransitionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#101A2C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-indigo-500" />
                <span>Update Docket Lifecycle State</span>
              </h3>
              <button
                onClick={() => setShowTransitionModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleTransition} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Lifecycle State</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                >
                  <option value="">Select target state...</option>
                  <option value="INVESTIGATION">INVESTIGATION</option>
                  <option value="PENALTY_REVIEW">PENALTY_REVIEW</option>
                  <option value="NOTICE_ISSUED">NOTICE_ISSUED</option>
                  <option value="HEARING">HEARING</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Official Justification</label>
                <textarea
                  rows={3}
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  placeholder="Record formal justification for stage transition..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransitionModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transitioning}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  {transitioning ? 'Updating State...' : 'Confirm Transition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Close Case ──────────────────────────────────────── */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#101A2C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-500" />
                <span>Formally Close Enforcement Case</span>
              </h3>
              <button
                onClick={() => setShowCloseModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Archived enforcement cases remain fully auditable in the immutable timeline.
            </p>
            
            <form onSubmit={handleCloseCase} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Resolution Type</label>
                <select
                  value={resolutionType}
                  onChange={(e) => setResolutionType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="COMPOUNDED">Compounded (Fine Paid)</option>
                  <option value="COMPLIED">Complied with Advisory / Packaging Corrected</option>
                  <option value="PROSECUTION_INITIATED">Prosecution Initiated in Court</option>
                  <option value="DISMISSED">Dismissed / No Statutory Offence</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Closure Reason</label>
                <textarea
                  rows={3}
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  placeholder="Mandatory summary of statutory case resolution..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={closingCase}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  {closingCase ? 'Archiving...' : 'Close & Archive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Reopen Case ──────────────────────────────────────── */}
      {showReopenModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#101A2C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-500" />
                <span>Reopen Enforcement Docket</span>
              </h3>
              <button
                onClick={() => setShowReopenModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Reactivates the closed enforcement docket for further statutory investigation or subsequent non-compliance.
            </p>
            
            <form onSubmit={handleReopenCase} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reopen Justification</label>
                <textarea
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Record formal statutory justification for reopening..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Additional Instructions (Optional)</label>
                <input
                  type="text"
                  value={reopenComments}
                  onChange={(e) => setReopenComments(e.target.value)}
                  placeholder="Officer notes or instructions..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reopeningCase}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  {reopeningCase ? 'Reactivating...' : 'Confirm Reopen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Assign Enforcement Officer ───────────────────────── */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#101A2C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-500" />
                <span>Assign Enforcement Case</span>
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignOfficer} className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Target Legal Docket</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{caseData.product_name}</p>
                <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">{caseData.case_reference}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Select Enforcement Officer</label>
                <select
                  value={selectedEnforcementOfficer}
                  onChange={(e) => setSelectedEnforcementOfficer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                >
                  <option value="">Choose qualified officer...</option>
                  {enforcementOfficers.map((o) => (
                    <option key={o.username} value={o.username}>
                      {o.full_name || o.username} ({o.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Assignment Instructions / Notes</label>
                <textarea
                  rows={3}
                  value={assignComments}
                  onChange={(e) => setAssignComments(e.target.value)}
                  placeholder="Record formal instructions for the assigned officer..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedEnforcementOfficer || assigningOfficer}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  {assigningOfficer ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
