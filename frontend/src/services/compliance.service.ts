import { apiFetch } from './api';

export interface ComplianceLogItem {
  id: number;
  client: string;
  type: string;
  date: string;
  status: string;
  auditor: string;
}

export const complianceService = {
  async getComplianceLogs(): Promise<ComplianceLogItem[]> {
    try {
      const res = await apiFetch<any[]>('/compliance/logs');
      if (Array.isArray(res)) {
        return res.map((c: any) => ({
          id: c.id,
          client: c.client,
          type: c.type,
          date: c.date,
          status: c.status,
          auditor: c.auditor,
        }));
      }
    } catch {
      // Offline / no DB
    }
    return [];
  }
};
