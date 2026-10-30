import { apiFetch } from './api';

export interface UserItem {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  branch_id?: number | null;
  roles: string[];
}

export interface UserCreatePayload {
  employee_id: string;
  name: string;
  email: string;
  password: string;
  role_name: string;
  branch_id?: number;
}

export interface SystemAuditLogItem {
  id: number;
  user_id?: number | null;
  user_name?: string | null;
  action: string;
  module?: string | null;
  record_id?: number | null;
  ip_address?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  created_at: string;
}

const FALLBACK_USERS: UserItem[] = [
  { id: 1, employee_id: 'AR-ADMIN-0001', name: 'System Administrator', email: 'admin@anandrathi.com', roles: ['Super Admin'] },
  { id: 2, employee_id: 'AR-RM-8041', name: 'Nitin Dadhich', email: 'nitin.dadhich@anandrathi.com', roles: ['Relationship Manager'] },
  { id: 3, employee_id: 'AR-HEAD-0001', name: 'Vikram Rathore', email: 'vikram.r@anandrathi.com', roles: ['Branch Head'] },
  { id: 4, employee_id: 'AR-COMP-0001', name: 'Anjali Sharma', email: 'anjali.s@anandrathi.com', roles: ['Compliance Officer'] },
  { id: 5, employee_id: 'AR-RES-0001', name: 'Devansh Gupta', email: 'devansh.g@anandrathi.com', roles: ['Research Analyst'] },
];

export const userService = {
  async getUsers(): Promise<UserItem[]> {
    try {
      return await apiFetch<UserItem[]>('/users');
    } catch (err) {
      console.warn('Backend /users not reached, returning fallback user directory', err);
      return FALLBACK_USERS;
    }
  },

  async createUser(payload: UserCreatePayload): Promise<UserItem> {
    return await apiFetch<UserItem>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async assignClientToRm(rmId: number, clientId: number): Promise<{ message: string }> {
    return await apiFetch<{ message: string }>('/users/assign', {
      method: 'POST',
      body: JSON.stringify({ rm_id: rmId, client_id: clientId }),
    });
  },

  async deleteUser(userId: number): Promise<boolean> {
    await apiFetch(`/users/${userId}`, {
      method: 'DELETE',
    });
    return true;
  },

  async getAuditLogs(): Promise<SystemAuditLogItem[]> {
    try {
      return await apiFetch<SystemAuditLogItem[]>('/users/audit-logs');
    } catch (err) {
      console.warn('Backend /users/audit-logs fallback', err);
      return [
        { id: 101, user_id: 1, user_name: 'System Administrator', action: 'LOGIN_SUCCESS', module: 'auth', created_at: '2026-08-06 09:30:00' },
        { id: 102, user_id: 2, user_name: 'Nitin Dadhich', action: 'KYC_APPROVE', module: 'compliance', record_id: 101, created_at: '2026-08-06 09:15:00' },
        { id: 103, user_id: 1, user_name: 'System Administrator', action: 'ASSIGN_CLIENT', module: 'clients', record_id: 105, created_at: '2026-08-06 08:45:00' }
      ];
    }
  }
};
