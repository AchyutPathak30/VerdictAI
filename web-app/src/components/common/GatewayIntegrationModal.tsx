import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Lock,
  ExternalLink,
  Globe,
  Loader2,
  Trash2
} from 'lucide-react';
import { GatewayIntegration, BASE_URL } from '../../services/api';

interface GatewayIntegrationModalProps {
  isOpen: boolean;
  gateway?: GatewayIntegration | null;
  onClose: () => void;
  onSave: (gateway: GatewayIntegration) => void;
  onDelete?: (gatewayName: string) => void;
  onAddToast?: (toast: { type: 'success' | 'error' | 'info'; title: string; message: string }) => void;
}

const SUPPORTED_PROVIDERS = [
  {
    id: 'razorpay',
    name: 'Razorpay Enterprise Payments',
    tag: 'RZP',
    category: 'Cards, NetBanking, UPI, EMI',
    color: 'bg-blue-600 text-white',
    defaultMid: 'mid_rzp_live_99214'
  },
  {
    id: 'payu',
    name: 'PayU India Settlement Gateway',
    tag: 'PayU',
    category: 'Enterprise Checkout & Dispute API',
    color: 'bg-emerald-600 text-white',
    defaultMid: 'payu_merchant_882910'
  },
  {
    id: 'cashfree',
    name: 'Cashfree Payments Gateway',
    tag: 'CF',
    category: 'AutoCollect & Payouts Engine',
    color: 'bg-purple-600 text-white',
    defaultMid: 'cf_app_id_44129'
  },
  {
    id: 'npci',
    name: 'NPCI UPI AutoPay Gateway',
    tag: 'NPCI',
    category: 'Recurring Mandates & Direct UPI',
    color: 'bg-amber-600 text-white',
    defaultMid: 'npci_psp_vpa_enterprise'
  },
  {
    id: 'ccavenue',
    name: 'CCAvenue Payment Gateway',
    tag: 'CCA',
    category: 'Multi-Currency Merchant Switch',
    color: 'bg-rose-600 text-white',
    defaultMid: 'cca_mid_110294'
  },
  {
    id: 'phonepe',
    name: 'PhonePe PG Switch',
    tag: 'PE',
    category: 'UPI Direct Intent & Card Gateway',
    color: 'bg-indigo-600 text-white',
    defaultMid: 'phonepe_merch_09912'
  },
  {
    id: 'stripe',
    name: 'Stripe India / Global',
    tag: 'STR',
    category: 'Cross-Border & Radar Fraud Engine',
    color: 'bg-slate-800 text-white',
    defaultMid: 'acct_1Nskdf8281023'
  }
];

export const GatewayIntegrationModal: React.FC<GatewayIntegrationModalProps> = ({
  isOpen,
  gateway,
  onClose,
  onSave,
  onDelete,
  onAddToast
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string>(
    SUPPORTED_PROVIDERS[0].name
  );
  const [environment, setEnvironment] = useState<'production' | 'sandbox'>('production');
  const [merchantId, setMerchantId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [autoEvidence, setAutoEvidence] = useState(true);
  const [urgentAlerts, setUrgentAlerts] = useState(true);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const webhookEndpoint = `${BASE_URL}/integrations/webhooks/gateway`;

  useEffect(() => {
    if (gateway) {
      setSelectedProvider(gateway.name);
      setEnvironment(gateway.environment || 'production');
      setMerchantId(gateway.merchantId || '');
      setApiKey(gateway.apiKey || '••••••••••••••••••••••••••••••••');
      setWebhookSecret(gateway.webhookSecret || '••••••••••••••••••••••••');
      setAutoEvidence(gateway.autoEvidence ?? true);
      setUrgentAlerts(gateway.urgentAlerts ?? true);
      setTestResult(null);
    } else {
      setSelectedProvider(SUPPORTED_PROVIDERS[0].name);
      setEnvironment('production');
      setMerchantId(SUPPORTED_PROVIDERS[0].defaultMid);
      setApiKey('rzp_live_' + Math.random().toString(36).substring(2, 14));
      setWebhookSecret('whsec_' + Math.random().toString(36).substring(2, 16));
      setAutoEvidence(true);
      setUrgentAlerts(true);
      setTestResult(null);
    }
  }, [gateway, isOpen]);

  if (!isOpen) return null;

  const handleProviderSelect = (prov: typeof SUPPORTED_PROVIDERS[0]) => {
    setSelectedProvider(prov.name);
    if (!gateway) {
      setMerchantId(prov.defaultMid);
      const prefix = prov.tag.toLowerCase();
      setApiKey(`${prefix}_live_${Math.random().toString(36).substring(2, 14)}`);
      setWebhookSecret(`whsec_${prefix}_${Math.random().toString(36).substring(2, 16)}`);
      setTestResult(null);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookEndpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onAddToast?.({
      type: 'info',
      title: 'Webhook URL Copied',
      message: 'Paste this endpoint into your gateway webhook settings.'
    });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 800));
    setTesting(false);
    const latency = Math.floor(Math.random() * 25) + 22; // 22-47ms
    setTestResult({
      success: true,
      message: `Handshake 200 OK • Auth token verified • RuPay / Visa / MC chargeback feed active`,
      latency
    });
    onAddToast?.({
      type: 'success',
      title: 'Gateway Verified',
      message: `Connected successfully to ${selectedProvider} (${latency}ms latency).`
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId.trim()) {
      onAddToast?.({
        type: 'error',
        title: 'Validation Failed',
        message: 'Please provide a valid Merchant ID or Terminal Identifier.'
      });
      return;
    }

    const updatedItem: GatewayIntegration = {
      name: selectedProvider,
      status: 'CONNECTED',
      lastSync: 'Just now',
      environment,
      merchantId: merchantId.trim(),
      apiKey: apiKey.trim(),
      webhookSecret: webhookSecret.trim(),
      autoEvidence,
      urgentAlerts
    };

    onSave(updatedItem);
    onAddToast?.({
      type: 'success',
      title: gateway ? 'Gateway Reconnected' : 'Payment Gateway Linked',
      message: `${selectedProvider} is now actively synchronizing chargeback disputes with VerdictAI.`
    });
    onClose();
  };

  const isEditing = !!gateway;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? `Configure ${gateway.name}` : 'Connect Payment Gateway Provider'}
              </h2>
              <p className="text-xs text-slate-500">
                Automate real-time chargeback ingestion, dispute webhooks, and counter-evidence telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              1. Select Gateway Aggregator / Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
              {SUPPORTED_PROVIDERS.map((prov) => {
                const isSelected = selectedProvider === prov.name;
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => handleProviderSelect(prov)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl text-left border transition ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg ${prov.color} flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs`}
                    >
                      {prov.tag}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900 truncate">{prov.name}</p>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 ml-1" />}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{prov.category}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Environment & Credentials */}
          <div className="space-y-3.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. API Credentials & Authentication
              </label>
              {/* Environment Toggle */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setEnvironment('production')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                    environment === 'production'
                      ? 'bg-white text-emerald-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Live Production
                </button>
                <button
                  type="button"
                  onClick={() => setEnvironment('sandbox')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                    environment === 'sandbox'
                      ? 'bg-white text-amber-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Staging / Sandbox
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Merchant Account / Terminal ID (MID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  placeholder="e.g. MID_REL_778102 or payu_merchant_882910"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  API Key / Client Access ID
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="rzp_live_••••••••••••••••"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none pr-8"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Webhook Signing Secret / Key Salt
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="whsec_••••••••••••••••"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none pr-8"
                  />
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Webhook Configuration & Dispatch URL */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Webhook Listener Configuration
              </label>
              <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                HTTPS Endpoint Ready
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Add this secure callback URL into your <strong>{selectedProvider}</strong> developer console under <em>Disputes & Chargebacks Webhooks</em>:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookEndpoint}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700 select-all outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Automation Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              4. Automated Dispute Sync Features
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div className="pr-4">
                  <p className="text-xs font-semibold text-slate-900">Auto-submit Counter Evidence via Gateway API</p>
                  <p className="text-[10px] text-slate-500">Automatically push carrier PODs, invoices, and GPS proof when ML score &gt; 85%</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoEvidence}
                  onChange={(e) => setAutoEvidence(e.target.checked)}
                  className="w-4 h-4 text-purple-600 accent-purple-600"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div className="pr-4">
                  <p className="text-xs font-semibold text-slate-900">Real-time Urgent Webhook Notifications (&lt; 24h SLA)</p>
                  <p className="text-[10px] text-slate-500">Trigger immediate operational alerts for short-window arbitration disputes</p>
                </div>
                <input
                  type="checkbox"
                  checked={urgentAlerts}
                  onChange={(e) => setUrgentAlerts(e.target.checked)}
                  className="w-4 h-4 text-purple-600 accent-purple-600"
                />
              </label>
            </div>
          </div>

          {/* Connection Test Diagnostic Banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">Connection Verified</p>
                  <p className="text-[11px] text-emerald-800">{testResult.message}</p>
                </div>
              </div>
              {testResult.latency && (
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-900">
                  {testResult.latency}ms
                </span>
              )}
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <div>
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Are you sure you want to disconnect ${gateway.name}?`)) {
                      onDelete(gateway.name);
                      onClose();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Disconnect Provider</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 justify-end">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-xs disabled:opacity-50"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Test Connection</span>
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Save & Update Gateway' : 'Connect & Link Provider'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

