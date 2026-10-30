import React from 'react';
import { ROLE_ALLOWED_MODULES } from '../config/rbac';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Layers, 
  Percent, 
  LineChart, 
  Award, 
  ShieldAlert, 
  Receipt, 
  FileText, 
  BookOpen, 
  BarChart3, 
  FolderLock, 
  CheckSquare, 
  Calendar, 
  Mail, 
  Settings, 
  Headphones,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  userRole?: string;
  unreadMessagesCount?: number;
  pendingTasksCount?: number;
}

export default function Sidebar({ currentView, onViewChange, onLogout, isOpen = false, onClose, userRole, unreadMessagesCount = 0, pendingTasksCount = 0 }: SidebarProps) {
  const isInvestmentsActive = currentView === 'investments' || 
    ['mutual-funds', 'bonds', 'equity', 'pms', 'insurance', 'loans'].includes(currentView);

  const [isInvestmentsExpanded, setIsInvestmentsExpanded] = React.useState(isInvestmentsActive);

  // Sync expanded state only when active state changes (entering/leaving investments view)
  React.useEffect(() => {
    if (isInvestmentsActive) {
      setIsInvestmentsExpanded(true);
    } else {
      setIsInvestmentsExpanded(false);
    }
  }, [isInvestmentsActive]);

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { 
      id: 'investments', 
      label: 'Investments', 
      icon: TrendingUp,
      subItems: [
        { id: 'mutual-funds', label: 'Mutual Funds', icon: Layers },
        { id: 'bonds', label: 'Bonds & Fixed Income', icon: Percent },
        { id: 'equity', label: 'Equity', icon: LineChart },
        { id: 'pms', label: 'PMS', icon: Award },
        { id: 'insurance', label: 'Insurance', icon: ShieldAlert },
        { id: 'loans', label: 'Loans', icon: Receipt },
      ]
    },
    { id: 'research', label: 'Research & Insights', icon: BookOpen },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'documents', label: 'Documents', icon: FolderLock },
    { id: 'tasks', label: 'Tasks & Follow-ups', icon: CheckSquare, badge: pendingTasksCount },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: Mail, badge: unreadMessagesCount },
    { id: 'compliance', label: 'Compliance', icon: ShieldAlert },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const allowedIds = userRole ? (ROLE_ALLOWED_MODULES[userRole] || ROLE_ALLOWED_MODULES['Relationship Manager']) : null;
  const menuItems = allowedIds ? allMenuItems.filter(item => allowedIds.includes(item.id)) : allMenuItems;

  // Helper to check if an item or its subitems are active
  const isItemActive = (item: typeof menuItems[0]) => {
    if (currentView === item.id) return true;
    if (item.subItems) {
      return item.subItems.some(sub => currentView === sub.id);
    }
    return false;
  };

  return (
    <aside 
      id="ar-sidebar" 
      className={`w-64 bg-brand-sidebar-bg border border-brand-border rounded-[24px] shadow-sm flex flex-col fixed left-4 top-4 bottom-4 z-30 transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+24px)]'
      }`}
    >
      {/* Brand Header */}
      <div className="py-4 px-3 text-center border-b border-brand-border/60 flex items-center justify-between md:justify-center relative">
        <div className="flex-1 text-center">
          <div 
            style={{ 
              fontFamily: "'Cormorant SC', serif",
              fontSize: '30px',
              paddingTop: '0px',
              marginTop: '9px',
              lineHeight: '32px'
            }} 
            className="text-2xl font-semibold tracking-wide text-[#a86b00]"
          >
            AnandRathi
          </div>
          <div 
            style={{ 
              fontFamily: "'Lato', sans-serif",
              fontSize: '12px',
              lineHeight: '14px'
            }} 
            className="text-[10px] uppercase font-bold tracking-[0.4em] text-[#3d3d3d] mt-1"
          >
            workstation
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-md text-brand-text-muted hover:text-brand-gold hover:bg-brand-primary-bg/50 transition-colors focus:outline-none absolute right-2 top-1/2 -translate-y-1/2"
            aria-label="Close Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div 
        style={{
          fontSize: '17px',
          lineHeight: '23px',
          paddingBottom: '12px',
          paddingTop: '12px',
          paddingRight: '13px',
          paddingLeft: '9px',
          width: '253.4px',
          height: '476.413px',
          textAlign: 'right',
          fontWeight: 'normal'
        }}
        className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto"
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item);
          const isDirectActive = currentView === item.id;

          return (
            <div key={item.id} className="space-y-0.5">
              <button
                id={`sidebar-link-${item.id}`}
                onClick={() => {
                  if (item.id === 'investments') {
                    setIsInvestmentsExpanded(prev => !prev);
                  } else {
                    onViewChange(item.id);
                    if (onClose) onClose(); // Close on click for mobile
                  }
                }}
                style={item.id === 'dashboard' ? {
                  paddingRight: '10px',
                  paddingBottom: '6px',
                  paddingTop: '6px',
                  marginRight: '0px',
                  marginBottom: '0px',
                  marginTop: '0px',
                  paddingLeft: '11px',
                  fontSize: '13px'
                } : undefined}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                  isDirectActive && !item.subItems
                    ? 'bg-brand-gold text-white shadow-sm'
                    : isActive
                      ? 'text-brand-gold bg-brand-gold/5'
                      : 'text-brand-text hover:bg-brand-secondary-bg hover:text-brand-text'
                }`}
              >
                <div 
                  style={item.id === 'dashboard' ? {
                    fontSize: '21px'
                  } : undefined}
                  className="flex items-center gap-2"
                >
                  <Icon style={{ color: isDirectActive && !item.subItems ? '#ffffff' : '#b68a2f' }} className="w-3.5 h-3.5" />
                  <span 
                    style={item.id === 'dashboard' ? {
                      fontSize: '13px'
                    } : undefined}
                    className="truncate max-w-[120px]"
                  >
                    {item.label}
                  </span>
                </div>
                {item.id === 'investments' ? (
                  isInvestmentsExpanded ? (
                    <ChevronDown className={`w-3 h-3 ${isActive ? 'text-brand-gold' : 'text-brand-text-muted'}`} />
                  ) : (
                    <ChevronRight className={`w-3 h-3 ${isActive ? 'text-brand-gold' : 'text-brand-text-muted'}`} />
                  )
                ) : item.badge ? (
                  <span className={`px-1 py-0.2 text-[8px] font-bold rounded-full ${
                    isDirectActive && !item.subItems
                      ? 'bg-white text-brand-gold'
                      : 'bg-brand-gold/15 text-brand-gold'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>

              {/* Render Submenu items if present */}
              {item.subItems && (item.id !== 'investments' || isInvestmentsExpanded) && (
                <div className="pl-3.5 space-y-0.5 mt-0.5 border-l border-brand-border/40 ml-4">
                  {item.subItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = currentView === sub.id;

                    return (
                      <button
                        key={sub.id}
                        id={`sidebar-sublink-${sub.id}`}
                        onClick={() => {
                          onViewChange(sub.id);
                          if (onClose) onClose(); // Close on click for mobile
                        }}
                        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-[11.5px] font-medium transition-all ${
                          isSubActive
                            ? 'text-brand-gold bg-brand-gold/5 font-semibold'
                            : 'text-brand-text-muted hover:bg-brand-secondary-bg hover:text-brand-text'
                        }`}
                      >
                        <SubIcon style={{ color: '#b68a2f' }} className="w-3 h-3" />
                        <span className="truncate">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Support Panel */}
      <div className="p-3">
        <button 
          onClick={() => {
            onViewChange('support');
            if (onClose) onClose();
          }}
          className={`w-full rounded-xl p-2.5 border transition-all text-left flex items-start gap-2 ${
            currentView === 'support'
              ? 'bg-brand-gold/10 border-brand-gold/40 shadow-sm'
              : 'bg-brand-primary-bg border-brand-border/80 hover:border-brand-gold/30 hover:shadow-sm'
          }`}
          id="btn-sidebar-footer-support"
        >
          <div className={`p-1 rounded ${currentView === 'support' ? 'bg-brand-gold text-white' : 'bg-brand-gold/10 text-brand-gold'}`}>
            <Headphones className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1">
            <h4 className="text-[11px] font-bold text-brand-text">Need Support & AI?</h4>
            <p className="text-[9.5px] text-brand-text-muted mt-0.5">Jodhpur Regional Desk</p>
          </div>
          <ArrowRight className={`w-3.5 h-3.5 ml-auto self-center transition-transform ${currentView === 'support' ? 'text-brand-gold translate-x-0.5' : 'text-brand-gold/70'}`} />
        </button>
      </div>
    </aside>
  );
}
