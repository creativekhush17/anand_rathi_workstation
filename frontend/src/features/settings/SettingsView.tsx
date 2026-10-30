import React from 'react';
import { Settings, User, Landmark, Shield, Award, RefreshCw } from 'lucide-react';

interface SettingsViewProps {
  employeeName: string;
  onChangeEmployeeName: (name: string) => void;
  branch: string;
  onChangeBranch: (branch: string) => void;
}

export default function SettingsView({ employeeName, onChangeEmployeeName, branch, onChangeBranch }: SettingsViewProps) {
  return (
    <div className="space-y-6 text-left">
      {/* Title Header */}
      <div className="bg-brand-card-bg border border-brand-border rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-brand-text uppercase tracking-wider flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-gold" /> Employee Profile & Parameters
        </h2>
        <p className="text-[10px] text-brand-text-muted mt-0.5">Configure workstation properties, active regional branches, and review advisory credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card (2/3 cols) */}
        <div className="lg:col-span-2 bg-brand-card-bg border border-brand-border rounded-xl p-6 shadow-sm space-y-6">
          <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider flex items-center gap-1.5 border-b border-brand-border pb-3.5">
            <User className="w-4 h-4 text-brand-gold" /> Advisor Identification
          </h3>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="text-[10px] text-brand-text-muted uppercase font-bold">Registered Employee Name</label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => onChangeEmployeeName(e.target.value)}
                className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2.5 mt-1 focus:outline-none focus:border-brand-gold font-sans font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] text-brand-text-muted uppercase font-bold">Active Wealth Branch Hub</label>
              <select
                value={branch}
                onChange={(e) => onChangeBranch(e.target.value)}
                className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2.5 mt-1 focus:outline-none focus:border-brand-gold font-bold"
              >
                <option value="Jodhpur Hub">Jodhpur Hub</option>
                <option value="Mumbai (HQ)">Mumbai Corporate (HQ)</option>
                <option value="New Delhi Hub">New Delhi Hub</option>
                <option value="Bengaluru Hub">Bengaluru Tech Hub</option>
                <option value="Chennai Office">Chennai Coastal Office</option>
                <option value="Pune Office">Pune Core Office</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-brand-text-muted uppercase font-bold">Internal Workstation Identifier</label>
              <input
                type="text"
                disabled
                value="AR-RM-8041-A"
                className="w-full text-xs bg-brand-secondary-bg border border-brand-border rounded-lg px-3 py-2.5 mt-1 text-brand-text-muted focus:outline-none font-mono"
              />
              <p className="text-[9px] text-brand-text-muted mt-1 leading-normal">
                Sourced from human resources directory. To alter, submit an internal IT ticket.
              </p>
            </div>
          </div>
        </div>

        {/* Credentials & Compliance Panel (1/3 cols) */}
        <div className="bg-brand-card-bg border border-brand-border rounded-xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider flex items-center gap-1.5 border-b border-brand-border pb-3.5">
              <Shield className="w-4 h-4 text-brand-gold" /> System Permissions
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3 items-start text-xs text-left">
                <div className="p-1.5 bg-brand-gold/10 text-brand-gold rounded-lg mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-brand-text">SEBI Registered RIA License</h4>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">Credential valid through Dec 2028. Authorized for fee-based advisory logs.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start text-xs text-left">
                <div className="p-1.5 bg-brand-gold/10 text-brand-gold rounded-lg mt-0.5">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-brand-text">PML-A Compliance Clear</h4>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">Annual AML/CFT refresher completed on 15 Feb 2026.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-primary-bg rounded-xl p-4 border border-brand-border text-left">
            <span className="text-[9px] text-brand-text-muted uppercase font-bold flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5 text-brand-gold" /> System Integrity
            </span>
            <p className="text-[10px] text-brand-text mt-1">
              Workstation compiled successfully. Client files securely cached offline under local storage parameters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
