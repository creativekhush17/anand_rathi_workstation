import { apiFetch, setTokens, clearTokens, ApiError } from './api';
import { UserSession } from '../types';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user?: {
    id: number;
    employee_id: string;
    name: string;
    email: string;
    branch_id: number | null;
    roles: string[];
  };
}

const EMPLOYEE_DIRECTORY: Record<string, { name: string; role: string; branch: string }> = {
  'AR-ADMIN-0001': { name: 'System Administrator', role: 'Super Admin', branch: 'Jodhpur Corporate Office' },
  'AR-RM-8041': { name: 'Nitin Dadhich', role: 'Relationship Manager', branch: 'Jodhpur Corporate Office' },
  'AR-HEAD-0001': { name: 'Vikram Rathore', role: 'Branch Head', branch: 'Jodhpur Corporate Office' },
  'AR-COMP-0001': { name: 'Anjali Sharma', role: 'Compliance Officer', branch: 'Jodhpur Corporate Office' },
  'AR-RES-0001': { name: 'Devansh Gupta', role: 'Research Analyst', branch: 'Jodhpur Corporate Office' },
  'AR-AUDIT-0001': { name: 'Karan Verma', role: 'Auditor', branch: 'Jodhpur Corporate Office' },
};

export const authService = {
  async login(employeeId: string, password: string): Promise<UserSession> {
    const cleanId = employeeId.trim();

    try {
      const response = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: cleanId,
          password: password,
        }),
      });

      setTokens(response.access_token, response.refresh_token);

      const fallback = EMPLOYEE_DIRECTORY[cleanId] || {
        name: cleanId,
        role: 'Relationship Manager',
        branch: 'Jodhpur Corporate Office',
      };

      return {
        employeeId: response.user?.employee_id || cleanId,
        name: response.user?.name || fallback.name,
        role: response.user?.roles?.[0] || fallback.role,
        branch: fallback.branch,
        token: response.access_token,
      };
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw new Error(err.message || 'Invalid employee ID or password');
      }
      throw new Error('Database connection failed. Please ensure PostgreSQL & FastAPI backend server (http://127.0.0.1:8000) are running.');
    }
  },

  logout(): void {
    clearTokens();
  }
};
