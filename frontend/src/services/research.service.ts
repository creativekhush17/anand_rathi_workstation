import { ResearchCall } from '../types';
import { apiFetch } from './api';

function mapBackendResearchCall(raw: any): ResearchCall {
  return {
    id: raw.id,
    type: raw.type,
    symbol: raw.symbol,
    companyName: raw.company_name,
    sector: raw.sector || '',
    entryPrice: raw.entry_price,
    targetPrice: raw.target_price,
    stopLoss: raw.stop_loss,
    timeline: raw.timeline || '6 Months',
    rationale: raw.rationale || '',
    date: raw.date || 'Today'
  };
}

export const researchService = {
  async getResearchCalls(): Promise<ResearchCall[]> {
    try {
      const data = await apiFetch<any[]>('/research/calls');
      if (Array.isArray(data)) {
        return data.map(mapBackendResearchCall);
      }
    } catch {
      // Offline / no DB
    }
    return [];
  },

  async addResearchCall(call: Omit<ResearchCall, 'id' | 'date'>): Promise<ResearchCall> {
    const res = await apiFetch<any>('/research/calls', {
      method: 'POST',
      body: JSON.stringify({
        type: call.type,
        symbol: call.symbol,
        company_name: call.companyName,
        sector: call.sector,
        entry_price: call.entryPrice,
        target_price: call.targetPrice,
        stop_loss: call.stopLoss,
        timeline: call.timeline,
        rationale: call.rationale,
      })
    });
    return mapBackendResearchCall(res);
  },

  async deleteResearchCall(id: string): Promise<boolean> {
    await apiFetch(`/research/calls/${id}`, {
      method: 'DELETE'
    });
    return true;
  }
};
