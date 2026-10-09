import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  FolderOpen,
  Search,
  Scale,
  FileText,
  CheckCircle2,
  UserCheck,
  RefreshCw,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type {
  EnforcementCaseSummary,
  EnforcementDashboardMetrics,
  EnforcementCaseStatus,
  EnforcementCaseSeverity
} from '../types';

export default function EnforcementDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<EnforcementDashboardMetrics | null>(null);
  const [cases, setCases] = useState<EnforcementCaseSummary[]>([]);
  const [totalCases, setTotalCases] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [officerFilter, setOfficerFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [mRes, cRes] = await Promise.all([
        api.getEnforcementDashboard(),
        api.listEnforcementCases({
          status: statusFilter,
          severity: severityFilter,
          assigned_officer: officerFilter === 'ME' ? user?.username : undefined,
          search: searchQuery || undefined,
          page_size: 100
        })
      ]);
      setMetrics(mRes);
      setCases(cRes.cases || []);
      setTotalCases(cRes.total || 0);
    } catch (err) {
      console.error('Failed to load enforcement dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, severityFilter, officerFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const getStatusBadge = (status: EnforcementCaseStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
      case 'INVESTIGATION':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
      case 'PENALTY_REVIEW':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20';
      case 'NOTICE_ISSUED':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
      case 'HEARING':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
      case 'CLOSED':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
    }
  };

  const getSeverityBadge = (severity: EnforcementCaseSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30';
      case 'LOW':
        return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30';
      default:
        return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#173B57] to-[#101A2C] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xs relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 shadow-xs">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Enforcement Case Management
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                DoCA Legal Metrology
              </span>
            </div>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Manage statutory legal enforcement proceedings, evaluate penalties under Section 36/38 of the Legal Metrology Act, 2009, issue show-cause notices, and track judicial resolution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl border border-white/15 text-sm font-medium transition-all shadow-xs active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-300' : ''}`} />
              <span>Refresh Docket</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl p-4 space-y-2 shadow-xs transition-all hover:border-slate-300 dark:hover:border-white/20">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Active Cases</span>
              <FolderOpen className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{metrics.total_active_cases}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{metrics.open_cases} Open · {metrics.investigation_cases} Inves.</div>
          </div>

          <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl p-4 space-y-2 shadow-xs transition-all hover:border-slate-300 dark:hover:border-white/20">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Assigned To Me</span>
              <UserCheck className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{metrics.assigned_to_me}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Your direct caseload</div>
          </div>

          <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl p-4 space-y-2 shadow-xs transition-all hover:border-slate-300 dark:hover:border-white/20">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Penalty Review</span>
              <Scale className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{metrics.penalty_review_cases}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Sanction determination</div>
          </div>

          <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl p-4 space-y-2 shadow-xs transition-all hover:border-slate-300 dark:hover:border-white/20">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Notices Issued</span>
              <FileText className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{metrics.notices_issued_cases}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{metrics.total_notices_served} Total served</div>
          </div>

          <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl p-4 space-y-2 shadow-xs transition-all hover:border-slate-300 dark:hover:border-white/20">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Penalties Est.</span>
              <Scale className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
              ₹{(metrics.total_penalties_estimated_inr || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Advisory statutory sum</div>
          </div>

          <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl p-4 space-y-2 shadow-xs transition-all hover:border-slate-300 dark:hover:border-white/20">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Resolved / Closed</span>
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
              {metrics.resolved_cases + metrics.closed_cases}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{metrics.closed_cases} Archived cases</div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl p-4 space-y-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by case reference (e.g. MC-ENF-2026-...), product name, or violation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="INVESTIGATION">Investigation</option>
              <option value="PENALTY_REVIEW">Penalty Review</option>
              <option value="NOTICE_ISSUED">Notice Issued</option>
              <option value="HEARING">Hearing</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={officerFilter}
              onChange={(e) => setOfficerFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="ALL">All Officers</option>
              <option value="ME">Assigned to Me</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-[#173B57] to-slate-900 dark:from-teal-600 dark:to-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:opacity-95 transition-all"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Enforcement Cases List */}
      <div className="bg-white dark:bg-[#101A2C] border border-slate-200/90 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Enforcement Case Docket</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{totalCases} total case(s) found</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-500" />
            <p className="text-sm font-medium">Loading enforcement dockets...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
              <FolderOpen className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">No Enforcement Cases Match Your Filter</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Cases are created directly from escalated packaging compliance reviews or through statutory docket opening.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-white/10">
                  <th className="py-3 px-4">Case Reference</th>
                  <th className="py-3 px-4">Product / Target</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Officer</th>
                  <th className="py-3 px-4">Notices</th>
                  <th className="py-3 px-4">Opened Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/enforcement/cases/${c.id}`)}
                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-600 dark:text-teal-400 group-hover:underline">
                      {c.case_reference}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">{c.product_name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{c.jurisdiction_state || 'National Jurisdiction'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getSeverityBadge(c.severity)}`}>
                        {c.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${getStatusBadge(c.status)}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.assigned_officer ? (
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>@{c.assigned_officer}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.notice_count > 0 ? (
                        <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 rounded-full font-semibold text-[10px]">
                          {c.notice_count} notice{c.notice_count > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {c.opened_at ? new Date(c.opened_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/enforcement/cases/${c.id}`);
                        }}
                        className="p-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-medium transition-colors inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

