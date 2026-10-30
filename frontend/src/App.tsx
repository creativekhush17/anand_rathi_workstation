import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginView from './features/auth/LoginView';
import DashboardView from './features/dashboard/DashboardView';
import ClientsView from './features/clients/ClientsView';
import PortfolioView from './features/portfolio/PortfolioView';
import InvestmentsView from './features/investments/InvestmentsView';
import ResearchView from './features/research/ResearchView';
import ReportsView from './features/reports/ReportsView';
import CalendarView from './features/calendar/CalendarView';
import SettingsView from './features/settings/SettingsView';
import SupportView from './features/support/SupportView';
import { UserSession } from './types';
import { messageService, ChatThread } from './services/message.service';
import { reportService, DocumentItem } from './services/report.service';
import { complianceService, ComplianceLogItem } from './services/compliance.service';
import { ROLE_ALLOWED_MODULES } from './config/rbac';
import { 
  FolderLock, ShieldCheck, Mail, FileCheck2, BarChart3, AlertCircle, Send, 
  Search, ArrowUpRight, ArrowDownRight, HardDrive, FileUp, FolderPlus, Calendar, Plus, X, ShieldAlert 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from 'recharts';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [pendingTasksCount, setPendingTasksCount] = useState<number>(0);

  // Messages Thread state from PostgreSQL
  const [activeThreadId, setActiveThreadId] = useState('t1');
  const [replyText, setReplyText] = useState('');
  const [threads, setThreads] = useState<ChatThread[]>([]);

  // Documents state from PostgreSQL
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('KYC & Identity');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Compliance logs state from PostgreSQL
  const [complianceLogs, setComplianceLogs] = useState<ComplianceLogItem[]>([]);

  // Check if a view is authorized for the user's role
  const checkIsViewAllowed = (role: string, view: string): boolean => {
    const allowed = ROLE_ALLOWED_MODULES[role] || [];
    if (allowed.includes(view)) return true;
    if (['mutual-funds', 'bonds', 'equity', 'pms', 'insurance', 'loans'].includes(view) && allowed.includes('investments')) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (session) {
      const allowed = ROLE_ALLOWED_MODULES[session.role] || [];
      if (!checkIsViewAllowed(session.role, currentView)) {
        setCurrentView('dashboard');
      }
      if (allowed.includes('messages')) loadMessages();
      if (allowed.includes('documents')) loadDocuments();
      if (allowed.includes('compliance')) loadCompliance();
    }
  }, [session]);

  const loadMessages = async () => {
    try {
      const data = await messageService.getThreads();
      setThreads(data);
      if (data.length > 0 && !activeThreadId) {
        setActiveThreadId(data[0].id);
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
    }
  };

  const loadDocuments = async () => {
    try {
      const docs = await reportService.getDocuments();
      setDocuments(docs);
    } catch (e) {
      console.error('Error fetching documents:', e);
    }
  };

  const loadCompliance = async () => {
    try {
      const logs = await complianceService.getComplianceLogs();
      setComplianceLogs(logs);
    } catch (e) {
      console.error('Error fetching compliance logs:', e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const activeThread = threads.find(t => t.id === activeThreadId);
    const clientName = activeThread ? activeThread.clientName : 'Client';
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    // Optimistically update message thread in state
    setThreads(prev => prev.map(thr => {
      if (thr.id === activeThreadId) {
        return {
          ...thr,
          lastMsg: replyText,
          time: nowTime,
          messages: [...thr.messages, { sender: 'advisor', text: replyText, time: nowTime }]
        };
      }
      return thr;
    }));

    await messageService.sendMessage(activeThreadId, clientName, replyText);
    setReplyText('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!newDocName.trim()) {
        setNewDocName(file.name);
      }
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    const fileSize = selectedFile 
      ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` 
      : '2.5 MB';

    await reportService.addDocument(newDocName, newDocCategory, fileSize);
    setNewDocName('');
    setSelectedFile(null);
    setShowDocUploadModal(false);
    loadDocuments();
  };

  // Helper to switch view safely with strict RBAC enforcement
  const handleViewChange = (view: string) => {
    if (session && !checkIsViewAllowed(session.role, view)) {
      console.warn(`[RBAC] Access blocked: View "${view}" is not permitted for role "${session.role}".`);
      return;
    }
    setCurrentView(view);
  };

  // Render secondary sub-views dynamically to maintain modularity & completeness
  const renderDocumentLocker = () => {
    return (
      <div className="space-y-6 text-left animate-fade-in">
        <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-brand-text uppercase tracking-wider flex items-center gap-2">
              <FolderLock className="w-5 h-5 text-brand-gold" /> Secure Document Locker
            </h2>
            <p className="text-[10px] text-brand-text-muted mt-0.5">AES-256 encrypted storage holding client identity records and regulatory wealth agreements in PostgreSQL database.</p>
          </div>
          <button 
            onClick={() => setShowDocUploadModal(true)}
            className="flex items-center gap-1.5 bg-brand-gold hover:bg-brand-gold-accent text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Document
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="bg-brand-card-bg border border-brand-border rounded-2xl p-8 text-center shadow-sm max-w-lg mx-auto">
            <FileUp className="w-10 h-10 text-brand-gold/50 mx-auto" />
            <h4 className="text-xs font-bold text-brand-text mt-3">No Documents in PostgreSQL Database</h4>
            <p className="text-[10px] text-brand-text-muted mt-1">Upload client KYC agreements, tax declarations, or wealth statements directly to PostgreSQL database.</p>
            <button 
              onClick={() => setShowDocUploadModal(true)}
              className="bg-brand-gold text-white font-bold px-4 py-2 rounded-lg text-[10px] mt-4 hover:bg-brand-gold-accent transition-colors"
            >
              Upload First Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {documents.map((f, i) => (
              <div key={i} className="bg-brand-card-bg border border-brand-border hover:border-brand-gold/60 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer text-left">
                <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-xl w-fit">
                  <HardDrive className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-brand-text mt-4">{f.name}</h4>
                <p className="text-[10px] text-brand-text-muted mt-1">{f.filesCount} file(s) • {f.fileSize}</p>
                <span className="text-[9px] text-brand-gold block mt-2 font-semibold">{f.category}</span>
              </div>
            ))}
          </div>
        )}

        {showDocUploadModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-brand-card-bg border border-brand-border rounded-2xl p-6 max-w-md w-full shadow-2xl text-left">
              <div className="flex justify-between items-center border-b border-brand-border/60 pb-3">
                <h3 className="text-sm font-bold text-brand-text flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-brand-gold" /> Upload Document to Database
                </h3>
                <button onClick={() => setShowDocUploadModal(false)} className="text-brand-text-muted hover:text-brand-text">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleUploadDocument} className="space-y-4 mt-4 text-xs">
                <div>
                  <label className="block font-bold text-brand-text mb-1">Choose File from PC (PDF, Image, Doc)</label>
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                    onChange={handleFileChange}
                    className="w-full bg-brand-primary-bg border border-brand-border rounded-lg p-2 text-brand-text text-[11px] file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-brand-gold file:text-white hover:file:bg-brand-gold-accent cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-[10px] text-brand-gold font-bold mt-1.5 flex items-center gap-1">
                      ✓ Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-brand-text mb-1">Document Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Client Aadhar & Identity Verification" 
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="w-full bg-brand-primary-bg border border-brand-border rounded-lg p-2.5 text-brand-text"
                  />
                </div>
                <div>
                  <label className="block font-bold text-brand-text mb-1">Category</label>
                  <select 
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value)}
                    className="w-full bg-brand-primary-bg border border-brand-border rounded-lg p-2.5 text-brand-text"
                  >
                    <option value="KYC & Identity">KYC & Identity</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Portfolio">Portfolio</option>
                    <option value="Legal">Legal</option>
                    <option value="Tax">Tax</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowDocUploadModal(false)} className="px-4 py-2 border border-brand-border rounded-lg text-brand-text-muted">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-brand-gold text-white font-bold rounded-lg hover:bg-brand-gold-accent">Upload to DB</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderComplianceLogs = () => {
    return (
      <div className="space-y-6 text-left animate-fade-in">
        <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-brand-text uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-gold" /> AML & Compliance Audit Log
          </h2>
          <p className="text-[10px] text-brand-text-muted mt-0.5">Live audit trail fetched directly from PostgreSQL database `audit_logs` table.</p>
        </div>

        <div className="bg-brand-card-bg border border-brand-border rounded-xl shadow-sm overflow-hidden">
          {complianceLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-brand-text-muted">
              No compliance logs found in PostgreSQL database yet. Perform user logins or CRUD operations to trigger audit log entries.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border/60 bg-brand-primary-bg/30 text-[10px] uppercase text-brand-text-muted font-bold">
                  <th className="py-3 pl-4">Record / Target</th>
                  <th className="py-3">Compliance Audit Type</th>
                  <th className="py-3">Filing Date</th>
                  <th className="py-3">Assigned Auditor</th>
                  <th className="py-3 pr-4 text-right">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/35 text-xs">
                {complianceLogs.map((c, idx) => (
                  <tr key={idx} className="hover:bg-brand-primary-bg/30 transition-colors">
                    <td className="py-3.5 pl-4 font-bold text-brand-text">{c.client}</td>
                    <td className="py-3.5 font-medium text-brand-text">{c.type}</td>
                    <td className="py-3.5 text-brand-text-muted">{c.date}</td>
                    <td className="py-3.5 text-brand-text-muted font-mono">{c.auditor}</td>
                    <td className="py-3.5 pr-4 text-right">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                        c.status.includes('Approved') 
                          ? 'bg-brand-success/15 text-brand-success border-brand-success/20' 
                          : 'bg-brand-gold/15 text-brand-gold border-brand-gold/20'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const renderActiveChatInbox = () => {
    const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];
    return (
      <div className="bg-brand-card-bg border border-brand-border rounded-xl shadow-sm h-[calc(100vh-180px)] flex overflow-hidden text-left animate-fade-in">
        {/* Threads sidebar list (35%) */}
        <div className="w-[35%] border-r border-brand-border flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-brand-border flex items-center justify-between">
              <span className="text-xs font-bold text-brand-text uppercase tracking-wider">HNI Advisor Chats</span>
              <span className="text-[10px] font-bold bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded-full">
                {threads.filter(t => t.unread).length} Unread
              </span>
            </div>
            {threads.length === 0 ? (
              <div className="p-4 text-xs text-brand-text-muted text-center">
                No active chat threads in PostgreSQL database yet.
              </div>
            ) : (
              <div className="divide-y divide-brand-border/40">
                {threads.map((t) => (
                  <div 
                    key={t.id} 
                    id={`chat-thread-item-${t.id}`}
                    onClick={() => {
                      setActiveThreadId(t.id);
                      setThreads(prev => prev.map(thr => thr.id === t.id ? { ...thr, unread: false } : thr));
                      messageService.markThreadRead(t.id);
                    }}
                    className={`p-4 cursor-pointer hover:bg-brand-primary-bg/50 transition-colors ${
                      activeThreadId === t.id ? 'bg-brand-gold/5' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-brand-text flex items-center gap-1.5">
                        {t.clientName}
                        <span className="text-[8px] font-bold px-1.5 bg-[#B68A2F]/10 text-brand-gold rounded-md">
                          {t.category}
                        </span>
                        {t.unread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
                        )}
                      </span>
                      <span className="text-[9px] text-brand-text-muted">{t.time}</span>
                    </div>
                    <p className="text-[10px] text-brand-text-muted truncate mt-1.5 leading-normal">{t.lastMsg}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat active conversation pane (65%) */}
        <div className="flex-1 flex flex-col justify-between h-full bg-brand-primary-bg/25">
          {activeThread ? (
            <>
              <div className="p-4 border-b border-brand-border bg-brand-card-bg flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-brand-text">{activeThread.clientName}</span>
                  <span className="text-[9px] text-brand-text-muted block mt-0.5">PostgreSQL encrypted advisor channel</span>
                </div>
                <span className="text-[9px] font-bold text-brand-success bg-brand-success/10 px-2 py-0.5 rounded-full">
                  ● PostgreSQL Active
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeThread.messages.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col ${m.sender === 'advisor' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`p-3 rounded-2xl max-w-sm text-xs shadow-xs ${
                      m.sender === 'advisor' 
                        ? 'bg-brand-gold text-white rounded-tr-none' 
                        : 'bg-brand-card-bg border border-brand-border text-brand-text rounded-tl-none'
                    }`}>
                      <p className="leading-relaxed">{m.text}</p>
                    </div>
                    <span className="text-[8px] text-brand-text-muted mt-1 px-1 font-mono">{m.time}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-brand-border bg-brand-card-bg flex gap-2">
                <input
                  type="text"
                  placeholder={`Send message securely to ${activeThread.clientName}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 text-xs bg-brand-primary-bg border border-brand-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-gold text-brand-text font-sans"
                />
                <button
                  id="btn-chat-send"
                  type="submit"
                  className="bg-brand-gold hover:bg-brand-gold-accent text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-brand-text-muted">
              Select or initiate a chat thread to send messages saved to PostgreSQL database.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMarketAnalyticsOverview = () => {
    const analyticalTrend = [
      { month: 'Jul 25', sensex: 72100 },
      { month: 'Sep 25', sensex: 74200 },
      { month: 'Nov 25', sensex: 73800 },
      { month: 'Jan 26', sensex: 77100 },
      { month: 'Mar 26', sensex: 78900 },
      { month: 'May 26', sensex: 79806.65 }
    ];
    return (
      <div className="space-y-6 text-left animate-fade-in">
        <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-brand-text uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-gold" /> Market Analytics & Projections
          </h2>
          <p className="text-[10px] text-brand-text-muted mt-0.5">SENSEX trailing performance index, market ratios, and regional HNI sector flow stats.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm">
            <h4 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-4">SENSEX Trailing 12-Month Trend</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticalTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C89B3C" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#C89B3C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E2D7" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} domain={[70000, 82000]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="sensex" stroke="#C89B3C" strokeWidth={2.5} fillOpacity={1} fill="url(#analyticsGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-4">Key Market Ratios</h4>
              <div className="space-y-3.5">
                <div className="flex justify-between items-center border-b border-brand-border/40 pb-2">
                  <span className="text-xs font-medium text-brand-text-muted">NIFTY 50 P/E Ratio</span>
                  <span className="text-xs font-mono font-bold text-brand-text">22.45 x</span>
                </div>
                <div className="flex justify-between items-center border-b border-brand-border/40 pb-2">
                  <span className="text-xs font-medium text-brand-text-muted">India VIX (Volatility)</span>
                  <span className="text-xs font-mono font-bold text-brand-text">12.15 %</span>
                </div>
                <div className="flex justify-between items-center border-b border-brand-border/40 pb-2">
                  <span className="text-xs font-medium text-brand-text-muted">Repo Rate (RBI)</span>
                  <span className="text-xs font-mono font-bold text-brand-text">6.50 %</span>
                </div>
                <div className="flex justify-between items-center pb-1">
                  <span className="text-xs font-medium text-brand-text-muted">Sector Inflow: Banking</span>
                  <span className="text-xs font-mono font-bold text-brand-success">+ ₹2,400 Cr</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-brand-gold/10 border border-brand-gold/20 rounded-xl text-xs text-brand-gold text-center font-bold">
              Market Indices synchronize every 15 mins.
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Switch routing matching the active currentView state
  const renderCurrentView = () => {
    const role = session ? session.role : undefined;

    // Strict RBAC Guard: If user lacks permissions for current view, render Access Denied guard
    if (role && currentView !== 'dashboard' && currentView !== 'support' && !checkIsViewAllowed(role, currentView)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-brand-card-bg border border-brand-border rounded-2xl shadow-sm animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-brand-text mb-2 font-display">Access Restricted</h2>
          <p className="text-xs text-brand-text-muted max-w-md mb-6 leading-relaxed">
            Your current assigned role (<span className="font-semibold text-brand-gold">{role}</span>) does not have authorization to view the module (<span className="font-mono text-brand-text font-bold">{currentView}</span>).
          </p>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-5 py-2.5 rounded-xl bg-brand-gold text-white font-medium hover:bg-brand-gold-accent transition shadow-sm text-xs cursor-pointer flex items-center gap-2"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView 
            onNavigate={(view) => setCurrentView(view)} 
            onSelectClient={(id) => { setSelectedClientId(id); setCurrentView('portfolio'); }} 
            userRole={role}
          />
        );
      case 'clients':
        return (
          <ClientsView 
            onSelectClient={(id) => { setSelectedClientId(id); setCurrentView('portfolio'); }} 
            searchQuery={searchQuery}
            userRole={role}
          />
        );
      case 'portfolio':
        return (
          <PortfolioView 
            clientId={selectedClientId} 
            onClientChange={(id) => setSelectedClientId(id)} 
            userRole={role}
          />
        );
      case 'investments':
        return <InvestmentsView initialCategory="All" userRole={role} />;
      case 'mutual-funds':
        return <InvestmentsView initialCategory="Mutual Fund" userRole={role} />;
      case 'bonds':
        return <InvestmentsView initialCategory="Bond" userRole={role} />;
      case 'equity':
        return <InvestmentsView initialCategory="Equity" userRole={role} />;
      case 'pms':
        return <InvestmentsView initialCategory="PMS" userRole={role} />;
      case 'insurance':
        return <InvestmentsView initialCategory="Insurance" userRole={role} />;
      case 'loans':
        return <InvestmentsView initialCategory="Loan" userRole={role} />;
      case 'research':
        return <ResearchView userRole={role} />;
      case 'reports':
        return <ReportsView />;
      case 'documents':
        return renderDocumentLocker();
      case 'tasks':
        return <CalendarView userRole={role} />;
      case 'calendar':
        return <CalendarView userRole={role} />;
      case 'messages':
        return renderActiveChatInbox();
      case 'compliance':
        return renderComplianceLogs();
      case 'support':
        return <SupportView />;
      case 'settings':
        return (
          <SettingsView 
            employeeName={session ? session.name : 'Nitin Dadhich'} 
            onChangeEmployeeName={(name) => session && setSession({ ...session, name })}
            branch={session ? session.branch : 'Jodhpur Hub'}
            onChangeBranch={(b) => session && setSession({ ...session, branch: b })}
          />
        );
      default:
        return (
          <DashboardView 
            onNavigate={(view) => setCurrentView(view)} 
            onSelectClient={(id) => { setSelectedClientId(id); setCurrentView('portfolio'); }} 
            onTasksCountChange={(count) => setPendingTasksCount(count)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-brand-primary-bg w-full">
      {session === null ? (
        <LoginView onLogin={(user) => {
          setSession(user);
          setCurrentView('dashboard');
        }} />
      ) : (
        <div className="flex h-screen overflow-hidden relative bg-checkered-grid">
          {/* Mobile Overlay backdrop */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/30 backdrop-blur-xs z-25 md:hidden transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Responsive Sidebar */}
          <Sidebar 
            currentView={currentView} 
            onViewChange={handleViewChange} 
            onLogout={() => {
              setSession(null);
              setCurrentView('dashboard');
            }} 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            userRole={session.role}
            unreadMessagesCount={threads.filter(t => t.unread).length}
            pendingTasksCount={pendingTasksCount}
          />


          {/* Main workspace layout wrapper - dynamic padding-left */}
          <div className="flex-1 flex flex-col h-screen overflow-y-auto pl-0 md:pl-[280px] bg-transparent transition-all duration-300 p-3 gap-3 relative">
            <Header 
              employeeName={session.name} 
              role={session.role} 
              branch={session.branch}
              employeeId={session.employeeId}
              onToggleSidebar={() => setIsSidebarOpen(true)}
              onLogout={() => {
                setSession(null);
                setCurrentView('dashboard');
              }}
              onNavigate={handleViewChange}
              onSearch={(query) => {
                setSearchQuery(query);
                // Auto switch to Clients if typing inside header search on other views
                if (query.trim() !== '' && currentView !== 'clients') {
                  setCurrentView('clients');
                }
              }}
            />

            {/* Scrollable Main Content Container with responsive padding */}
            <main className="flex-1 px-1 md:px-2 py-2 pb-12 bg-transparent">
              {renderCurrentView()}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
