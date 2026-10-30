import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Users, Landmark, TrendingUp, CircleDollarSign, AlertCircle, ArrowUpRight, ArrowDownRight, 
  CheckSquare, Calendar, ChevronRight, Plus, Download, Calculator, Compass, FileUp, Sparkles, X, Activity, ShieldAlert,
  BookOpen, Target, BarChart2, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { dashboardService, DashboardMetrics, AUMTrendPoint, AssetAllocationData, MarketIndex } from '../../services/dashboard.service';
import { clientService } from '../../services/client.service';
import { Client, Task } from '../../types';
import { getDashboardPermissions } from '../../config/rbac';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onSelectClient: (clientId: string) => void;
  userRole?: string;
  onTasksCountChange?: (count: number) => void;
}

export default function DashboardView({ onNavigate, onSelectClient, userRole, onTasksCountChange }: DashboardViewProps) {
  const isReadOnlyRole = userRole === 'Auditor';
  const perms = getDashboardPermissions(userRole);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trendData, setTrendData] = useState<AUMTrendPoint[]>([]);
  const [allocation, setAllocation] = useState<AssetAllocationData[]>([]);
  const [hoveredAllocation, setHoveredAllocation] = useState<AssetAllocationData | null>(null);
  const [market, setMarket] = useState<MarketIndex[]>([]);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Quick Action Modal States
  const [showSipCalc, setShowSipCalc] = useState(false);
  const [showGoalPlanner, setShowGoalPlanner] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  // SIP Calculator Input States
  const [sipAmount, setSipAmount] = useState(10000);
  const [sipRate, setSipRate] = useState(12);
  const [sipYears, setSipYears] = useState(10);
  const [sipResult, setSipResult] = useState<{ invested: number; gains: number; total: number } | null>(null);

  // Goal Projections Input States
  const [targetGoal, setTargetGoal] = useState(10000000); // 1 Cr
  const [goalYears, setGoalYears] = useState(15);
  const [goalRate, setGoalRate] = useState(12);
  const [requiredMonthlySip, setRequiredMonthlySip] = useState(0);

  // New Client Input Form
  const [newClientName, setNewClientName] = useState('');
  const [newClientCity, setNewClientCity] = useState('Mumbai');
  const [newClientAum, setNewClientAum] = useState('1.5');
  const [newClientCategory, setNewClientCategory] = useState<'HNI' | 'UHNI' | 'Retail'>('HNI');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; status: string }[]>([]);

  // Research Analyst specific data
  const researchPicks = [
    { symbol: 'RELIANCE', company: 'Reliance Industries Ltd.', type: 'BUY', target: '₹ 2,850', stopLoss: '₹ 2,250', horizon: '6 Months', sector: 'Energy & Telecom' },
    { symbol: 'HDFCBANK', company: 'HDFC Bank Ltd.', type: 'BUY', target: '₹ 1,950', stopLoss: '₹ 1,520', horizon: '3 Months', sector: 'Banking' },
    { symbol: 'TCS', company: 'Tata Consultancy Services', type: 'HOLD', target: '₹ 4,100', stopLoss: '₹ 3,600', horizon: '12 Months', sector: 'IT Services' },
  ];

  const marketTrendData = [
    { month: 'Jan', indexVal: 21731 },
    { month: 'Feb', indexVal: 21982 },
    { month: 'Mar', indexVal: 22326 },
    { month: 'Apr', indexVal: 22604 },
    { month: 'May', indexVal: 22530 },
    { month: 'Jun', indexVal: 24302 },
  ];

  const researchSplit = [
    { name: 'BUY Calls', value: 65, color: '#16A34A', amountCr: 12 },
    { name: 'HOLD Calls', value: 25, color: '#B68A2F', amountCr: 5 },
    { name: 'ACCUMULATE', value: 10, color: '#2563EB', amountCr: 2 },
  ];

  const sectorThemes = [
    { name: 'Banking & Financials', momentum: '+1.45%', outlook: 'Overweight', tag: 'High Growth' },
    { name: 'Energy & New Green Tech', momentum: '+1.18%', outlook: 'Bullish', tag: 'CapEx Surge' },
    { name: 'IT & Software Exports', momentum: '+0.82%', outlook: 'Neutral', tag: 'Margin Stable' },
    { name: 'Automobile & EV Components', momentum: '+0.64%', outlook: 'Bullish', tag: 'Domestic Demand' },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    calculateSip();
  }, [sipAmount, sipRate, sipYears]);

  useEffect(() => {
    calculateGoal();
  }, [targetGoal, goalYears, goalRate]);

  const fetchDashboardData = async () => {
    const [met, trend, alloc, mkt, cli, tsk] = await Promise.all([
      dashboardService.getMetrics(),
      dashboardService.getAUMTrend(),
      dashboardService.getAssetAllocation(),
      dashboardService.getMarketOverview(),
      clientService.getClients(),
      dashboardService.getTasks()
    ]);
    setMetrics(met);
    setTrendData(trend);
    setAllocation(alloc);
    setMarket(mkt);
    setRecentClients(cli.slice(0, 5));
    setTasks(tsk);
    const pendingCount = tsk.filter(t => t.status === 'Pending').length;
    if (onTasksCountChange) {
      onTasksCountChange(pendingCount);
    }
  };

  const handleTaskToggle = async (id: string) => {
    if (isReadOnlyRole) return;
    
    // Instant optimistic update for immediate user responsiveness
    setTasks(prevTasks => {
      const updated = prevTasks.map(t => {
        if (t.id === id) {
          const newStatus = t.status === 'Completed' ? 'Pending' : 'Completed';
          return { ...t, status: newStatus as 'Pending' | 'Completed' };
        }
        return t;
      });
      const pendingCount = updated.filter(t => t.status === 'Pending').length;
      if (metrics) {
        setMetrics({
          ...metrics,
          tasksPending: { ...metrics.tasksPending, value: pendingCount }
        });
      }
      if (onTasksCountChange) {
        onTasksCountChange(pendingCount);
      }
      return updated;
    });

    try {
      await dashboardService.toggleTaskStatus(id);
    } catch (e) {
      console.error('Task toggle backend sync:', e);
    }
  };

  // SIP Calculator implementation
  const calculateSip = () => {
    const P = sipAmount;
    const i = (sipRate / 100) / 12;
    const n = sipYears * 12;
    const total = P * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
    const invested = P * n;
    const gains = total - invested;

    setSipResult({
      invested: Math.round(invested),
      gains: Math.round(gains),
      total: Math.round(total)
    });
  };

  // Goal projections planner
  const calculateGoal = () => {
    const FV = targetGoal;
    const i = (goalRate / 100) / 12;
    const n = goalYears * 12;
    const monthly = FV / (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
    setRequiredMonthlySip(Math.round(monthly));
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail) return;

    await clientService.addClient({
      name: newClientName,
      city: newClientCity,
      aum: parseFloat(newClientAum),
      category: newClientCategory,
      email: newClientEmail,
      phone: newClientPhone || '+91 99999 88888',
      status: 'Active',
      onboardingDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    });

    // Reset Form
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientAum('1.5');
    setShowAddClientModal(false);

    // Refresh Dashboard
    fetchDashboardData();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addUploadedFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addUploadedFiles(files);
    }
  };

  const addUploadedFiles = (files: any[]) => {
    const newFiles = files.map(f => ({
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      status: 'Uploaded Successfully'
    }));
    setUploadedFiles([...newFiles, ...uploadedFiles]);
  };

  // Render tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-brand-card-bg border border-brand-border px-3.5 py-2 rounded-xl shadow-md text-left">
          <p className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold">
            {payload[0].payload.month} 2026
          </p>
          <p className="text-sm font-bold text-brand-gold mt-0.5">
            {payload[0].payload.aum !== undefined ? `₹ ${payload[0].value} Cr` : `${payload[0].value} pts`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards Grid - Tailored by Role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* RESEARCH ANALYST KPI SUITE */}
        {perms.canViewResearchKpi ? (
          <>
            <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-brand-gold/10 rounded-lg text-brand-gold">
                  <Target className="w-5 h-5" />
                </div>
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-brand-success bg-brand-success/10 px-1.5 py-0.5 rounded-full">
                  <ArrowUpRight className="w-3 h-3" /> +3 this week
                </span>
              </div>
              <div className="mt-4 text-left">
                <p className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold">Active Research Calls</p>
                <h3 className="text-xl font-display font-bold text-brand-text mt-1">18 Calls</h3>
                <p className="text-[9px] text-brand-text-muted mt-1">82% Target Achievement</p>
              </div>
            </div>

            <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-brand-gold/10 rounded-lg text-brand-gold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold text-brand-gold bg-brand-gold/10 px-1.5 py-0.5 rounded-full">
                  Institutional
                </span>
              </div>
              <div className="mt-4 text-left">
                <p className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold">Coverage Universe</p>
                <h3 className="text-xl font-display font-bold text-brand-text mt-1">42 Equities</h3>
                <p className="text-[9px] text-brand-text-muted mt-1">Across 8 Core Sectors</p>
              </div>
            </div>

            <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-brand-gold/10 rounded-lg text-brand-gold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                  Strong Buy
                </span>
              </div>
              <div className="mt-4 text-left">
                <p className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold">Top Pick</p>
                <h3 className="text-xl font-display font-bold text-brand-text mt-1">RELIANCE</h3>
                <p className="text-[9px] text-brand-success font-semibold mt-1">Target ₹ 2,850 (+17%)</p>
              </div>
            </div>

            <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-brand-gold/10 rounded-lg text-brand-gold">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-brand-success bg-brand-success/10 px-1.5 py-0.5 rounded-full">
                  <ArrowUpRight className="w-3 h-3" /> +0.75%
                </span>
              </div>
              <div className="mt-4 text-left">
                <p className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold">NIFTY 50 Index</p>
                <h3 className="text-xl font-display font-bold text-brand-text mt-1">24,302.15</h3>
                <p className="text-[9px] text-brand-text-muted mt-1">Bullish Bias (BSE/NSE)</p>
              </div>
            </div>

            <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-brand-gold/10 rounded-lg text-brand-gold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold text-brand-gold bg-brand-gold/10 px-1.5 py-0.5 rounded-full">
                  Sentiment
                </span>
              </div>
              <div className="mt-4 text-left">
                <p className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold">Market Breadth</p>
                <h3 className="text-xl font-display font-bold text-emerald-600 mt-1">68% Bullish</h3>
                <p className="text-[9px] text-brand-text-muted mt-1">Advancing Sectors Lead</p>
              </div>
            </div>
          </>
        ) : (
          /* STANDARD WEALTH MANAGEMENT KPI SUITE */
          <>
            {/* Total Clients */}
            {perms.canViewClientsKpi && (
              <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between text-left">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-brand-gold/10 rounded-lg text-brand-gold">
                    <Users className="w-5 h-5" />
                  </div>
                  {metrics?.totalClients.change && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-brand-success bg-brand-success/10 px-1.5 py-0.5 rounded-full">
                      <ArrowUpRight className="w-3 h-3" />
                      {metrics.totalClients.change}%
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold">Total Clients</p>
                  <h3 className="text-xl font-display font-bold text-brand-text mt-1">
                    {metrics ? metrics.totalClients.value.toLocaleString('en-IN') : '...'}
                  </h3>
                  <p className="text-[9px] text-brand-text-muted mt-1">{metrics?.totalClients.label}</p>
                </div>
              </div>
            )}

            {/* AUM (Cr) */}
            {perms.canViewAumKpi && (
              <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between text-left">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-brand-gold/10 rounded-lg text-brand-gold">
                    <Landmark className="w-5 h-5" />
                  </div>
                  {metrics?.totalAum.change && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-brand-success bg-brand-success/10 px-1.5 py-0.5 rounded-full">
                      <ArrowUpRight className="w-3 h-3" />
                      {metrics.totalAum.change}%
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold">AUM (₹)</p>
                  <h3 className="text-xl font-display font-bold text-brand-text mt-1">
                    ₹ {metrics ? metrics.totalAum.value.toFixed(2) : '...'} Cr
                  </h3>
                  <p className="text-[9px] text-brand-text-muted mt-1">{metrics?.totalAum.label}</p>
                </div>
              </div>
            )}

            {/* Total Investments */}
            {perms.canViewInvestmentsKpi && (
              <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between text-left">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-brand-gold/10 rounded-lg text-brand-gold">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  {metrics?.totalInvestments.change && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-brand-success bg-brand-success/10 px-1.5 py-0.5 rounded-full">
                      <ArrowUpRight className="w-3 h-3" />
                      {metrics.totalInvestments.change}%
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold">Active Investments</p>
                  <h3 className="text-xl font-display font-bold text-brand-text mt-1">
                    {metrics ? metrics.totalInvestments.value : '...'}
                  </h3>
                  <p className="text-[9px] text-brand-text-muted mt-1">{metrics?.totalInvestments.label}</p>
                </div>
              </div>
            )}

            {/* Today's Inflow */}
            {perms.canViewInflowKpi && (
              <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between text-left">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-brand-gold/10 rounded-lg text-brand-gold">
                    <CircleDollarSign className="w-5 h-5" />
                  </div>
                  {metrics?.todaysInflow.change && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-brand-success bg-brand-success/10 px-1.5 py-0.5 rounded-full">
                      <ArrowUpRight className="w-3 h-3" />
                      {metrics.todaysInflow.change}%
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold">Today's Inflow (₹)</p>
                  <h3 className="text-xl font-display font-bold text-brand-text mt-1">
                    ₹ {metrics ? metrics.todaysInflow.value.toFixed(2) : '...'} Cr
                  </h3>
                  <p className="text-[9px] text-brand-text-muted mt-1">{metrics?.todaysInflow.label}</p>
                </div>
              </div>
            )}

            {/* Tasks Pending */}
            {perms.canViewTasksKpi && (
              <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between text-left">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-brand-danger/10 rounded-lg text-brand-danger">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold text-brand-danger bg-brand-danger/10 px-1.5 py-0.5 rounded-full">
                    Action Required
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold">Tasks Pending</p>
                  <h3 className="text-xl font-display font-bold text-brand-text mt-1 text-brand-danger">
                    {metrics ? metrics.tasksPending.value : '...'}
                  </h3>
                  <p className="text-[9px] text-brand-text-muted mt-1">{metrics?.tasksPending.label}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Charts Block - Tailored by Role */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {perms.canViewResearchCallsChart ? (
          /* RESEARCH ANALYST BENCHMARK & CALLS CHART */
          <>
            <div className="lg:col-span-2 bg-brand-card-bg border border-brand-border rounded-xl p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider">NIFTY 50 Benchmark Momentum</h3>
                  <span className="text-brand-text-muted text-[10px] border border-brand-border rounded px-1.5 py-0.2 hover:bg-brand-secondary-bg cursor-pointer">ⓘ</span>
                </div>
                <span className="text-[11px] font-bold text-brand-gold bg-brand-gold/10 border border-brand-gold/20 px-2.5 py-1 rounded-lg">
                  24,302.15 <span className="text-[9px] font-medium text-emerald-600 ml-1">● All Time High Zone</span>
                </span>
              </div>

              <div className="h-64 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={marketTrendData} margin={{ top: 12, right: 15, left: -5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="indexGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E2D7" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 10, fill: '#6B7280' }} 
                      domain={[21000, 25000]}
                      tickFormatter={(v) => `${(v/1000).toFixed(1)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="indexVal" 
                      stroke="#16A34A" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#indexGradient)"
                      dot={{ r: 4, fill: '#16A34A', stroke: '#FFFFFF', strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: '#16A34A', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Research Call Recommendation Distribution */}
            <div className="bg-brand-card-bg border border-brand-border rounded-xl p-6 shadow-sm flex flex-col justify-between text-left">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider">Call Stance Split</h3>
                <span className="text-[10px] font-bold text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full">
                  18 Calls
                </span>
              </div>

              <div className="relative h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={researchSplit}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {researchSplit.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none select-none text-center">
                  <span className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold">Active Bias</span>
                  <span className="text-base font-display font-bold text-emerald-600 mt-0.5 leading-none">
                    65% BUY
                  </span>
                  <span className="text-[9px] text-brand-text-muted mt-1">Growth Focused</span>
                </div>
              </div>

              <div className="space-y-1.5 mt-3">
                {researchSplit.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs px-2 py-1 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-brand-text font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-brand-text text-[11px]">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* STANDARD WEALTH AUM & ASSET ALLOCATION CHARTS */
          <>
            {/* AUM Growth Trend (65%) */}
            <div className="lg:col-span-2 bg-brand-card-bg border border-brand-border rounded-xl p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider">AUM Growth Trend</h3>
                  <span className="text-brand-text-muted text-[10px] border border-brand-border rounded px-1.5 py-0.2 hover:bg-brand-secondary-bg cursor-pointer">ⓘ</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-brand-gold bg-brand-gold/10 border border-brand-gold/20 px-2.5 py-1 rounded-lg">
                    ₹ {metrics ? metrics.totalAum.value.toFixed(2) : '36.94'} Cr <span className="text-[9px] font-medium text-brand-text-muted ml-1">Live AUM</span>
                  </span>
                  <select className="text-xs font-medium border border-brand-border rounded-lg bg-brand-primary-bg px-2.5 py-1 focus:outline-none focus:border-brand-gold">
                    <option>This Quarter</option>
                    <option>This Financial Year</option>
                    <option>All Time</option>
                  </select>
                </div>
              </div>

              <div className="h-64 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 12, right: 15, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="aumGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#B68A2F" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#B68A2F" stopOpacity={0.03}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E2D7" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 10, fill: '#6B7280' }} 
                      domain={[(dataMin: number) => Math.max(0, Math.floor(dataMin * 0.8)), (dataMax: number) => Math.ceil(dataMax * 1.15)]}
                      tickFormatter={(val) => `₹${val}Cr`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="aum" 
                      stroke="#B68A2F" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#aumGradient)"
                      dot={{ r: 4, fill: '#B68A2F', stroke: '#FFFFFF', strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: '#B68A2F', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Asset Allocation (35%) */}
            <div className="bg-brand-card-bg border border-brand-border rounded-xl p-6 shadow-sm flex flex-col justify-between text-left">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider">Asset Allocation</h3>
                  <span className="text-brand-text-muted text-[10px] border border-brand-border rounded px-1.5 py-0.2 hover:bg-brand-secondary-bg cursor-pointer">ⓘ</span>
                </div>
              </div>

              <div className="relative h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, index) => setHoveredAllocation(allocation[index])}
                      onMouseLeave={() => setHoveredAllocation(null)}
                      className="cursor-pointer"
                    >
                      {allocation.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          stroke={hoveredAllocation?.name === entry.name ? '#FFFFFF' : 'none'}
                          strokeWidth={hoveredAllocation?.name === entry.name ? 2 : 0}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none select-none text-center px-2">
                  {hoveredAllocation ? (
                    <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center">
                      <span className="text-[10px] font-bold text-brand-text truncate max-w-[100px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: hoveredAllocation.color }} />
                        {hoveredAllocation.name}
                      </span>
                      <span className="text-base font-display font-bold text-brand-gold mt-0.5 leading-none">
                        ₹ {(hoveredAllocation.amountCr !== undefined ? hoveredAllocation.amountCr : ((metrics?.totalAum.value || 36.94) * hoveredAllocation.value / 100)).toFixed(2)} Cr
                      </span>
                      <span className="text-[9px] font-semibold text-brand-text-muted mt-1 bg-brand-gold/10 px-1.5 py-0.5 rounded-full">
                        {hoveredAllocation.value}% Allocation
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold">Total AUM</span>
                      <span className="text-lg font-display font-bold text-brand-text mt-0.5 leading-none">
                        ₹ {metrics ? metrics.totalAum.value.toFixed(2) : '36.94'} Cr
                      </span>
                      <span className="text-[9px] text-brand-text-muted mt-1">Live Portfolio</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 mt-3">
                {allocation.map((alloc) => (
                  <div 
                    key={alloc.name} 
                    onMouseEnter={() => setHoveredAllocation(alloc)}
                    onMouseLeave={() => setHoveredAllocation(null)}
                    className={`flex items-center justify-between text-xs px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                      hoveredAllocation?.name === alloc.name ? 'bg-brand-gold/10 font-bold' : 'hover:bg-brand-primary-bg'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: alloc.color }} />
                      <span className="text-brand-text-muted font-medium">{alloc.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-brand-gold">
                        ₹ {(alloc.amountCr !== undefined ? alloc.amountCr : ((metrics?.totalAum.value || 36.94) * alloc.value / 100)).toFixed(2)} Cr
                      </span>
                      <span className="font-semibold text-brand-text text-[11px]">({alloc.value}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions Panel - Filtered by RBAC */}
      <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm text-left">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-brand-gold" /> Quick Actions
          </h3>
          {isReadOnlyRole && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-600" /> Read-Only Mode ({userRole})
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {perms.canAddClient && (
            <button 
              id="action-add-client"
              onClick={() => setShowAddClientModal(true)}
              className="flex flex-col items-start p-4 bg-brand-primary-bg/50 border border-brand-border hover:border-brand-gold hover:shadow-sm transition-all rounded-xl text-left group cursor-pointer"
            >
              <div className="p-2 bg-brand-gold/10 text-brand-gold rounded-lg group-hover:bg-brand-gold group-hover:text-white transition-all">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-brand-text mt-3">Add New Client</span>
              <span className="text-[9px] text-brand-text-muted mt-0.5">Register prospect</span>
            </button>
          )}

          {perms.canCreateInvestment && (
            <button 
              id="action-invest"
              onClick={() => onNavigate('investments')}
              className="flex flex-col items-start p-4 bg-brand-primary-bg/50 border border-brand-border hover:border-brand-gold hover:shadow-sm transition-all rounded-xl text-left group cursor-pointer"
            >
              <div className="p-2 bg-brand-gold/10 text-brand-gold rounded-lg group-hover:bg-brand-gold group-hover:text-white transition-all">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-brand-text mt-3">New Investment</span>
              <span className="text-[9px] text-brand-text-muted mt-0.5">Lumpsum or SIP order</span>
            </button>
          )}

          {perms.canPublishResearchCall && (
            <button 
              id="action-publish-call"
              onClick={() => onNavigate('research')}
              className="flex flex-col items-start p-4 bg-brand-primary-bg/50 border border-brand-border hover:border-brand-gold hover:shadow-sm transition-all rounded-xl text-left group cursor-pointer"
            >
              <div className="p-2 bg-brand-gold/10 text-brand-gold rounded-lg group-hover:bg-brand-gold group-hover:text-white transition-all">
                <Target className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-brand-text mt-3">Research Hub</span>
              <span className="text-[9px] text-brand-text-muted mt-0.5">Publish & track picks</span>
            </button>
          )}

          {perms.canUseSipCalculator && (
            <button 
              id="action-sip-calculator"
              onClick={() => setShowSipCalc(true)}
              className="flex flex-col items-start p-4 bg-brand-primary-bg/50 border border-brand-border hover:border-brand-gold hover:shadow-sm transition-all rounded-xl text-left group cursor-pointer"
            >
              <div className="p-2 bg-brand-gold/10 text-brand-gold rounded-lg group-hover:bg-brand-gold group-hover:text-white transition-all">
                <Calculator className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-brand-text mt-3">SIP Calculator</span>
              <span className="text-[9px] text-brand-text-muted mt-0.5">Calculate wealth returns</span>
            </button>
          )}

          {perms.canUseGoalPlanner && (
            <button 
              id="action-goal-planner"
              onClick={() => setShowGoalPlanner(true)}
              className="flex flex-col items-start p-4 bg-brand-primary-bg/50 border border-brand-border hover:border-brand-gold hover:shadow-sm transition-all rounded-xl text-left group cursor-pointer"
            >
              <div className="p-2 bg-brand-gold/10 text-brand-gold rounded-lg group-hover:bg-brand-gold group-hover:text-white transition-all">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-brand-text mt-3">Goal Planning</span>
              <span className="text-[9px] text-brand-text-muted mt-0.5">Projections & planning</span>
            </button>
          )}

          {perms.canUploadDocument && (
            <button 
              id="action-upload"
              onClick={() => { setUploadedFiles([]); setShowUploadModal(true); }}
              className="flex flex-col items-start p-4 bg-brand-primary-bg/50 border border-brand-border hover:border-brand-gold hover:shadow-sm transition-all rounded-xl text-left group cursor-pointer"
            >
              <div className="p-2 bg-brand-gold/10 text-brand-gold rounded-lg group-hover:bg-brand-gold group-hover:text-white transition-all">
                <FileUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-brand-text mt-3">Upload Document</span>
              <span className="text-[9px] text-brand-text-muted mt-0.5">Research papers & notes</span>
            </button>
          )}

          {perms.canGenerateReport && (
            <button 
              id="action-generate-report"
              onClick={() => onNavigate('reports')}
              className="flex flex-col items-start p-4 bg-brand-primary-bg/50 border border-brand-border hover:border-brand-gold hover:shadow-sm transition-all rounded-xl text-left group cursor-pointer"
            >
              <div className="p-2 bg-brand-gold/10 text-brand-gold rounded-lg group-hover:bg-brand-gold group-hover:text-white transition-all">
                <Download className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-brand-text mt-3">Generate Report</span>
              <span className="text-[9px] text-brand-text-muted mt-0.5">Export market brief</span>
            </button>
          )}
        </div>
      </div>

      {/* Lists Block (Recent Clients, My Tasks, Market Overview) - Strictly Filtered by RBAC */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* COLUMN 1: RECENT CLIENTS (or TOP RESEARCH CALLS for Research Analyst) */}
        {perms.canViewRecentClients ? (
          <div className="bg-brand-card-bg border border-brand-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider">Recent Clients</h3>
                <button 
                  id="btn-recent-clients-view-all"
                  onClick={() => onNavigate('clients')} 
                  className="text-[10px] text-brand-gold font-bold hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {recentClients.map((client) => (
                  <div 
                    key={client.id} 
                    id={`recent-client-row-${client.id}`}
                    onClick={() => onSelectClient(client.id)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-brand-primary-bg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-gold/15 text-brand-gold font-bold text-xs flex items-center justify-center uppercase">
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-brand-text">{client.name}</h4>
                        <p className="text-[10px] text-brand-text-muted mt-0.5">{client.city} • {client.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-brand-text">₹ {client.aum} Cr</span>
                      <p className="text-[9px] text-brand-success font-semibold mt-0.5">● Active</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* FOR RESEARCH ANALYST: TOP RESEARCH RECOMMENDATIONS */
          <div className="bg-brand-card-bg border border-brand-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider">Active Recommendations</h3>
                <button 
                  onClick={() => onNavigate('research')} 
                  className="text-[10px] text-brand-gold font-bold hover:underline cursor-pointer"
                >
                  Research Hub
                </button>
              </div>

              <div className="space-y-3">
                {researchPicks.map((pick) => (
                  <div 
                    key={pick.symbol}
                    onClick={() => onNavigate('research')}
                    className="p-3 rounded-xl bg-brand-primary-bg/50 border border-brand-border hover:border-brand-gold/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-text flex items-center gap-2">
                        {pick.symbol}
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          pick.type === 'BUY' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
                        }`}>
                          {pick.type}
                        </span>
                      </span>
                      <span className="text-xs font-bold text-brand-gold">{pick.target}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-[10px] text-brand-text-muted">
                      <span>{pick.sector}</span>
                      <span>SL: {pick.stopLoss} • {pick.horizon}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* COLUMN 2: MY TASKS (or SECTOR OUTLOOK for Research Analyst) */}
        {perms.canViewMyTasks ? (
          <div className="bg-brand-card-bg border border-brand-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider">My Tasks</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold">
                    {tasks.filter(t => t.status === 'Pending').length} Pending
                  </span>
                </div>
                <button 
                  id="btn-tasks-view-all"
                  onClick={() => onNavigate('tasks')} 
                  className="text-[10px] text-brand-gold font-bold hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {tasks.length === 0 ? (
                  <div className="text-center py-6 text-xs text-brand-text-muted">
                    No tasks recorded.
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div 
                      key={task.id} 
                      id={`dashboard-task-${task.id}`}
                      onClick={() => handleTaskToggle(task.id)}
                      className={`flex items-center gap-3 p-2.5 border rounded-xl cursor-pointer transition-all ${
                        task.status === 'Completed' 
                          ? 'bg-brand-primary-bg/20 border-brand-border/40 opacity-70' 
                          : 'bg-brand-primary-bg/40 border-brand-border/60 hover:border-brand-gold/50 hover:bg-brand-gold/5'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={task.status === 'Completed'}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-brand-border text-brand-gold focus:ring-brand-gold cursor-pointer accent-brand-gold"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-xs font-medium text-brand-text truncate ${task.status === 'Completed' ? 'line-through text-brand-text-muted/60' : ''}`}>
                          {task.title}
                        </h4>
                        <p className="text-[9px] text-brand-text-muted mt-0.5 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${task.priority === 'High' ? 'bg-brand-danger' : task.priority === 'Medium' ? 'bg-brand-gold' : 'bg-brand-text-muted'}`} />
                          {task.priority} Priority • {task.dueDate}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* FOR RESEARCH ANALYST: SECTOR THEMES & OUTLOOK */
          <div className="bg-brand-card-bg border border-brand-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider">Sector Themes</h3>
                <span className="text-[10px] text-brand-text-muted font-medium">Q2 FY27</span>
              </div>

              <div className="space-y-2.5">
                {sectorThemes.map((sec) => (
                  <div key={sec.name} className="p-2.5 rounded-xl bg-brand-primary-bg/50 border border-brand-border flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-brand-text">{sec.name}</h4>
                      <p className="text-[10px] text-brand-text-muted mt-0.5">{sec.tag}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 block">{sec.momentum}</span>
                      <span className="text-[9px] font-semibold text-brand-gold uppercase">{sec.outlook}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* COLUMN 3: MARKET OVERVIEW & WISDOM */}
        <div className="space-y-4">
          <div className="bg-brand-card-bg border border-brand-border rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Market Overview</span>
              <span className="text-[9px] text-brand-text-muted uppercase font-medium">BSE/NSE</span>
            </h3>

            <div className="space-y-3">
              {market.map((m) => (
                <div key={m.symbol} className="flex justify-between items-center text-xs">
                  <span className="font-medium text-brand-text-muted">{m.symbol}</span>
                  <div className="text-right">
                    <span className="font-bold text-brand-text">{m.value}</span>
                    <span className={`flex items-center justify-end text-[10px] font-bold ${m.isPositive ? 'text-brand-success' : 'text-brand-danger'} mt-0.5`}>
                      {m.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {m.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#B68A2F]/10 border border-brand-gold/20 rounded-xl p-5 shadow-inner relative overflow-hidden flex flex-col justify-center">
            <span className="text-3xl font-serif text-[#B68A2F]/20 absolute -right-2 -bottom-2 font-black select-none">“</span>
            <p className="text-xs italic text-brand-gold font-medium leading-relaxed">
              "Research is the compass that guides patient wealth creation through market cycles."
            </p>
            <div className="w-8 h-[1px] bg-brand-gold mt-3"></div>
            <span className="text-[9px] uppercase tracking-wider text-brand-gold font-bold mt-1">Anand Rathi Wisdom</span>
          </div>
        </div>
      </div>

      {/* Modal - SIP Calculator */}
      {showSipCalc && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4 text-left">
          <div className="bg-brand-card-bg border border-brand-border rounded-2xl max-w-lg w-full p-6 shadow-xl animate-scale-up">
            <div className="flex justify-between items-center border-b border-brand-border pb-3">
              <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-brand-gold" /> Wealth SIP Calculator
              </h3>
              <button onClick={() => setShowSipCalc(false)} className="text-brand-text-muted hover:text-brand-gold cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-brand-text-muted uppercase font-bold">Monthly Investment (₹)</label>
                  <input 
                    type="range" min="1000" max="1000000" step="5000" 
                    value={sipAmount} onChange={(e) => setSipAmount(Number(e.target.value))}
                    className="w-full accent-brand-gold cursor-pointer mt-1"
                  />
                  <div className="flex justify-between text-xs font-bold text-brand-text mt-1">
                    <span>₹ 1,000</span>
                    <span className="text-brand-gold">₹ {sipAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-brand-text-muted uppercase font-bold">Expected Return Rate (% p.a.)</label>
                  <input 
                    type="range" min="5" max="25" step="0.5" 
                    value={sipRate} onChange={(e) => setSipRate(Number(e.target.value))}
                    className="w-full accent-brand-gold cursor-pointer mt-1"
                  />
                  <div className="flex justify-between text-xs font-bold text-brand-text mt-1">
                    <span>5 %</span>
                    <span className="text-brand-gold">{sipRate} %</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-brand-text-muted uppercase font-bold">Time Horizon (Years)</label>
                  <input 
                    type="range" min="1" max="30" step="1" 
                    value={sipYears} onChange={(e) => setSipYears(Number(e.target.value))}
                    className="w-full accent-brand-gold cursor-pointer mt-1"
                  />
                  <div className="flex justify-between text-xs font-bold text-brand-text mt-1">
                    <span>1 Yr</span>
                    <span className="text-brand-gold">{sipYears} Years</span>
                  </div>
                </div>
              </div>

              <div className="bg-brand-primary-bg p-5 rounded-xl border border-brand-border flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-brand-text-muted uppercase font-bold">Projected Maturity Corpus</span>
                  <h2 className="text-2xl font-display font-bold text-brand-gold mt-1">
                    ₹ {sipResult ? (sipResult.total / 10000000).toFixed(2) : '0.00'} Cr
                  </h2>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">
                    Total Amount: ₹ {sipResult ? sipResult.total.toLocaleString('en-IN') : '0'}
                  </p>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-brand-border text-xs">
                  <div className="flex justify-between text-brand-text-muted">
                    <span>Invested Amount:</span>
                    <span className="font-bold text-brand-text">₹ {sipResult ? sipResult.invested.toLocaleString('en-IN') : '0'}</span>
                  </div>
                  <div className="flex justify-between text-brand-text-muted">
                    <span>Estimated Gains:</span>
                    <span className="font-bold text-brand-success">₹ {sipResult ? sipResult.gains.toLocaleString('en-IN') : '0'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Goal Projections */}
      {showGoalPlanner && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4 text-left">
          <div className="bg-brand-card-bg border border-brand-border rounded-2xl max-w-lg w-full p-6 shadow-xl animate-scale-up">
            <div className="flex justify-between items-center border-b border-brand-border pb-3">
              <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-brand-gold" /> Institutional Goal Planning
              </h3>
              <button onClick={() => setShowGoalPlanner(false)} className="text-brand-text-muted hover:text-brand-gold cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold">Target Corpus Goal (₹)</label>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="number" step="500000"
                    value={targetGoal} onChange={(e) => setTargetGoal(Number(e.target.value))}
                    className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 font-bold focus:outline-none focus:border-brand-gold"
                  />
                  <span className="text-xs font-bold text-brand-gold whitespace-nowrap">
                    ₹ {(targetGoal / 10000000).toFixed(2)} Cr
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-brand-text-muted uppercase font-bold">Years to Target</label>
                  <input 
                    type="number" min="1" max="40"
                    value={goalYears} onChange={(e) => setGoalYears(Number(e.target.value))}
                    className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 font-bold focus:outline-none focus:border-brand-gold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-brand-text-muted uppercase font-bold">Expected Growth (% p.a.)</label>
                  <input 
                    type="number" min="5" max="25"
                    value={goalRate} onChange={(e) => setGoalRate(Number(e.target.value))}
                    className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 font-bold focus:outline-none focus:border-brand-gold mt-1"
                  />
                </div>
              </div>

              <div className="bg-brand-primary-bg p-4 rounded-xl border border-brand-border mt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-brand-text-muted uppercase font-bold">Required Monthly Allocation</span>
                  <p className="text-xl font-display font-bold text-brand-gold mt-0.5">
                    ₹ {requiredMonthlySip.toLocaleString('en-IN')} / mo
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-brand-gold/15 text-brand-gold px-2.5 py-1 rounded-full">
                  Disciplined Horizon
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Add New Client Form */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4 text-left">
          <div className="bg-brand-card-bg border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-xl animate-scale-up">
            <div className="flex justify-between items-center border-b border-brand-border pb-3">
              <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-gold" /> Onboard New Wealth Prospect
              </h3>
              <button onClick={() => setShowAddClientModal(false)} className="text-brand-text-muted hover:text-brand-gold cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] text-brand-text-muted uppercase font-bold mb-1">Full Legal Name</label>
                <input 
                  type="text" required placeholder="e.g. Rameshwar Singhania"
                  value={newClientName} onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text font-bold focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-brand-text-muted uppercase font-bold mb-1">City Hub</label>
                  <select 
                    value={newClientCity} onChange={(e) => setNewClientCity(e.target.value)}
                    className="w-full bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text font-bold focus:outline-none focus:border-brand-gold"
                  >
                    <option value="Jodhpur">Jodhpur Hub</option>
                    <option value="Mumbai">Mumbai (HQ)</option>
                    <option value="New Delhi">New Delhi Hub</option>
                    <option value="Bengaluru">Bengaluru Tech Hub</option>
                    <option value="Ahmedabad">Ahmedabad Hub</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-brand-text-muted uppercase font-bold mb-1">Category</label>
                  <select 
                    value={newClientCategory} onChange={(e: any) => setNewClientCategory(e.target.value)}
                    className="w-full bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text font-bold focus:outline-none focus:border-brand-gold"
                  >
                    <option value="UHNI">UHNI (&gt; ₹ 25 Cr)</option>
                    <option value="HNI">HNI (₹ 5 - 25 Cr)</option>
                    <option value="Retail">Affluent Retail</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-brand-text-muted uppercase font-bold mb-1">Initial Target AUM (₹ Cr)</label>
                <input 
                  type="number" step="0.5" required
                  value={newClientAum} onChange={(e) => setNewClientAum(e.target.value)}
                  className="w-full bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text font-bold focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-brand-text-muted uppercase font-bold mb-1">Corporate / Contact Email</label>
                <input 
                  type="email" required placeholder="client@singhania.com"
                  value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text font-bold focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-brand-text-muted uppercase font-bold mb-1">Mobile Contact Number</label>
                <input 
                  type="text" placeholder="+91 98290 88888"
                  value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text font-bold focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
                <button 
                  type="button" onClick={() => setShowAddClientModal(false)}
                  className="px-4 py-2 border border-brand-border rounded-xl text-brand-text-muted font-bold hover:bg-brand-primary-bg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-brand-gold hover:bg-brand-gold-accent text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Confirm & Onboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Upload Documents */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4 text-left">
          <div className="bg-brand-card-bg border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-xl animate-scale-up">
            <div className="flex justify-between items-center border-b border-brand-border pb-3">
              <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider flex items-center gap-2">
                <FileUp className="w-4 h-4 text-brand-gold" /> Institutional Document Locker
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-brand-text-muted hover:text-brand-gold cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mt-4 border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                isDragging ? 'border-brand-gold bg-brand-gold/10' : 'border-brand-border bg-brand-primary-bg/50'
              }`}
            >
              <FileUp className="w-8 h-8 text-brand-gold/60 mx-auto" />
              <p className="text-xs font-bold text-brand-text mt-2">Drag & Drop files here</p>
              <p className="text-[10px] text-brand-text-muted mt-0.5">Supports PDF, XLSX, DOCX up to 25 MB</p>
              <label className="inline-block mt-3 px-3 py-1.5 bg-brand-gold/15 text-brand-gold font-bold text-[10px] rounded-lg cursor-pointer hover:bg-brand-gold/25 transition-colors">
                Browse Files
                <input type="file" multiple onChange={handleFileSelect} className="hidden" />
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2 max-h-36 overflow-y-auto">
                {uploadedFiles.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-brand-primary-bg text-xs border border-brand-border">
                    <span className="font-medium text-brand-text truncate max-w-[200px]">{f.name}</span>
                    <span className="text-[10px] font-bold text-brand-success">{f.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
