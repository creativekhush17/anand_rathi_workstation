export type UserRole = 
  | 'Super Admin' 
  | 'Branch Head' 
  | 'Relationship Manager' 
  | 'Compliance Officer' 
  | 'Research Analyst' 
  | 'Auditor';

export const ROLE_ALLOWED_MODULES: Record<string, string[]> = {
  'Super Admin': [
    'dashboard', 'clients', 'portfolio', 'investments', 'research',
    'reports', 'documents', 'tasks', 'calendar',
    'messages', 'compliance', 'settings'
  ],
  'Branch Head': [
    'dashboard', 'clients', 'portfolio', 'investments', 'research',
    'reports', 'documents', 'tasks', 'calendar', 'messages', 'compliance'
  ],
  'Relationship Manager': [
    'dashboard', 'clients', 'portfolio', 'investments', 'research',
    'reports', 'documents', 'tasks', 'calendar', 'messages'
  ],
  'Compliance Officer': [
    'dashboard', 'clients', 'reports', 'documents', 'compliance',
    'tasks', 'messages'
  ],
  'Research Analyst': [
    'dashboard', 'research', 'reports', 'documents', 'messages'
  ],
  'Auditor': [
    'dashboard', 'clients', 'portfolio', 'reports', 'documents', 'compliance'
  ]
};

export interface RoleDashboardPermissions {
  canViewClientsKpi: boolean;
  canViewAumKpi: boolean;
  canViewInvestmentsKpi: boolean;
  canViewInflowKpi: boolean;
  canViewTasksKpi: boolean;
  canViewResearchKpi: boolean;
  canViewComplianceKpi: boolean;
  
  canViewAumTrendChart: boolean;
  canViewAssetAllocationChart: boolean;
  canViewResearchCallsChart: boolean;
  
  canAddClient: boolean;
  canCreateInvestment: boolean;
  canUseSipCalculator: boolean;
  canUseGoalPlanner: boolean;
  canUploadDocument: boolean;
  canGenerateReport: boolean;
  canPublishResearchCall: boolean;
  
  canViewRecentClients: boolean;
  canViewMyTasks: boolean;
  canViewMarketOverview: boolean;
  canViewRecentResearchCalls: boolean;
  canViewComplianceAlerts: boolean;
}

export const ROLE_DASHBOARD_PERMISSIONS: Record<string, RoleDashboardPermissions> = {
  'Super Admin': {
    canViewClientsKpi: true,
    canViewAumKpi: true,
    canViewInvestmentsKpi: true,
    canViewInflowKpi: true,
    canViewTasksKpi: true,
    canViewResearchKpi: false,
    canViewComplianceKpi: false,
    canViewAumTrendChart: true,
    canViewAssetAllocationChart: true,
    canViewResearchCallsChart: false,
    canAddClient: true,
    canCreateInvestment: true,
    canUseSipCalculator: true,
    canUseGoalPlanner: true,
    canUploadDocument: true,
    canGenerateReport: true,
    canPublishResearchCall: true,
    canViewRecentClients: true,
    canViewMyTasks: true,
    canViewMarketOverview: true,
    canViewRecentResearchCalls: false,
    canViewComplianceAlerts: false,
  },
  'Branch Head': {
    canViewClientsKpi: true,
    canViewAumKpi: true,
    canViewInvestmentsKpi: true,
    canViewInflowKpi: true,
    canViewTasksKpi: true,
    canViewResearchKpi: false,
    canViewComplianceKpi: false,
    canViewAumTrendChart: true,
    canViewAssetAllocationChart: true,
    canViewResearchCallsChart: false,
    canAddClient: true,
    canCreateInvestment: true,
    canUseSipCalculator: true,
    canUseGoalPlanner: true,
    canUploadDocument: true,
    canGenerateReport: true,
    canPublishResearchCall: false,
    canViewRecentClients: true,
    canViewMyTasks: true,
    canViewMarketOverview: true,
    canViewRecentResearchCalls: false,
    canViewComplianceAlerts: false,
  },
  'Relationship Manager': {
    canViewClientsKpi: true,
    canViewAumKpi: true,
    canViewInvestmentsKpi: true,
    canViewInflowKpi: true,
    canViewTasksKpi: true,
    canViewResearchKpi: false,
    canViewComplianceKpi: false,
    canViewAumTrendChart: true,
    canViewAssetAllocationChart: true,
    canViewResearchCallsChart: false,
    canAddClient: true,
    canCreateInvestment: true,
    canUseSipCalculator: true,
    canUseGoalPlanner: true,
    canUploadDocument: true,
    canGenerateReport: true,
    canPublishResearchCall: false,
    canViewRecentClients: true,
    canViewMyTasks: true,
    canViewMarketOverview: true,
    canViewRecentResearchCalls: false,
    canViewComplianceAlerts: false,
  },
  'Compliance Officer': {
    canViewClientsKpi: true,
    canViewAumKpi: false,
    canViewInvestmentsKpi: false,
    canViewInflowKpi: false,
    canViewTasksKpi: true,
    canViewResearchKpi: false,
    canViewComplianceKpi: true,
    canViewAumTrendChart: false,
    canViewAssetAllocationChart: true,
    canViewResearchCallsChart: false,
    canAddClient: false,
    canCreateInvestment: false,
    canUseSipCalculator: false,
    canUseGoalPlanner: false,
    canUploadDocument: true,
    canGenerateReport: true,
    canPublishResearchCall: false,
    canViewRecentClients: true,
    canViewMyTasks: true,
    canViewMarketOverview: true,
    canViewRecentResearchCalls: false,
    canViewComplianceAlerts: true,
  },
  'Research Analyst': {
    canViewClientsKpi: false,
    canViewAumKpi: false,
    canViewInvestmentsKpi: false,
    canViewInflowKpi: false,
    canViewTasksKpi: false,
    canViewResearchKpi: true,
    canViewComplianceKpi: false,
    canViewAumTrendChart: false,
    canViewAssetAllocationChart: false,
    canViewResearchCallsChart: true,
    canAddClient: false,
    canCreateInvestment: false,
    canUseSipCalculator: true,
    canUseGoalPlanner: false,
    canUploadDocument: true,
    canGenerateReport: true,
    canPublishResearchCall: true,
    canViewRecentClients: false,
    canViewMyTasks: false,
    canViewMarketOverview: true,
    canViewRecentResearchCalls: true,
    canViewComplianceAlerts: false,
  },
  'Auditor': {
    canViewClientsKpi: true,
    canViewAumKpi: true,
    canViewInvestmentsKpi: true,
    canViewInflowKpi: false,
    canViewTasksKpi: false,
    canViewResearchKpi: false,
    canViewComplianceKpi: true,
    canViewAumTrendChart: true,
    canViewAssetAllocationChart: true,
    canViewResearchCallsChart: false,
    canAddClient: false,
    canCreateInvestment: false,
    canUseSipCalculator: false,
    canUseGoalPlanner: false,
    canUploadDocument: false,
    canGenerateReport: true,
    canPublishResearchCall: false,
    canViewRecentClients: true,
    canViewMyTasks: false,
    canViewMarketOverview: true,
    canViewRecentResearchCalls: false,
    canViewComplianceAlerts: true,
  }
};

export function getDashboardPermissions(role?: string): RoleDashboardPermissions {
  if (!role || !ROLE_DASHBOARD_PERMISSIONS[role]) {
    return ROLE_DASHBOARD_PERMISSIONS['Relationship Manager'];
  }
  return ROLE_DASHBOARD_PERMISSIONS[role];
}

