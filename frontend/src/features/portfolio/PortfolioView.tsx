import React, { useEffect, useState } from 'react';
import { Briefcase, Landmark, TrendingUp, ChevronDown, Percent, ArrowUpRight, ArrowDownRight, ArrowRight, RefreshCw, Plus, Minus, Search } from 'lucide-react';
import { portfolioService } from '../../services/portfolio.service';
import { clientService } from '../../services/client.service';
import { Client, ClientPortfolio, Holding } from '../../types';

interface PortfolioViewProps {
  clientId?: string;
  onClientChange?: (clientId: string) => void;
  userRole?: string;
}

export default function PortfolioView({ clientId, onClientChange, userRole }: PortfolioViewProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [portfolio, setPortfolio] = useState<ClientPortfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Role permissions
  const allowedTradeRoles = ['Super Admin', 'Branch Head', 'Relationship Manager'];
  const canTrade = allowedTradeRoles.includes(userRole || '');

  // Buy/Sell Order states
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [orderCategory, setOrderCategory] = useState<'Equity' | 'Mutual Fund'>('Equity');
  const [orderSymbol, setOrderSymbol] = useState('RELIANCE');
  const [orderQuantity, setOrderQuantity] = useState(10);
  const [orderPrice, setOrderPrice] = useState(2432.15);
  const [orderMessage, setOrderMessage] = useState('');

  const availableSymbols: Record<string, { name: string; price: number }> = {
    RELIANCE: { name: 'Reliance Industries Ltd.', price: 2432.15 },
    HDFCBANK: { name: 'HDFC Bank Ltd.', price: 1654.80 },
    TCS: { name: 'Tata Consultancy Services Ltd.', price: 3820.40 },
    INFY: { name: 'Infosys Ltd.', price: 1540.20 },
    PP_FLEXI: { name: 'Parag Parikh Flexi Cap - Growth', price: 59.45 },
    SBI_BLUECHIP: { name: 'SBI Bluechip Fund - Growth', price: 71.80 }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (clientId) {
      loadPortfolioForClient(clientId);
    } else if (clients.length > 0 && !selectedClient) {
      loadPortfolioForClient(clients[0].id);
      if (onClientChange) onClientChange(clients[0].id);
    }
  }, [clientId, clients]);

  const fetchClients = async () => {
    const list = await clientService.getClients();
    setClients(list);
  };

  const loadPortfolioForClient = async (id: string) => {
    setLoading(true);
    const clientObj = clients.find(c => c.id === id);
    if (clientObj) {
      setSelectedClient(clientObj);
      const port = await portfolioService.getPortfolioByClientId(id, clientObj.aum);
      setPortfolio(port);
    }
    setLoading(false);
  };

  const handleClientSelect = (id: string) => {
    if (onClientChange) {
      onClientChange(id);
    } else {
      loadPortfolioForClient(id);
    }
  };

  const handleSymbolChange = (sym: string) => {
    setOrderSymbol(sym);
    if (availableSymbols[sym]) {
      setOrderPrice(availableSymbols[sym].price);
    }
  };

  const handleExecuteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolio || !selectedClient || !canTrade) return;

    const symDetails = availableSymbols[orderSymbol];
    if (!symDetails) return;

    const orderValue = orderQuantity * orderPrice;

    try {
      if (orderType === 'BUY') {
        await portfolioService.addHolding({
          clientId: selectedClient.id,
          symbol: orderSymbol,
          name: symDetails.name,
          category: orderCategory,
          quantity: orderQuantity,
          buyPrice: orderPrice,
          currentPrice: orderPrice
        });
        setOrderMessage(`Success: Purchased ${orderQuantity} shares of ${orderSymbol} for ₹ ${orderValue.toLocaleString('en-IN')} (Saved to PostgreSQL DB)`);
      } else {
        // SELL order
        const existing = portfolio.holdings.find(h => h.symbol === orderSymbol);
        if (!existing) {
          setOrderMessage(`Error: Insufficient holding quantity of ${orderSymbol} to sell.`);
          return;
        }
        await portfolioService.deleteHolding(existing.id);
        setOrderMessage(`Success: Liquidated holding ${orderSymbol} (Updated in PostgreSQL DB)`);
      }

      // Reload portfolio directly from live PostgreSQL database
      await loadPortfolioForClient(selectedClient.id);
    } catch (err: any) {
      setOrderMessage(`Order Error: ${err.message || 'Database transaction failed'}`);
    }

    // Clear alert message after 4s
    setTimeout(() => setOrderMessage(''), 4000);
  };

  // Math helper
  const calculateTotalInvested = () => {
    if (!portfolio) return 0;
    return portfolio.holdings.reduce((sum, h) => sum + (h.quantity * h.buyPrice), 0) / 10000000;
  };

  const calculateUnrealizedGain = () => {
    if (!portfolio) return 0;
    return portfolio.holdings.reduce((sum, h) => sum + h.gainLoss, 0) / 10000000;
  };

  const totalInvestedCr = calculateTotalInvested();
  const totalGainCr = calculateUnrealizedGain();

  return (
    <div className="space-y-6">
      {/* Client selector panel */}
      <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-5 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 bg-brand-gold/10 text-brand-gold rounded-xl">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-bold text-brand-text uppercase tracking-wider">Portfolio Analytics</h2>
            <p className="text-[10px] text-brand-text-muted mt-0.5">Explore active asset positions, gains, and trade history.</p>
          </div>
        </div>

        {/* Searchable Client Selector */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
          <span className="text-[10px] text-brand-text-muted uppercase font-bold self-center">Active Portfolio:</span>
          <div className="relative">
            <select
              value={clientId || ''}
              onChange={(e) => handleClientSelect(e.target.value)}
              className="w-full sm:w-60 text-xs font-bold border border-brand-border rounded-lg bg-brand-primary-bg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-gold"
            >
              <option value="">-- Choose HNI Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} (₹{c.aum} Cr)</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-brand-card-bg border border-brand-border rounded-xl p-16 text-center shadow-sm">
          <RefreshCw className="w-6 h-6 text-brand-gold animate-spin mx-auto" />
          <p className="text-xs font-bold text-brand-text-muted mt-3">Fetching private ledger portfolio holdings...</p>
        </div>
      ) : !selectedClient || !portfolio ? (
        /* Empty State */
        <div className="bg-brand-card-bg border border-brand-border rounded-2xl p-16 text-center shadow-sm max-w-xl mx-auto space-y-4">
          <Briefcase className="w-12 h-12 text-brand-gold/40 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider">No Client Selected</h3>
            <p className="text-xs text-brand-text-muted mt-1 max-w-xs mx-auto">
              Please choose an active HNI/UHNI client from the dropdown menu above to inspect their real-time assets ledger.
            </p>
          </div>
          <div className="border-t border-brand-border/40 pt-4 max-h-48 overflow-y-auto space-y-1 text-left">
            <span className="text-[9px] text-brand-text-muted uppercase font-bold px-2">Quick Selection Directory:</span>
            {clients.map(c => (
              <div 
                key={c.id} 
                onClick={() => handleClientSelect(c.id)}
                className="flex justify-between items-center px-3 py-2 rounded-lg hover:bg-brand-primary-bg cursor-pointer transition-colors"
              >
                <span className="text-xs font-medium text-brand-text">{c.name}</span>
                <span className="text-xs font-bold text-brand-gold">₹ {c.aum} Cr</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Portfolio Loaded */
        <div className="space-y-6">
          {/* Portfolio Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm text-left">
              <span className="text-[9px] text-brand-text-muted uppercase font-bold">Consolidated Valuation (AUM)</span>
              <h3 className="text-xl font-display font-black text-brand-gold mt-1.5">₹ {portfolio.totalAum.toFixed(2)} Cr</h3>
              <p className="text-[10px] text-brand-text-muted mt-1">Staged in active capital pools.</p>
            </div>

            <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm text-left">
              <span className="text-[9px] text-brand-text-muted uppercase font-bold">Net Invested Cost</span>
              <h3 className="text-xl font-display font-bold text-brand-text mt-1.5">₹ {totalInvestedCr.toFixed(2)} Cr</h3>
              <p className="text-[10px] text-brand-text-muted mt-1">Sovereign bonds & corporate equities.</p>
            </div>

            <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm text-left">
              <span className="text-[9px] text-brand-text-muted uppercase font-bold">Unrealized Wealth Gain</span>
              <h3 className={`text-xl font-display font-bold mt-1.5 ${totalGainCr >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                {totalGainCr >= 0 ? '+' : ''} ₹ {totalGainCr.toFixed(2)} Cr
              </h3>
              <p className="text-[10px] text-brand-text-muted mt-1 flex items-center gap-1">
                {totalGainCr >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 text-brand-success" /> : <ArrowDownRight className="w-3.5 h-3.5 text-brand-danger" />}
                {((totalGainCr / (totalInvestedCr || 1)) * 100).toFixed(1)}% absolute gains.
              </p>
            </div>

            <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm text-left">
              <span className="text-[9px] text-brand-text-muted uppercase font-bold">Annualized CAGR %</span>
              <h3 className="text-xl font-display font-bold text-brand-success mt-1.5">14.8 %</h3>
              <p className="text-[10px] text-brand-text-muted mt-1">Compounded trailing 3-year return.</p>
            </div>
          </div>

          {/* Holdings and Interactive Transaction block */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Holdings Table */}
            <div className={`${canTrade ? 'lg:col-span-2' : 'lg:col-span-3'} bg-brand-card-bg border border-brand-border rounded-xl p-6 shadow-sm flex flex-col justify-between`}>
              <div>
                <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-5">Asset Holdings Ledger</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border/60 text-[10px] uppercase text-brand-text-muted font-bold">
                        <th className="pb-3 pl-2">Security / Fund</th>
                        <th className="pb-3 text-right">Hold Qty</th>
                        <th className="pb-3 text-right">Avg Buy Price</th>
                        <th className="pb-3 text-right">Current Price</th>
                        <th className="pb-3 text-right">Valuation (INR)</th>
                        <th className="pb-3 text-right pr-2">Gain / Loss</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/35 text-xs">
                      {portfolio.holdings.map((h) => (
                        <tr key={h.id} className="hover:bg-brand-primary-bg/45 transition-colors">
                          <td className="py-3.5 pl-2">
                            <span className="font-bold text-brand-text block max-w-[180px] truncate">{h.symbol}</span>
                            <span className="text-[9px] text-brand-text-muted block mt-0.5 max-w-[180px] truncate">{h.name}</span>
                          </td>
                          <td className="py-3.5 text-right font-mono font-medium">{h.quantity.toLocaleString('en-IN')}</td>
                          <td className="py-3.5 text-right font-mono text-brand-text-muted">₹{h.buyPrice.toFixed(1)}</td>
                          <td className="py-3.5 text-right font-mono text-brand-text font-bold">₹{h.currentPrice.toFixed(1)}</td>
                          <td className="py-3.5 text-right font-mono font-bold text-brand-text">₹{h.marketValue.toLocaleString('en-IN')}</td>
                          <td className="py-3.5 text-right pr-2">
                            <span className={`font-mono font-bold block ${h.gainLoss >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                              {h.gainLoss >= 0 ? '+' : ''}₹{h.gainLoss.toLocaleString('en-IN')}
                            </span>
                            <span className={`text-[9px] font-bold mt-0.5 block ${h.gainLoss >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                              {h.gainLoss >= 0 ? '▲' : '▼'} {h.gainLossPercentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-brand-border/60 pt-4 flex justify-between items-center mt-6">
                <span className="text-[10px] text-brand-text-muted">Liquid cash balance in portfolio:</span>
                <span className="text-xs font-bold text-brand-text">₹ {portfolio.cashValue.toFixed(2)} Cr</span>
              </div>
            </div>

            {/* Interactive Transaction panel (Only rendered if canTrade is true) */}
            {canTrade && (
              <div className="bg-brand-card-bg border border-brand-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-5">Order Allocation Panel</h3>

                  {orderMessage && (
                    <div className={`p-3 rounded-lg text-xs font-bold mb-4 ${orderMessage.includes('Success') ? 'bg-brand-success/10 text-brand-success border border-brand-success/20' : 'bg-brand-danger/10 text-brand-danger border border-brand-danger/20'}`}>
                      {orderMessage}
                    </div>
                  )}

                  <form onSubmit={handleExecuteOrder} className="space-y-4 text-left">
                    {/* Action Selector */}
                    <div>
                      <label className="text-[10px] text-brand-text-muted uppercase font-bold">Action</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setOrderType('BUY')}
                          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-all ${
                            orderType === 'BUY'
                              ? 'bg-brand-gold text-white border-brand-gold shadow-sm'
                              : 'border-brand-border text-brand-text-muted hover:bg-brand-secondary-bg'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" /> BUY ORDER
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType('SELL')}
                          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-all ${
                            orderType === 'SELL'
                              ? 'bg-brand-danger text-white border-brand-danger shadow-sm'
                              : 'border-brand-border text-brand-text-muted hover:bg-brand-secondary-bg'
                          }`}
                        >
                          <Minus className="w-3.5 h-3.5" /> SELL ORDER
                        </button>
                      </div>
                    </div>

                    {/* Security Picker */}
                    <div>
                      <label className="text-[10px] text-brand-text-muted uppercase font-bold">Select Asset Security</label>
                      <select
                        value={orderSymbol}
                        onChange={(e) => handleSymbolChange(e.target.value)}
                        className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold"
                      >
                        <option value="RELIANCE">RELIANCE (Reliance Industries Ltd. - Equity)</option>
                        <option value="HDFCBANK">HDFCBANK (HDFC Bank Ltd. - Equity)</option>
                        <option value="TCS">TCS (Tata Consultancy Services Ltd. - Equity)</option>
                        <option value="INFY">INFY (Infosys Ltd. - Equity)</option>
                        <option value="PP_FLEXI">PP_FLEXI (Parag Parikh Flexi Cap Fund - MF)</option>
                        <option value="SBI_BLUECHIP">SBI_BLUECHIP (SBI Bluechip Fund - MF)</option>
                      </select>
                    </div>

                    {/* Quantity and Price */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-brand-text-muted uppercase font-bold">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={orderQuantity}
                          onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-brand-text-muted uppercase font-bold">Asset Price (₹)</label>
                        <input
                          type="number"
                          disabled
                          value={orderPrice}
                          className="w-full text-xs bg-brand-secondary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 text-brand-text-muted focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Order Estimator */}
                    <div className="bg-brand-primary-bg border border-brand-border/60 rounded-xl p-3.5 text-xs space-y-2">
                      <div className="flex justify-between text-brand-text-muted">
                        <span>Staged Principal Value:</span>
                        <span className="font-mono">₹ {(orderQuantity * orderPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-brand-text-muted">
                        <span>Transactional Taxes (GST/STT):</span>
                        <span className="font-mono">₹ {((orderQuantity * orderPrice) * 0.001).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="border-t border-brand-border/40 pt-2 flex justify-between font-bold text-brand-text">
                        <span>Total Estimated Value:</span>
                        <span className="font-mono text-brand-gold">₹ {((orderQuantity * orderPrice) * 1.001).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className={`w-full font-bold py-2.5 rounded-lg text-xs transition-colors shadow-sm ${
                        orderType === 'BUY'
                          ? 'bg-brand-gold hover:bg-brand-gold-accent text-white'
                          : 'bg-brand-danger hover:bg-brand-danger/90 text-white'
                      }`}
                    >
                      Place Staged {orderType === 'BUY' ? 'Purchase' : 'Liquidation'} Order
                    </button>
                  </form>
                </div>

                <div className="text-[9px] text-brand-text-muted leading-relaxed mt-6 italic border-t border-brand-border/40 pt-3">
                  * Note: Placing orders inside this Workstation simulator updates the local DB cache.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
