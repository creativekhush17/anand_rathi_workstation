import React, { useState, useEffect } from 'react';
import { 
  Search, ChevronDown, Menu, Sparkles, User, Settings, LogOut, 
  Building, Server, Calendar, X, Shield, Mail, Phone, Award, CheckCircle2 
} from 'lucide-react';
import { checkApiHealth } from '../services/api';

interface HeaderProps {
  onSearch: (query: string) => void;
  employeeName: string;
  role: string;
  branch?: string;
  employeeId?: string;
  onToggleSidebar?: () => void;
  onLogout?: () => void;
  onNavigate?: (view: string) => void;
}

export default function Header({ 
  onSearch, 
  employeeName, 
  role, 
  branch = 'Jodhpur Hub', 
  employeeId,
  onToggleSidebar, 
  onLogout,
  onNavigate 
}: HeaderProps) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    checkApiHealth().then((isLive) => {
      if (mounted) setIsBackendConnected(isLive);
    });
    const interval = setInterval(() => {
      checkApiHealth().then((isLive) => {
        if (mounted) setIsBackendConnected(isLive);
      });
    }, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Dynamic Greeting based on current system hour
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleOpenProfile = () => {
    setShowProfileDropdown(false);
    setShowProfileModal(true);
  };

  const handleOpenSettings = () => {
    setShowProfileDropdown(false);
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  return (
    <>
      <header className="bg-brand-sidebar-bg border border-brand-border rounded-[24px] shadow-sm flex items-center justify-between sticky top-0 z-20 w-full px-6 py-3.5">
        {/* Title & Greeting with Menu toggle for mobile */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              id="btn-sidebar-toggle"
              onClick={onToggleSidebar}
              className="p-2 bg-brand-card-bg border border-brand-border rounded-lg text-brand-text-muted hover:text-brand-gold md:hidden focus:outline-none transition-colors"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="text-left">
            <h1 className="text-sm sm:text-base md:text-lg font-display font-semibold text-brand-text flex items-center gap-1.5">
              <span className="hidden sm:inline">{getGreeting()},</span> {employeeName} <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
            </h1>
            <p className="hidden md:block text-[11px] text-brand-text-muted mt-0.5">
              Here’s what’s happening with your private wealth operations today.
            </p>
          </div>
        </div>

        {/* Header Actions - Symmetrically Aligned */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Live Date Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-brand-card-bg border border-brand-border rounded-full text-[11px] font-bold text-[#B68A2F] shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-[#B68A2F]" />
            <span>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>

          {/* Search Bar - Clean & Responsive */}
          <div className="relative w-36 sm:w-48 md:w-60 lg:w-72">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="header-search-input"
              type="text"
              placeholder="Search clients, transactions..."
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-[11px] sm:text-xs bg-brand-card-bg border border-brand-border rounded-full focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all font-sans text-brand-text shadow-xs placeholder:text-brand-text-muted/70"
            />
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              id="btn-header-profile"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 focus:outline-none p-1 sm:px-2 sm:py-1 rounded-full border border-transparent hover:border-brand-border hover:bg-brand-card-bg/60 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold font-bold text-[11px] uppercase shadow-inner">
                {employeeName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-brand-text leading-tight">{employeeName}</div>
                <div className="text-[10px] text-brand-text-muted">{role}</div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-brand-text-muted hover:text-brand-gold cursor-pointer transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showProfileDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowProfileDropdown(false)} 
                />
                <div className="absolute right-0 mt-2 w-64 bg-brand-sidebar-bg border border-brand-border rounded-2xl shadow-xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-150 text-left overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-brand-border/50 bg-brand-card-bg/50">
                    <p className="text-xs font-bold text-brand-text">{employeeName}</p>
                    <p className="text-[10px] text-brand-text-muted mt-0.5">{role}</p>
                    <button 
                      onClick={handleOpenSettings}
                      className="flex items-center gap-1.5 text-[10px] text-brand-gold font-semibold mt-1.5 hover:underline cursor-pointer"
                    >
                      <Building className="w-3 h-3 text-brand-gold" />
                      <span>{branch}</span>
                    </button>
                  </div>
                  
                  <div className="py-1">
                    <button
                      id="btn-dropdown-my-profile"
                      onClick={handleOpenProfile}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-brand-text hover:bg-brand-gold/10 hover:text-brand-gold transition-colors font-medium cursor-pointer"
                    >
                      <User className="w-4 h-4 text-brand-gold" />
                      <span>My Profile</span>
                    </button>
                    <button
                      id="btn-dropdown-account-settings"
                      onClick={handleOpenSettings}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-brand-text hover:bg-brand-gold/10 hover:text-brand-gold transition-colors font-medium cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-brand-gold" />
                      <span>Account Settings</span>
                    </button>
                  </div>

                  {/* PostgreSQL connection status discreetly in profile menu */}
                  <div className="flex items-center justify-between px-4 py-2 text-[10px] border-t border-brand-border/40 bg-brand-primary-bg/30">
                    <span className="flex items-center gap-1.5 font-medium text-brand-text-muted">
                      <Server className="w-3 h-3 text-brand-gold" />
                      Database
                    </span>
                    {isBackendConnected === true ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        PostgreSQL Live
                      </span>
                    ) : isBackendConnected === false ? (
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Offline
                      </span>
                    ) : (
                      <span className="text-brand-text-muted">Checking...</span>
                    )}
                  </div>

                  <div className="border-t border-brand-border/40 pt-1">
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-500/10 transition-colors font-semibold cursor-pointer"
                      id="btn-logout"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Interactive My Profile Modal Dialog */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in text-left">
          <div className="bg-brand-card-bg border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-up relative">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-brand-primary-bg text-brand-text-muted hover:text-brand-text transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-4 border-b border-brand-border pb-5">
              <div className="w-14 h-14 rounded-2xl bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold font-display font-bold text-lg shadow-inner">
                {employeeName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-text flex items-center gap-1.5">
                  {employeeName}
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </h3>
                <span className="inline-block mt-0.5 px-2 py-0.5 bg-brand-gold/10 text-brand-gold text-[10px] font-bold rounded-full border border-brand-gold/20">
                  {role}
                </span>
                <p className="text-[10px] text-brand-text-muted mt-1 flex items-center gap-1">
                  <Building className="w-3 h-3 text-brand-gold" /> {branch}
                </p>
              </div>
            </div>

            {/* Profile Details List */}
            <div className="py-4 space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-brand-primary-bg/50 border border-brand-border/60">
                <span className="text-brand-text-muted flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-brand-gold" /> Employee Code
                </span>
                <span className="font-mono font-bold text-brand-text">{employeeId || 'AR-EMP-1001'}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-brand-primary-bg/50 border border-brand-border/60">
                <span className="text-brand-text-muted flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-brand-gold" /> Corporate Email
                </span>
                <span className="font-semibold text-brand-text">
                  {employeeName.toLowerCase().replace(/\s+/g, '.')}@rathi.com
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-brand-primary-bg/50 border border-brand-border/60">
                <span className="text-brand-text-muted flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-brand-gold" /> Office Phone
                </span>
                <span className="font-semibold text-brand-text">+91 98290 12345</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-brand-primary-bg/50 border border-brand-border/60">
                <span className="text-brand-text-muted flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-brand-gold" /> SEBI Certification
                </span>
                <span className="font-bold text-brand-gold">RIA Registered (2028)</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="border-t border-brand-border pt-4 flex gap-2 justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 border border-brand-border rounded-xl text-xs font-semibold text-brand-text-muted hover:bg-brand-primary-bg transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  handleOpenSettings();
                }}
                className="px-4 py-2 bg-brand-gold hover:bg-brand-gold-accent text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" /> Full Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
