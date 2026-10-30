import React, { useEffect, useState } from 'react';
import { FileText, Search, Download, Filter, FileSpreadsheet, RefreshCw, AlertCircle } from 'lucide-react';
import { reportService, WealthReport } from '../../services/report.service';

export default function ReportsView() {
  const [reports, setReports] = useState<WealthReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<WealthReport[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [reports, activeCategory, search]);

  const fetchReports = async () => {
    setLoading(true);
    const data = await reportService.getReports();
    setReports(data);
    setLoading(false);
  };

  const applyFiltersAndSearch = () => {
    let result = [...reports];

    if (activeCategory !== 'All') {
      result = result.filter(r => r.category === activeCategory);
    }

    if (search.trim() !== '') {
      result = result.filter(r => 
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.type.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredReports(result);
  };

  const handleDownloadReport = (id: string, title: string) => {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId(null);
      setDownloadSuccessMessage(`Success: "${title}" has been downloaded to your system.`);
      setTimeout(() => setDownloadSuccessMessage(''), 4000);
    }, 1500);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title block */}
      <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-brand-text uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-gold" /> Statement & Audit Reports
        </h2>
        <p className="text-[10px] text-brand-text-muted mt-0.5">Generate, inspect, and export consolidated wealth portfolios, capital gains Excel files, and audit records.</p>
      </div>

      {downloadSuccessMessage && (
        <div className="p-3 bg-brand-success/15 text-brand-success border border-brand-success/20 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{downloadSuccessMessage}</span>
        </div>
      )}

      {/* Categories Tabs & Search */}
      <div className="bg-brand-card-bg border border-brand-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {(['All', 'Portfolio', 'Tax', 'Regulatory'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-brand-gold text-white shadow-sm font-bold'
                  : 'text-brand-text-muted hover:bg-brand-secondary-bg hover:text-brand-text'
              }`}
            >
              {cat === 'All' ? 'All Statements' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-brand-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search report titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 text-xs bg-brand-primary-bg border border-brand-border rounded-lg focus:outline-none focus:border-brand-gold text-brand-text font-sans"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-brand-card-bg border border-brand-border rounded-xl p-16 text-center shadow-sm">
          <RefreshCw className="w-6 h-6 text-brand-gold animate-spin mx-auto" />
          <p className="text-xs font-bold text-brand-text-muted mt-3">Compiling tax ledgers and portfolio matrices...</p>
        </div>
      ) : filteredReports.length > 0 ? (
        <div className="bg-brand-card-bg border border-brand-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border/60 bg-brand-primary-bg/30 text-[10px] uppercase text-brand-text-muted font-bold">
                  <th className="py-3 pl-4">Report Details</th>
                  <th className="py-3">Category</th>
                  <th className="py-3">Applicable Period</th>
                  <th className="py-3">Format & Size</th>
                  <th className="py-3 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/35 text-xs">
                {filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-brand-primary-bg/30 transition-colors">
                    <td className="py-4 pl-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          r.format === 'PDF' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {r.format === 'PDF' ? <FileText className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="font-bold text-brand-text">{r.title}</span>
                          <span className="text-[10px] text-brand-text-muted block mt-0.5">{r.type}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-semibold text-brand-text-muted">{r.category}</td>
                    <td className="py-4 font-medium text-brand-text">{r.period}</td>
                    <td className="py-4 font-mono text-[11px] text-brand-text-muted">
                      <span className="font-bold text-brand-text">{r.format}</span> ({r.size})
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <button
                        id={`btn-download-report-${r.id}`}
                        onClick={() => handleDownloadReport(r.id, r.title)}
                        disabled={downloadingId === r.id}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-gold hover:text-brand-gold-accent border border-brand-border hover:border-brand-gold/30 bg-brand-primary-bg/50 hover:bg-brand-gold/5 px-3 py-1.5 rounded-lg transition-all"
                      >
                        {downloadingId === r.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Exporting...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-brand-card-bg border border-brand-border rounded-xl p-16 text-center shadow-sm">
          <p className="text-xs font-bold text-brand-text-muted">No statements or sheets matched your filters.</p>
        </div>
      )}
    </div>
  );
}
