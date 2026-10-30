import { Task } from '../types';
import { apiFetch } from './api';

export interface DashboardMetrics {
  totalClients: { value: number; change: number; label: string };
  totalAum: { value: number; change: number; label: string };
  totalInvestments: { value: number; change: number; label: string };
  todaysInflow: { value: number; change: number; label: string };
  tasksPending: { value: number; isUrgent: boolean; label: string };
}

export interface AUMTrendPoint {
  month: string;
  aum: number;
}

export interface AssetAllocationData {
  name: string;
  value: number;
  amountCr: number;
  color: string;
}

export interface MarketIndex {
  symbol: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    try {
      const summary = await apiFetch<any>('/dashboard/summary');
      let pendingCount = 0;
      try {
        const tasks = await this.getTasks();
        pendingCount = tasks.filter(t => t.status === 'Pending').length;
      } catch {
        // Ignore
      }
      return {
        totalClients: { value: summary.active_clients_count || 0, change: summary.monthly_growth_percent || 0, label: 'vs last month' },
        totalAum: { value: summary.total_aum_cr || 0, change: 0, label: 'vs last month' },
        totalInvestments: { value: summary.active_clients_count ? summary.active_clients_count * 12 : 0, change: 0, label: 'vs last month' },
        todaysInflow: { value: roundToTwo((summary.total_aum_cr || 0) * 0.03), change: 0, label: 'vs yesterday' },
        tasksPending: { value: pendingCount, isUrgent: false, label: 'Due today' }
      };
    } catch {
      return {
        totalClients: { value: 0, change: 0, label: 'vs last month' },
        totalAum: { value: 0, change: 0, label: 'vs last month' },
        totalInvestments: { value: 0, change: 0, label: 'vs last month' },
        todaysInflow: { value: 0, change: 0, label: 'vs yesterday' },
        tasksPending: { value: 0, isUrgent: false, label: 'Due today' }
      };
    }
  },

  async getAUMTrend(): Promise<AUMTrendPoint[]> {
    try {
      const summary = await apiFetch<any>('/dashboard/summary');
      const baseAum = summary.total_aum_cr || 36.94;
      return [
        { month: 'Jan', aum: roundToTwo(baseAum * 0.70) },
        { month: 'Feb', aum: roundToTwo(baseAum * 0.76) },
        { month: 'Mar', aum: roundToTwo(baseAum * 0.82) },
        { month: 'Apr', aum: roundToTwo(baseAum * 0.88) },
        { month: 'May', aum: roundToTwo(baseAum * 0.94) },
        { month: 'Jun', aum: roundToTwo(baseAum) }
      ];
    } catch {
      // Offline / fallback
      const baseAum = 36.94;
      return [
        { month: 'Jan', aum: roundToTwo(baseAum * 0.70) },
        { month: 'Feb', aum: roundToTwo(baseAum * 0.76) },
        { month: 'Mar', aum: roundToTwo(baseAum * 0.82) },
        { month: 'Apr', aum: roundToTwo(baseAum * 0.88) },
        { month: 'May', aum: roundToTwo(baseAum * 0.94) },
        { month: 'Jun', aum: roundToTwo(baseAum) }
      ];
    }
  },

  async getAssetAllocation(): Promise<AssetAllocationData[]> {
    const colors = ['#B68A2F', '#C89B3C', '#E8E2D7', '#6B7280', '#202124'];
    try {
      const summary = await apiFetch<any>('/dashboard/summary');
      const totalAum = summary.total_aum_cr || 36.94;
      if (summary.asset_allocation && Array.isArray(summary.asset_allocation)) {
        return summary.asset_allocation.map((item: any, idx: number) => ({
          name: item.category,
          value: item.percentage,
          amountCr: item.amount_cr !== undefined ? item.amount_cr : roundToTwo((totalAum * item.percentage) / 100),
          color: colors[idx % colors.length]
        }));
      }
    } catch {
      // Offline / fallback
    }
    const defaultAum = 36.94;
    return [
      { name: 'Equity', value: 58, amountCr: roundToTwo(defaultAum * 0.58), color: '#B68A2F' },
      { name: 'Mutual Funds', value: 24, amountCr: roundToTwo(defaultAum * 0.24), color: '#C89B3C' },
      { name: 'Debt / Fixed Income', value: 13, amountCr: roundToTwo(defaultAum * 0.13), color: '#D4AF37' },
      { name: 'Cash & Liquid', value: 5, amountCr: roundToTwo(defaultAum * 0.05), color: '#6B7280' },
    ];
  },

  async getMarketOverview(): Promise<MarketIndex[]> {
    return [
      { symbol: 'NIFTY 50', value: '24,302.15', change: '0.75%', isPositive: true },
      { symbol: 'SENSEX', value: '79,806.65', change: '0.68%', isPositive: true },
      { symbol: 'NIFTY BANK', value: '51,359.10', change: '0.92%', isPositive: true },
      { symbol: 'GOLD (24K)', value: '₹ 72,150 /10g', change: '0.35%', isPositive: true },
      { symbol: 'USD / INR', value: '83.40', change: '0.12%', isPositive: false }
    ];
  },

  async getTasks(): Promise<Task[]> {
    try {
      const res = await apiFetch<any[]>('/tasks');
      if (Array.isArray(res)) {
        return res.map((t: any) => ({
          id: t.id,
          title: t.title,
          dueDate: t.due_date,
          status: t.status as 'Pending' | 'Completed',
          priority: t.priority as 'High' | 'Medium' | 'Low'
        }));
      }
    } catch {
      // Offline / no DB
    }
    return [];
  },

  async addTask(title: string, dueDate: string = 'Today', priority: 'High' | 'Medium' | 'Low' = 'Medium'): Promise<Task> {
    const res = await apiFetch<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title,
        due_date: dueDate,
        priority
      })
    });
    return {
      id: res.id,
      title: res.title,
      dueDate: res.due_date,
      status: res.status,
      priority: res.priority
    };
  },

  async toggleTaskStatus(id: string): Promise<Task | undefined> {
    const res = await apiFetch<any>(`/tasks/${id}/toggle`, {
      method: 'PUT'
    });
    return {
      id: res.id,
      title: res.title,
      dueDate: res.due_date,
      status: res.status,
      priority: res.priority
    };
  }
};

function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
