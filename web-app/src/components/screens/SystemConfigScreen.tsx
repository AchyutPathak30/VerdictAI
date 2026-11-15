import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Shield,
  Bell,
  Key,
  Users,
  Save,
  RefreshCw,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  UserPlus,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { fetchSystemConfig, updateSystemConfig, SystemConfigData } from '../../services/api';
import { ToastMessage } from '../common/Toast';

interface SystemConfigScreenProps {
  onAddToast?: (toast: Omit<ToastMessage, 'id'>) => void;
}

interface AdminTeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  clearance: string;
  status: 'ACTIVE' | 'PENDING';
}

export const SystemConfigScreen: React.FC<SystemConfigScreenProps> = ({ onAddToast }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SystemConfigData | null>(null);

  // Enterprise Admin Provisioning State (Restricted to Head Admin)
  const [adminTeam, setAdminTeam] = useState<AdminTeamMember[]>([
    {
      id: 'ADM-001',
      name: 'Priya Sharma',
      email: 'priya.sharma@verdictai-bank.com',
      role: 'Admin Lead (Head Admin)',
      department: 'Dispute Operations Core',
      clearance: 'Level 3 - Master Scopes (*)',
      status: 'ACTIVE'
    },
    {
      id: 'ADM-002',
      name: 'Rohan Mehta',
      email: 'rohan.mehta@verdictai-bank.com',
      role: 'Senior Administrator',
      department: 'Risk & Fraud Governance',
      clearance: 'Level 3 - Audit & Overrides',
      status: 'ACTIVE'
    },
    {
      id: 'ADM-003',
      name: 'Rajesh Verma',
      email: 'rajesh.verma@verdictai-bank.com',
      role: 'Senior Dispute Investigator',
      department: 'Chargeback Review Unit',
      clearance: 'Level 2 - Triage & NLP Verification',
      status: 'ACTIVE'
    }
  ]);

  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    name: '',
    email: '',
    role: 'Senior Administrator',
    department: 'Dispute Operations',
    clearance: 'Level 3 - Audit & Overrides'
  });

  const handleProvisionAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminForm.name.trim() || !newAdminForm.email.trim()) {
      onAddToast?.({
        type: 'error',
        title: 'Validation Failed',
        message: 'Name and official bank email address are mandatory.'
      });
      return;
    }

    const newMember: AdminTeamMember = {
      id: `ADM-00${adminTeam.length + 1}`,
      name: newAdminForm.name.trim(),
      email: newAdminForm.email.trim(),
      role: newAdminForm.role,
      department: newAdminForm.department,
      clearance: newAdminForm.clearance,
      status: 'ACTIVE'
    };

    setAdminTeam((prev) => [...prev, newMember]);
    setShowAddAdmin(false);
    setNewAdminForm({
      name: '',
      email: '',
      role: 'Senior Administrator',
      department: 'Dispute Operations',
      clearance: 'Level 3 - Audit & Overrides'
    });

    onAddToast?.({
      type: 'success',
      title: 'Admin Credentials Provisioned',
      message: `${newMember.name} provisioned as ${newMember.role}. Invitation sealed in Cryptographic Audit Ledger.`
    });
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const res = await fetchSystemConfig();
    if (res.data) setConfig(res.data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    const res = await updateSystemConfig(config);
    setSaving(false);
    if (res.data) {
      onAddToast?.({
        type: 'success',
        title: 'Settings Persisted',
        message: 'AI Model confidence thresholds & system rules updated successfully.'
      });
    }
  };

  if (loading || !config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading System Configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            WEB-11: SYSTEM CONFIGURATION
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            System Configuration & AI Model Calibration
          </h1>
          <p className="text-xs text-slate-500">Configure global operational thresholds, SLA windows, notification templates, and team RBAC</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Model Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Model Calibration Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">Fair-Weighing ML Model Thresholds</h2>
                <p className="text-xs text-slate-500">Calibrate minimum confidence required for straight-through automated dispute resolution</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-slate-700">Automated Resolution Confidence Threshold</label>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    {config.confidenceThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={config.confidenceThreshold}
                  onChange={(e) => setConfig({ ...config, confidenceThreshold: Number(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>50% (High Escalation)</span>
                  <span>75% (Balanced)</span>
                  <span>95% (Strict Auto-Resolve)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Experimental LLM Extraction (Beta)</p>
                    <p className="text-[11px] text-slate-500">Enable neural transformer parsing for handwritten receipts and PDFs</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.experimentalLlm}
                    onChange={(e) => setConfig({ ...config, experimentalLlm: e.target.checked })}
                    className="w-4 h-4 text-blue-600 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Operational Rules & SLA Settings */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">Global Evidence SLA & Compliance Rules</h2>
                <p className="text-xs text-slate-500">Manage timeframes for merchant counter-proof submissions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Merchant Evidence SLA Window (Hours)</label>
                <input
                  type="number"
                  value={config.slaHours}
                  onChange={(e) => setConfig({ ...config, slaHours: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Default Processing Region</label>
                <select
                  value={config.defaultRegion}
                  onChange={(e) => setConfig({ ...config, defaultRegion: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="North America (US-East)">North America (US-East)</option>
                  <option value="Europe (EU-Central)">Europe (EU-Central)</option>
                  <option value="Asia-Pacific (AP-South)">Asia-Pacific (AP-South)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: System Status & API Keys */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              System Operational Health
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-600 font-medium">Gateway Uptime:</span>
                <span className="font-bold text-emerald-600">{config.uptime}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-600 font-medium">NLP Latency:</span>
                <span className="font-bold text-slate-900">{config.latencyMs} ms</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-600 font-medium">Audit Trail Hash:</span>
                <span className="font-mono text-[10px] text-blue-600 font-bold">VERIFIED_100%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-600" />
              API Credentials & Webhooks
            </h3>
            <p className="text-xs text-slate-500">Manage production API secret keys for webhooks</p>

            <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] flex items-center justify-between">
              <span>vkey_live_9812479218...</span>
              <button
                onClick={() => onAddToast?.({ type: 'info', title: 'API Key Copied', message: 'API token saved to clipboard.' })}
                className="text-blue-400 hover:text-white font-sans text-xs font-semibold"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Admin Team Access & Head-Admin Provisioning Console */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-base">Administrative Team Governance & Access Provisioning</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  HEAD ADMIN RESTRICTED
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Direct public enrollment is strictly blocked. Only Head Admins (Priya Sharma) can provision new Admin and Dispute Investigator credentials.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddAdmin(!showAddAdmin)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-sm self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddAdmin ? 'Cancel Provisioning' : 'Provision New Admin'}</span>
          </button>
        </div>

        {/* Provision Form (Expandable) */}
        {showAddAdmin && (
          <form onSubmit={handleProvisionAdmin} className="p-5 rounded-2xl bg-slate-50 border border-blue-200 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Issue Internal Bank Admin / Investigator Credentials
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Singhal"
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Bank Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@verdictai-bank.com"
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Role Designation</label>
                <select
                  value={newAdminForm.role}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, role: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Senior Administrator">Senior Administrator</option>
                  <option value="Senior Dispute Investigator">Senior Dispute Investigator</option>
                  <option value="Compliance & Audit Officer">Compliance & Audit Officer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Security Clearance Level</label>
                <select
                  value={newAdminForm.clearance}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, clearance: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Level 3 - Audit & Overrides">Level 3 - Audit & Overrides</option>
                  <option value="Level 2 - Triage & NLP Verification">Level 2 - Triage & NLP Verification</option>
                  <option value="Level 1 - Read Only Auditor">Level 1 - Read Only Auditor</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddAdmin(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Confirm & Seal in Audit Ledger</span>
              </button>
            </div>
          </form>
        )}

        {/* Existing Team Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Admin ID & Name</th>
                <th className="py-3 px-4">Official Bank Email</th>
                <th className="py-3 px-4">Role Designation</th>
                <th className="py-3 px-4">Security Clearance</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {adminTeam.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{member.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{member.id} &bull; {member.department}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{member.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{member.clearance}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {member.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
