import React, { useState } from 'react';
import { Layers, LineChart, Percent, Award, ShieldAlert, Receipt, Search, Filter, TrendingUp, Info } from 'lucide-react';

interface InvestmentProduct {
  id: string;
  category: 'Mutual Fund' | 'Bond' | 'Equity' | 'PMS' | 'Insurance' | 'Loan';
  name: string;
  ticker?: string;
  rating?: string;
  minInvestment: string;
  historicalYield: string;
  riskProfile: 'High' | 'Moderate' | 'Low';
  fundManager?: string;
  description: string;
}

interface InvestmentsViewProps {
  initialCategory?: 'All' | 'Mutual Fund' | 'Bond' | 'Equity' | 'PMS' | 'Insurance' | 'Loan';
  userRole?: string;
}

export default function InvestmentsView({ initialCategory = 'All', userRole }: InvestmentsViewProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'Mutual Fund' | 'Bond' | 'Equity' | 'PMS' | 'Insurance' | 'Loan'>(initialCategory);
  const [search, setSearch] = useState('');

  const canBuy = ['Super Admin', 'Branch Head', 'Relationship Manager'].includes(userRole || '');

  React.useEffect(() => {
    setActiveTab(initialCategory);
  }, [initialCategory]);

  const products: InvestmentProduct[] = [
    {
      id: 'P1',
      category: 'Mutual Fund',
      name: 'Parag Parikh Flexi Cap Fund - Direct Growth',
      rating: 'CRISIL 5-Star',
      minInvestment: '₹ 1,000 / month',
      historicalYield: '19.4% (3Y CAGR)',
      riskProfile: 'High',
      fundManager: 'Rajeev Thakkar',
      description: 'An open-ended dynamic equity scheme investing across large cap, mid cap, and small cap stocks, with international asset allocations.'
    },
    {
      id: 'P2',
      category: 'Mutual Fund',
      name: 'HDFC Balanced Advantage Fund - Direct Growth',
      rating: 'CRISIL 4-Star',
      minInvestment: '₹ 5,000 / lumpsum',
      historicalYield: '15.2% (3Y CAGR)',
      riskProfile: 'Moderate',
      fundManager: 'Gopal Agrawal',
      description: 'An open-ended dynamic asset allocation scheme investing in equities, arbitrage pools, and debt instruments according to market weights.'
    },
    {
      id: 'P3',
      category: 'Bond',
      name: '7.18% Government of India Sovereign Bond 2033',
      rating: 'Sovereign (AAA)',
      minInvestment: '₹ 10,000',
      historicalYield: '7.18% p.a. (Semi-Annual)',
      riskProfile: 'Low',
      description: 'Sovereign-backed fixed-income security issued by the Reserve Bank of India. Capital preservation with absolute safety.'
    },
    {
      id: 'P4',
      category: 'Bond',
      name: 'NABARD Tax-Free Corporate Bonds',
      rating: 'CRISIL AAA Stable',
      minInvestment: '₹ 50,000',
      historicalYield: '6.45% p.a. (Annual)',
      riskProfile: 'Low',
      description: 'Secured tax-free redeemable non-convertible bonds. Ideal for HNIs seeking tax-exempt fixed annuity cashflows.'
    },
    {
      id: 'P5',
      category: 'Equity',
      name: 'Reliance Industries Limited',
      ticker: 'RELIANCE',
      minInvestment: '1 Share',
      historicalYield: '12.8% (3Y CAGR)',
      riskProfile: 'Moderate',
      description: 'India\'s largest multinational conglomerate spanning oil-to-chemicals, retail outlets, Jio digital services, and green energy projects.'
    },
    {
      id: 'P6',
      category: 'Equity',
      name: 'Tata Consultancy Services Limited',
      ticker: 'TCS',
      minInvestment: '1 Share',
      historicalYield: '14.5% (3Y CAGR)',
      riskProfile: 'Moderate',
      description: 'Premier global IT services, consulting and business solutions organization with strong operational margins and premium dividend payouts.'
    },
    {
      id: 'P7',
      category: 'PMS',
      name: 'Anand Rathi Impress PMS Portfolio',
      rating: 'Premium Strategy',
      minInvestment: '₹ 50,00,000',
      historicalYield: '22.8% (3Y CAGR)',
      riskProfile: 'High',
      fundManager: 'Mayur Shah',
      description: 'A concentrated multi-cap portfolio targeting companies benefiting from India\'s structural shifts, led by active growth valuation research.'
    },
    {
      id: 'P8',
      category: 'Insurance',
      name: 'HDFC Life Sanchay Plus - Guaranteed Income',
      rating: 'IRDAI Approved',
      minInvestment: '₹ 1,00,000 / p.a.',
      historicalYield: 'Guaranteed Benefits',
      riskProfile: 'Low',
      description: 'A non-participating, non-linked life insurance savings plan providing guaranteed regular income and robust life cover.'
    },
    {
      id: 'P9',
      category: 'Loan',
      name: 'Loan Against Securities (LAS)',
      rating: '9.45% Interest Rate',
      minInvestment: '₹ 5,00,000 Min Loan',
      historicalYield: 'Overdraft Limit',
      riskProfile: 'Moderate',
      description: 'Unlock liquidity instantly by pledging mutual fund units or blue-chip equities without selling them. Pay interest only on utilized limit.'
    }
  ];

  const filteredProducts = products.filter(p => {
    const matchesTab = activeTab === 'All' || p.category === activeTab;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase()) ||
                          (p.ticker && p.ticker.toLowerCase().includes(search.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const tabIcons: Record<string, any> = {
    'All': TrendingUp,
    'Mutual Fund': Layers,
    'Bond': Percent,
    'Equity': LineChart,
    'PMS': Award,
    'Insurance': ShieldAlert,
    'Loan': Receipt
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title block */}
      <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-brand-text uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-gold" /> Wealth Investments Catalogue
        </h2>
        <p className="text-[10px] text-brand-text-muted mt-0.5">Explore approved Indian Mutual Funds, Corporate Bonds, PMS strategies, and credit tools.</p>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 border-b border-brand-border/60 pb-3">
        {(['All', 'Mutual Fund', 'Bond', 'Equity', 'PMS', 'Insurance', 'Loan'] as const).map((tab) => {
          const IconObj = tabIcons[tab];
          return (
            <button
              key={tab}
              id={`invest-tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border ${
                activeTab === tab
                  ? 'bg-brand-gold text-white border-brand-gold shadow-sm'
                  : 'bg-brand-card-bg border-brand-border text-brand-text-muted hover:bg-brand-secondary-bg hover:text-brand-text'
              }`}
            >
              <IconObj className="w-4 h-4" />
              <span>{tab === 'All' ? 'All Assets' : tab + 's'}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative w-80">
        <Search className="w-4 h-4 text-brand-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search products, funds, managers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs bg-brand-card-bg border border-brand-border rounded-lg focus:outline-none focus:border-brand-gold text-brand-text font-sans"
        />
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredProducts.map((p) => (
          <div key={p.id} className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm hover:border-brand-gold/60 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  p.category === 'Mutual Fund' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  p.category === 'Bond' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  p.category === 'Equity' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  p.category === 'PMS' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  p.category === 'Insurance' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {p.category}
                </span>

                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                  p.riskProfile === 'High' ? 'bg-red-50 text-red-700' :
                  p.riskProfile === 'Moderate' ? 'bg-amber-50 text-amber-700' :
                  'bg-emerald-50 text-emerald-700'
                }`}>
                  {p.riskProfile} Risk
                </span>
              </div>

              <h3 className="text-xs font-bold text-brand-text mt-3 min-h-[32px]">{p.name}</h3>
              {p.rating && (
                <span className="text-[10px] text-brand-gold font-bold bg-brand-gold/5 px-2 py-0.5 rounded-md mt-1 inline-block">
                  {p.rating}
                </span>
              )}

              <p className="text-[11px] text-brand-text-muted mt-3 leading-relaxed min-h-[60px]">{p.description}</p>

              <div className="w-full h-[1px] bg-brand-border/40 my-4"></div>

              <div className="grid grid-cols-2 gap-2 text-left">
                <div>
                  <span className="text-[9px] text-brand-text-muted uppercase tracking-wider font-semibold">Min Principal</span>
                  <p className="text-xs font-bold text-brand-text mt-0.5">{p.minInvestment}</p>
                </div>
                <div>
                  <span className="text-[9px] text-brand-text-muted uppercase tracking-wider font-semibold">Performance Metrics</span>
                  <p className="text-xs font-bold text-brand-success mt-0.5">{p.historicalYield}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-brand-border/40 flex items-center justify-between">
              {p.fundManager ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-brand-gold/15 text-brand-gold font-bold text-[9px] flex items-center justify-center">
                    {p.fundManager.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="text-[10px] text-brand-text font-medium">Mgr: {p.fundManager}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[10px] text-brand-text-muted">
                  <Info className="w-3.5 h-3.5 text-brand-gold/60" /> Approved Asset
                </div>
              )}

              {canBuy && (
                <button className="bg-brand-gold/10 text-brand-gold border border-brand-gold/20 font-bold px-3 py-1.5 rounded-lg text-[10px] hover:bg-brand-gold hover:text-white transition-all">
                  Staged Buy
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
