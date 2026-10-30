import { apiFetch } from './api';

export interface WealthReport {
  id: string;
  title: string;
  type: string;
  period: string;
  size: string;
  format: 'PDF' | 'EXCEL' | 'CSV';
  generatedDate: string;
  category: 'Tax' | 'Portfolio' | 'Transaction' | 'Regulatory';
  clientName?: string;
  status?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  fileSize: string;
  filesCount: number;
  updatedAt: string;
}

function mapBackendReport(raw: any): WealthReport {
  return {
    id: raw.id,
    title: raw.title,
    type: raw.type,
    period: raw.period || 'Current FY',
    size: raw.size || '2.5 MB',
    format: (raw.format as any) || 'PDF',
    generatedDate: raw.generated_on || raw.date || 'Today',
    category: raw.type && raw.type.toLowerCase().includes('tax') ? 'Tax' : 'Portfolio',
    clientName: raw.client_name,
    status: raw.status
  };
}

export const reportService = {
  async getReports(): Promise<WealthReport[]> {
    try {
      const data = await apiFetch<any[]>('/reports');
      if (Array.isArray(data)) {
        return data.map(mapBackendReport);
      }
    } catch {
      // Offline / no DB
    }
    return [];
  },

  async createReport(title: string, reportType: string, clientName: string = 'General'): Promise<WealthReport> {
    const res = await apiFetch<any>('/reports', {
      method: 'POST',
      body: JSON.stringify({
        title,
        report_type: reportType,
        client_name: clientName,
        status: 'Generated'
      })
    });
    return mapBackendReport(res);
  },

  async getDocuments(): Promise<DocumentItem[]> {
    try {
      const data = await apiFetch<any[]>('/reports/documents');
      if (Array.isArray(data)) {
        return data.map(d => ({
          id: d.id,
          name: d.name,
          category: d.category,
          fileSize: d.file_size,
          filesCount: d.files_count,
          updatedAt: d.updated_at
        }));
      }
    } catch {
      // Offline / no DB
    }
    return [];
  },

  async addDocument(name: string, category: string = 'General', fileSize: string = '1.5 MB'): Promise<DocumentItem> {
    const res = await apiFetch<any>('/reports/documents', {
      method: 'POST',
      body: JSON.stringify({
        name,
        category,
        file_size: fileSize,
        files_count: 1
      })
    });
    return {
      id: res.id,
      name: res.name,
      category: res.category,
      fileSize: res.file_size,
      filesCount: res.files_count,
      updatedAt: res.updated_at
    };
  }
};
