import React, { useEffect, useState } from 'react';
import { BookOpen, RefreshCw, Plus, X } from 'lucide-react';
import { researchService } from '../../services/research.service';
import { ResearchCall } from '../../types';

interface ResearchViewProps {
  userRole?: string;
}

export default function ResearchView({ userRole }: ResearchViewProps) {
  const [calls, setCalls] = useState<ResearchCall[]>([]);
  const [loading, setLoading] = useState(false);

  // Role permissions
  const canPublish = ['Super Admin', 'Research Analyst'].includes(userRole || '');

  // Publish Call Modal state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [callType, setCallType] = useState<'BUY' | 'SELL' | 'HOLD'>('BUY');
  const [symbol, setSymbol] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [sector, setSector] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [timeline, setTimeline] = useState('3-6 Months');
  const [rationale, setRationale] = useState('');

  useEffect(() => {
    fetchResearch();
  }, []);

  const fetchResearch = async () => {
    setLoading(true);
    const data = await researchService.getResearchCalls();
    setCalls(data);
    setLoading(false);
  };

  const handlePublishCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !companyName || !rationale) return;

    await researchService.addResearchCall({
      type: callType,
      symbol: symbol.toUpperCase(),
      companyName,
      sector: sector || 'General Sector',
      entryPrice: parseFloat(entryPrice) || 0,
      targetPrice: parseFloat(targetPrice) || 0,
      stopLoss: parseFloat(stopLoss) || 0,
      timeline,
      rationale
    });

    // Reset Form
    setSymbol('');
    setCompanyName('');
    setSector('');
    setEntryPrice('');
    setTargetPrice('');
    setStopLoss('');
    setRationale('');
    setShowPublishModal(false);

    fetchResearch();
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title Header */}
      <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-gold/10 text-brand-gold rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-brand-text uppercase tracking-wider">Research & Advisory Calls</h2>
            <p className="text-[10px] text-brand-text-muted mt-0.5">Tactical equity and mutual fund calls sourced from Anand Rathi Research Team.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {canPublish && (
            <button
              id="btn-publish-research"
              onClick={() => setShowPublishModal(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-brand-gold hover:bg-brand-gold-accent px-3.5 py-2 rounded-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publish Research Call</span>
            </button>
          )}

          <button 
            id="btn-refresh-research"
            onClick={fetchResearch}
            className="flex items-center gap-1.5 text-xs font-bold text-brand-gold bg-brand-gold/10 border border-brand-gold/20 px-3.5 py-2 rounded-lg hover:bg-brand-gold hover:text-white transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Research</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-brand-card-bg border border-brand-border rounded-xl p-16 text-center shadow-sm">
          <RefreshCw className="w-6 h-6 text-brand-gold animate-spin mx-auto" />
          <p className="text-xs font-bold text-brand-text-muted mt-3">Fetching investment analytics advisory indices...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {calls.map((call) => (
            <div 
              key={call.id} 
              className="bg-brand-card-bg border border-brand-border rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden"
            >
              {/* Call indicator decoration */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                call.type === 'BUY' ? 'bg-brand-success' : call.type === 'SELL' ? 'bg-brand-danger' : 'bg-brand-gold'
              }`} />

              <div>
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold">{call.sector}</span>
                    <h3 className="text-xs font-bold text-brand-text mt-1">{call.companyName} ({call.symbol})</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {canPublish && (
                      <button
                        onClick={async () => {
                          await researchService.deleteResearchCall(call.id);
                          fetchResearch();
                        }}
                        title="Delete Research Call"
                        className="p-1 text-brand-text-muted hover:text-red-600 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${
                      call.type === 'BUY' 
                        ? 'bg-brand-success/15 text-brand-success border-brand-success/20' 
                        : call.type === 'SELL' 
                          ? 'bg-brand-danger/15 text-brand-danger border-brand-danger/20' 
                          : 'bg-brand-gold/15 text-brand-gold border-brand-gold/20'
                    }`}>
                      {call.type} CALL
                    </span>
                  </div>
                </div>

                {/* Pricing values */}
                <div className="grid grid-cols-3 gap-3 bg-brand-primary-bg/50 border border-brand-border/60 rounded-xl p-4 mt-4 text-left">
                  <div>
                    <span className="text-[9px] text-brand-text-muted uppercase tracking-wider font-semibold">Entry / CMP</span>
                    <p className="text-xs font-mono font-bold text-brand-text mt-0.5">₹ {call.entryPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-brand-text-muted uppercase tracking-wider font-semibold">Target Price</span>
                    <p className="text-xs font-mono font-bold text-brand-success mt-0.5">₹ {call.targetPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-brand-text-muted uppercase tracking-wider font-semibold">Stop Loss</span>
                    <p className="text-xs font-mono font-bold text-brand-danger mt-0.5">₹ {call.stopLoss.toFixed(2)}</p>
                  </div>
                </div>

                {/* Analytical summary */}
                <div className="mt-4">
                  <h4 className="text-[10px] text-brand-text uppercase tracking-wider font-bold">Research Rationale:</h4>
                  <p className="text-[11px] text-brand-text-muted mt-1 leading-relaxed">{call.rationale}</p>
                </div>
              </div>

              {/* Advisory footer */}
              <div className="mt-6 pt-3 border-t border-brand-border/40 flex justify-between items-center text-[10px] text-brand-text-muted font-medium">
                <span>Timeline: <strong className="text-brand-text">{call.timeline}</strong></span>
                <span>Advisory Date: <strong className="text-brand-text">{call.date}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Publish Research Call */}
      {showPublishModal && canPublish && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <form onSubmit={handlePublishCall} className="bg-brand-card-bg border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-xl animate-scale-up">
            <div className="flex justify-between items-center border-b border-brand-border pb-3">
              <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-gold" /> Publish Research Advisory Call
              </h3>
              <button type="button" onClick={() => setShowPublishModal(false)} className="text-brand-text-muted hover:text-brand-gold">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-brand-text-muted uppercase font-bold">Call Action *</label>
                  <select 
                    value={callType} onChange={(e) => setCallType(e.target.value as any)}
                    className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold font-bold"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                    <option value="HOLD">HOLD</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-brand-text-muted uppercase font-bold">Ticker Symbol *</label>
                  <input 
                    type="text" required value={symbol} onChange={(e) => setSymbol(e.target.value)}
                    placeholder="e.g. INFOSYS"
                    className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold">Company Name *</label>
                <input 
                  type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Infosys Ltd."
                  className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold">Sector / Industry</label>
                <input 
                  type="text" value={sector} onChange={(e) => setSector(e.target.value)}
                  placeholder="e.g. Information Technology"
                  className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-brand-text-muted uppercase font-bold">Entry Price (₹)</label>
                  <input 
                    type="number" step="0.1" required value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)}
                    placeholder="1500"
                    className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-2.5 py-2 mt-1 focus:outline-none focus:border-brand-gold font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-brand-text-muted uppercase font-bold">Target (₹)</label>
                  <input 
                    type="number" step="0.1" required value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="1800"
                    className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-2.5 py-2 mt-1 focus:outline-none focus:border-brand-gold font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-brand-text-muted uppercase font-bold">Stop Loss (₹)</label>
                  <input 
                    type="number" step="0.1" required value={stopLoss} onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="1400"
                    className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-2.5 py-2 mt-1 focus:outline-none focus:border-brand-gold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold">Timeline</label>
                <select 
                  value={timeline} onChange={(e) => setTimeline(e.target.value)}
                  className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold"
                >
                  <option value="1-3 Months">1-3 Months</option>
                  <option value="3-6 Months">3-6 Months</option>
                  <option value="6-12 Months">6-12 Months</option>
                  <option value="Long Term">Long Term (&gt; 1 Year)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold">Research Rationale *</label>
                <textarea 
                  required rows={3} value={rationale} onChange={(e) => setRationale(e.target.value)}
                  placeholder="Explain fundamental analysis, technical setup, and valuation triggers..."
                  className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-brand-border flex gap-3">
              <button 
                type="button" onClick={() => setShowPublishModal(false)}
                className="flex-1 bg-brand-secondary-bg hover:bg-brand-border/40 text-brand-text-muted font-bold py-2 rounded-lg text-xs transition-colors border border-brand-border"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 bg-brand-gold hover:bg-brand-gold-accent text-white font-bold py-2 rounded-lg text-xs transition-colors"
              >
                Publish Call
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
