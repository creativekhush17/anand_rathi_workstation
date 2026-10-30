export type ClientCategory = 'HNI' | 'UHNI' | 'Retail';
export type ClientStatus = 'Active' | 'Inactive' | 'Pending';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  category: ClientCategory;
  onboardingDate: string;
  status: ClientStatus;
  aum: number; // in Crores (Cr) or Lakhs (L)
  relationshipManager: string;
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  category: 'Equity' | 'Mutual Fund' | 'Debt' | 'Other';
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  marketValue: number; // in INR
  gainLoss: number;
  gainLossPercentage: number;
}

export interface ClientPortfolio {
  clientId: string;
  equityValue: number; // in Cr
  debtValue: number; // in Cr
  mfValue: number; // in Cr
  cashValue: number; // in Cr
  otherValue: number; // in Cr
  totalAum: number; // in Cr
  holdings: Holding[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: 'Pending' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
}

export interface Meeting {
  id: string;
  clientName: string;
  dateTime: string;
  topic: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface ResearchCall {
  id: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  symbol: string;
  companyName: string;
  sector: string;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  timeline: string;
  rationale: string;
  date: string;
}

export interface UserSession {
  employeeId: string;
  name: string;
  role: string;
  branch: string;
  token?: string;
}
