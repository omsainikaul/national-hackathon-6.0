import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useWorkspace, WORKSPACE_DEFINITIONS } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { type WorkspaceType } from '../../types';
import { Menu, ChevronRight, SearchCheck, ShieldAlert, Store, Lock, Check, UserCircle2, Clock, Zap } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import LanguageSelector from '../ui/LanguageSelector';

export default function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { currentWorkspace, setWorkspace, workspaceInfo, isWorkspaceAllowed } = useWorkspace();
  const { t } = useLanguage();
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  
  const getPageInfo = () => {
    const path = location.pathname;
    if (path === '/') {
      return { 
        title: `${workspaceInfo.shortLabel} ${t('navigation.dashboard')}`, 
        subtitle: `${workspaceInfo.tagline} • Legal Metrology & FSSAI Compliance Overview`,
        breadcrumb: t('navigation.dashboard')
      };
    }
    if (path.startsWith('/demo')) {
      return { 
        title: t('navigation.demo_mode'), 
        subtitle: 'Benchmark Packaging Scenarios for Evaluation',
        breadcrumb: t('navigation.demo_mode')
      };
    }
    if (path.startsWith('/analyze')) {
      return { 
        title: currentWorkspace === 'AUDIT' ? t('navigation.technical_packaging_verification') : t('navigation.statutory_compliance_inspection'), 
        subtitle: t('analysis.subtitle'),
        breadcrumb: currentWorkspace === 'MERCHANT' ? t('navigation.overview') : t('navigation.screening')
      };
    }
    if (path.startsWith('/results')) {
      return { 
        title: t('results.title'), 
        subtitle: 'Statutory rule findings, OCR evidence localization & corrective actions',
        breadcrumb: t('results.title')
      };
    }
    if (path.startsWith('/history')) {
      return { 
        title: currentWorkspace === 'ENFORCEMENT' ? 'Inspection Case Records' : currentWorkspace === 'AUDIT' ? 'Audited Compliance Logs' : t('navigation.screening_history'), 
        subtitle: 'Audited commodity screenings and historical compliance reports',
        breadcrumb: t('navigation.screening_history')
      };
    }
    if (path.startsWith('/rules')) {
      return { 
        title: t('navigation.compliance_rules'), 
        subtitle: 'Legal Metrology (Packaged Commodities) Rules 2011 & FSSAI Regulations',
        breadcrumb: t('navigation.compliance_rules')
      };
    }
    if (path.startsWith('/admin/users')) {
      return { 
        title: t('navigation.user_management'), 
        subtitle: 'Provision authorized officers, manage roles, and enforce workspace access',
        breadcrumb: `${t('navigation.administration')} / ${t('navigation.user_management')}`
      };
    }
    if (path.startsWith('/admin/officer-requests')) {
      return { 
        title: 'Officer Access Requests', 
        subtitle: 'Review, approve, or reject official Audit & Enforcement credential requests',
        breadcrumb: `${t('navigation.administration')} / Officer Requests`
      };
    }
    if (path.startsWith('/admin/audit-logs')) {
      return { 
        title: t('navigation.security_audit_logs'), 
        subtitle: 'Immutable chronological record of administrative actions and security events',
        breadcrumb: `${t('navigation.administration')} / ${t('navigation.security_audit_logs')}`
      };
    }
    if (path.startsWith('/settings')) {
      return { 
        title: t('navigation.settings'), 
        subtitle: 'Manage recovery email, password, and session preferences',
        breadcrumb: t('navigation.settings')
      };
    }
    return { title: 'MetrCheck AI', subtitle: '', breadcrumb: '' };
  };

  const pageInfo = getPageInfo();

  // Close workspace dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setWorkspaceDropdownOpen(false);
      }
    };
    if (workspaceDropdownOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [workspaceDropdownOpen]);

  return (
    <div className="flex h-screen bg-slate-50/70 dark:bg-[#0A101D] overflow-hidden font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">
      {/* Skip to Main Content Link for Keyboard / Screen Reader Accessibility */}
      <a href="#main-content" className="skip-to-content">
        {t('layout.skip_to_content')}
      </a>

      {/* Sidebar Navigation */}
      <Sidebar 
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top App Header */}
        <header className="bg-white dark:bg-[#101A2C] border-b border-slate-200 dark:border-white/10 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 relative z-30 transition-colors duration-200">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#173B57]/50 rounded-lg md:hidden transition-colors cursor-pointer"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb & Title */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-400 font-medium">
                <Link to="/" className="hover:text-[#173B57] dark:hover:text-[#35C6B0] transition-colors">MetrCheck</Link>
                {pageInfo.breadcrumb && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                    <span className="text-slate-600 dark:text-slate-300 truncate">{pageInfo.breadcrumb}</span>
                  </>
                )}
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate tracking-tight leading-tight">
                {pageInfo.title}
              </h1>
            </div>
          </div>

          {/* Right Header: Global Language, Workspace Switcher, Badges & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Global Report Language Selector */}
            <LanguageSelector compact={true} />

            {/* Workspace Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setWorkspaceDropdownOpen(prev => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  currentWorkspace === 'ENFORCEMENT'
                    ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/80 shadow-2xs hover:bg-amber-500/15'
                    : currentWorkspace === 'AUDIT'
                    ? 'bg-[#173B57]/10 dark:bg-[#173B57]/60 text-[#173B57] dark:text-[#5EEAD4] border-[#173B57]/20 dark:border-[#35C6B0]/30 shadow-2xs hover:bg-[#173B57]/15'
                    : currentWorkspace === 'MERCHANT'
                    ? 'bg-sky-500/10 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800 shadow-2xs hover:bg-sky-500/15'
                    : 'bg-emerald-500/10 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-2xs hover:bg-emerald-500/15'
                }`}
                title="Switch Active Workspace"
                aria-expanded={workspaceDropdownOpen}
                aria-label="Switch active workspace"
              >
                {currentWorkspace === 'ENFORCEMENT' ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                ) : currentWorkspace === 'AUDIT' ? (
                  <SearchCheck className="w-3.5 h-3.5 text-[#173B57] dark:text-[#35C6B0]" />
                ) : currentWorkspace === 'MERCHANT' ? (
                  <Store className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                ) : (
                  <UserCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
                <span className="hidden sm:inline font-bold">{workspaceInfo.label}</span>
                <span className="sm:hidden font-bold">{workspaceInfo.shortLabel}</span>
              </button>

              {workspaceDropdownOpen && (
                <>
                  {/* Backdrop overlay */}
                  <div 
                    className="fixed inset-0 z-40 bg-slate-950/20 dark:bg-slate-950/60 backdrop-blur-[0.5px]" 
                    onClick={() => setWorkspaceDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#101A2C] border border-slate-200 dark:border-white/10 shadow-2xl p-2.5 z-50 space-y-1.5 ring-1 ring-black/5 animate-in fade-in duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">{t('layout.active_workspace')}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-semibold">
                        {t('layout.role')}: {user?.role === 'ADMIN' ? t('roles.admin') : user?.role === 'ENFORCEMENT_OFFICER' ? t('roles.enforcement_officer') : user?.role === 'AUDIT_OFFICER' ? t('roles.audit_officer') : user?.role === 'MERCHANT_PUBLIC' ? t('roles.merchant') : 'Consumer'}
                      </span>
                    </div>

                    {(['USER', 'MERCHANT', 'AUDIT', 'ENFORCEMENT'] as WorkspaceType[]).map(wsKey => {
                      const info = WORKSPACE_DEFINITIONS[wsKey];
                      const isSelected = currentWorkspace === wsKey;
                      const isAllowed = isWorkspaceAllowed(wsKey);

                      const getIcon = () => {
                        if (wsKey === 'ENFORCEMENT') return <ShieldAlert className="w-4 h-4 text-amber-500" />;
                        if (wsKey === 'AUDIT') return <SearchCheck className="w-4 h-4 text-[#35C6B0]" />;
                        if (wsKey === 'MERCHANT') return <Store className="w-4 h-4 text-sky-500" />;
                        return <UserCircle2 className="w-4 h-4 text-emerald-500" />;
                      };

                      if (!isAllowed) {
                        return (
                          <div
                            key={wsKey}
                            className="w-full p-2.5 rounded-xl text-xs bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 opacity-65 flex flex-col gap-0.5 cursor-not-allowed select-none"
                            title="Requires authorized role credentials"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                {getIcon()}
                                {info.label}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                <Lock className="w-3 h-3" /> {t('layout.locked')}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                              Requires authorized credentials.
                            </span>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={wsKey}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWorkspace(wsKey);
                            setWorkspaceDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex flex-col gap-1 cursor-pointer relative z-50 ${
                            isSelected 
                              ? 'bg-[#173B57]/10 dark:bg-[#173B57]/70 border border-[#173B57]/20 dark:border-[#35C6B0]/40 text-slate-900 dark:text-white font-medium' 
                              : 'hover:bg-slate-100 dark:hover:bg-[#173B57]/40 text-slate-700 dark:text-slate-300 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1.5">
                              {getIcon()}
                              {info.label}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider border ${
                                info.coreAction === 'CHECK'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50'
                                  : info.coreAction === 'PREVENT'
                                  ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200/50 dark:border-sky-800/50'
                                  : info.coreAction === 'VERIFY'
                                  ? 'bg-teal-100 dark:bg-[#173B57] text-[#173B57] dark:text-[#5EEAD4] border-teal-200/50 dark:border-[#35C6B0]/30'
                                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50'
                              }`}>
                                {info.coreAction}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] font-bold text-[#173B57] dark:text-[#35C6B0] px-1.5 py-0.5 rounded-md bg-[#173B57]/10 dark:bg-[#35C6B0]/20 flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> {t('layout.active')}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                            {info.tagline}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {location.pathname.startsWith('/demo') ? (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>PRECOMPUTED DEMO</span>
              </span>
            ) : location.pathname.startsWith('/analyze') ? (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 shadow-2xs">
                <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>LIVE AI SCANNER</span>
              </span>
            ) : null}

            {/* Theme Toggle Button */}
            <ThemeToggle />
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 focus:outline-none">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
