import { ClientPortfolio } from '../types';
import { apiFetch } from './api';

export const portfolioService = {
  async getPortfolioByClientId(clientId: string, defaultAum?: number): Promise<ClientPortfolio> {
    try {
      const data = await apiFetch<any>(`/portfolio/${clientId}`);
      return {
        clientId: data.client_id || clientId,
        equityValue: data.equity_value || 0,
        debtValue: data.debt_value || 0,
        mfValue: data.mf_value || 0,
        cashValue: data.cash_value || 0,
        otherValue: data.other_value || 0,
        totalAum: data.total_aum || defaultAum || 0,
        holdings: (data.holdings || []).map((h: any) => ({
          id: h.id,
          symbol: h.symbol,
          name: h.name,
          category: h.category,
          quantity: h.quantity,
          buyPrice: h.buy_price,
          currentPrice: h.current_price,
          marketValue: h.market_value,
          gainLoss: h.gain_loss,
          gainLossPercentage: h.gain_loss_percentage
        }))
      };
    } catch {
      return {
        clientId: clientId || '',
        equityValue: 0,
        debtValue: 0,
        mfValue: 0,
        cashValue: 0,
        otherValue: 0,
        totalAum: 0,
        holdings: []
      };
    }
  },

  async updatePortfolio(updatedPortfolio: ClientPortfolio): Promise<ClientPortfolio> {
    return updatedPortfolio;
  },

  async addHolding(holding: { clientId: string; symbol: string; name: string; category: string; quantity: number; buyPrice: number; currentPrice: number }) {
    return await apiFetch<any>('/portfolio/holdings', {
      method: 'POST',
      body: JSON.stringify({
        client_id: holding.clientId,
        symbol: holding.symbol,
        name: holding.name,
        category: holding.category,
        quantity: holding.quantity,
        buy_price: holding.buyPrice,
        current_price: holding.currentPrice,
      }),
    });
  },

  async deleteHolding(holdingId: string) {
    return await apiFetch(`/portfolio/holdings/${holdingId}`, {
      method: 'DELETE',
    });
  }
};
