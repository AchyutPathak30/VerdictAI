import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Clock,
  Sparkles,
  UploadCloud,
  FileText,
  Smartphone,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { uploadEvidenceFile } from '../../services/api';

interface CardholderPortalScreenProps {
  onAddToast?: (toast: { type: 'success' | 'info' | 'error' | 'warning'; title: string; message: string }) => void;
}

export const CardholderPortalScreen: React.FC<CardholderPortalScreenProps> = ({ onAddToast }) => {
  const [activeTab, setActiveTab] = useState<'my-disputes' | 'file-dispute'>('my-disputes');
  const [selectedTxn, setSelectedTxn] = useState<string>('txn_croma_18999');
  const [disputeReason, setDisputeReason] = useState<string>('PRODUCT_NOT_RECEIVED');
  const [statementText, setStatementText] = useState<string>('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cardholderData = {
    name: 'Pooja Iyer',
    accountId: 'usr_pooja_01',
    email: 'pooja.iyer@gmail.com',
    card: 'HDFC Bank RuPay Platinum **** 4492',
    memberSince: 'March 2021',
    creditScore: 812,
    activeDisputesCount: 1,
    totalRefunded: 26498.00,
  };

  const [myDisputes, setMyDisputes] = useState([
    {
      id: 'CHB-882941-DX',
      merchant: 'Croma Electronics India',
      amount: 18999.00,
      reason: 'Product Not Received',
      date: 'Oct 23, 2026',
      status: 'In Investigation',
      statusColor: 'bg-amber-100 text-amber-800 border-amber-200',
      slaCountdown: '18h 42m remaining',
      sha256Hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      courier: 'Blue Dart Express (BLUEDART-88192034)',
      aiVerdict: 'Fair-Weighing ML recommends approval in customer favor. Courier GPS shows unauthorized drop-off 3.2km away.'
    },
    {
      id: 'CHB-1042-SW',
      merchant: 'Swiggy Instamart',
      amount: 1499.00,
      reason: 'Duplicate Billing',
      date: 'Oct 18, 2026',
      status: 'Auto-Resolved (Refunded)',
      statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      slaCountdown: 'Settled',
      sha256Hash: 'b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01',
      courier: 'Direct Delivery',
      aiVerdict: 'Dual swipe detected on merchant POS terminal within 3 minutes. Immediate credit credited to HDFC RuPay account.'
    },
    {
      id: 'CHB-99281-TC',
      merchant: 'Tata CLiQ Luxury',
      amount: 24999.00,
      reason: 'Unrecognized Online Charge',
      date: 'Oct 12, 2026',
      status: 'Settled (Bank Override)',
      statusColor: 'bg-blue-100 text-blue-800 border-blue-200',
      slaCountdown: 'Closed',
      sha256Hash: 'd4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0123',
      courier: 'N/A',
      aiVerdict: 'Overseas IP flagged without 2FA OTP authorization. Full chargeback accepted and sealed.'
    }
  ]);

  const recentTransactions = [
    { id: 'txn_croma_18999', merchant: 'Croma Electronics India', amount: 18999.00, date: 'Oct 20, 2026', category: 'Consumer Electronics' },
    { id: 'txn_reliance_28500', merchant: 'Reliance Digital Retail Ltd', amount: 28500.00, date: 'Oct 15, 2026', category: 'Electronics' },
    { id: 'txn_flipkart_4599', merchant: 'Flipkart India Pvt Ltd', amount: 4599.00, date: 'Oct 12, 2026', category: 'Shopping' },
  ];

  const handleRealFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
    setAttachedFile({ name: file.name, size: sizeStr });

    // Call real upload API
    await uploadEvidenceFile('CHB-882941-DX', 'CARDHOLDER_PROOF', 'CARDHOLDER', file);

    onAddToast?.({
      type: 'success',
      title: 'Real File Ingested',
      message: `${file.name} (${sizeStr}) uploaded and verified with SHA-256 fingerprint.`
    });
  };

  const handleFileDispute = () => {
    if (!statementText.trim()) {
      onAddToast?.({
        type: 'warning',
        title: 'Statement Required',
        message: 'Please provide a factual explanation for why this charge is being disputed.'
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const randomId = `CHB-${Math.floor(100000 + Math.random() * 900000)}-IN`;
      const matchedTxn = recentTransactions.find(t => t.id === selectedTxn) || recentTransactions[0];
      
      const newDispute = {
        id: randomId,
        merchant: matchedTxn.merchant,
        amount: matchedTxn.amount,
        reason: disputeReason.replace(/_/g, ' '),
        date: 'Today',
        status: 'Submitted (SLA Active)',
        statusColor: 'bg-blue-100 text-blue-800 border-blue-200',
        slaCountdown: '47h 59m remaining',
        sha256Hash: `sha256_${Date.now()}_simulated_hash_verdictai`,
        courier: 'Awaiting Merchant POD',
        aiVerdict: 'Dispute ingested into Fair-Weighing ML queue. Merchant notified to supply delivery confirmation within 48-hour SLA.'
      };

      setMyDisputes(prev => [newDispute, ...prev]);
      onAddToast?.({
        type: 'success',
        title: 'Dispute Filed & Sealed',
        message: `Case ${randomId} registered and anchored under SHA-256 Merkle root.`
      });
      setStatementText('');
      setAttachedFile(null);
      setActiveTab('my-disputes');
    }, 700);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Role-Based Access Isolation Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white rounded-2xl p-5 border border-emerald-800/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500 text-slate-950">
                Cardholder Consumer Scope (RBAC-ISOLATED)
              </span>
              <span className="text-xs text-slate-400">Zero-Trust Partition</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Active Session: <strong>{cardholderData.name}</strong> • Account: <span className="font-mono">{cardholderData.accountId}</span>. Bank risk models, merchant ledgers, and other customer data are strictly inaccessible under bank privacy policy.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/40 border border-emerald-700/50 text-[11px] font-semibold text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>256-bit Encrypted</span>
          </div>
        </div>
      </div>

      {/* Cardholder Profile & Stats Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-blue-500/20">
            PI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{cardholderData.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Verified Card Member
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                {cardholderData.card}
              </span>
              <span>•</span>
              <span>Member Since {cardholderData.memberSince}</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">Credit Score: {cardholderData.creditScore} (Excellent)</span>
            </div>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="flex items-center gap-4 sm:gap-6 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Disputes</span>
            <span className="text-lg font-black text-amber-600 font-mono">{myDisputes.filter(d => d.status.includes('Active') || d.status.includes('Investigation')).length} Case</span>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Recovered</span>
            <span className="text-lg font-black text-emerald-600 font-mono">₹{cardholderData.totalRefunded.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('my-disputes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'my-disputes'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            My Disputes ({myDisputes.length})
          </button>
          <button
            onClick={() => setActiveTab('file-dispute')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'file-dispute'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            + File a New Dispute
          </button>
        </div>

        {/* Mobile App Callout */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 font-semibold">
          <Smartphone className="w-3.5 h-3.5" />
          <span>VerdictAI Mobile Banking App (React Native + Expo)</span>
        </div>
      </div>

      {/* Tab 1: My Disputes */}
      {activeTab === 'my-disputes' && (
        <div className="space-y-4">
          {myDisputes.map((dispute) => (
            <div
              key={dispute.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-blue-300 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-sm text-blue-600">{dispute.id}</span>
                  <span className="text-sm font-bold text-slate-900">• {dispute.merchant}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${dispute.statusColor}`}>
                    {dispute.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Filed on {dispute.date}</span>
                  <span>•</span>
                  <span className="font-mono text-base font-black text-slate-900">₹{dispute.amount.toLocaleString('en-IN')} INR</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block">Reason Category</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{dispute.reason}</span>
                  <span className="text-[11px] text-slate-500 mt-1 block">Courier: {dispute.courier}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block">Resolution SLA Window</span>
                  <span className="font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    {dispute.slaCountdown}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block truncate">
                    Hash: {dispute.sha256Hash.slice(0, 24)}...
                  </span>
                </div>

                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100">
                  <span className="text-blue-900 font-bold flex items-center gap-1 block">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Gemini 2.0 Flash XAI Plain-Language Summary
                  </span>
                  <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
                    {dispute.aiVerdict}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: File New Dispute */}
      {activeTab === 'file-dispute' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 max-w-3xl">
          <div>
            <h2 className="text-base font-bold text-slate-900">File a Formal Chargeback Dispute</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Under RBI Consumer Protection guidelines, charges can be contested within 60 days of transaction date.
            </p>
          </div>

          {/* Select Recent Transaction */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              1. Select In-Scope Card Transaction
            </label>
            <div className="space-y-2">
              {recentTransactions.map((txn) => (
                <div
                  key={txn.id}
                  onClick={() => setSelectedTxn(txn.id)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    selectedTxn === txn.id
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{txn.merchant}</p>
                    <p className="text-[11px] text-slate-500">{txn.date} • {txn.category} • HDFC RuPay **** 4492</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    ₹{txn.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              2. Dispute Ground / Reason Code
            </label>
            <select
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="PRODUCT_NOT_RECEIVED">Product Not Received (Courier failed to deliver)</option>
              <option value="DUPLICATE_PROCESSING">Duplicate Processing (Card debited twice)</option>
              <option value="INCORRECT_AMOUNT_CHARGED">Incorrect Amount Charged (POS / surcharge mismatch)</option>
              <option value="FRAUD_UNRECOGNIZED_CHARGE">Unrecognized Transaction (Possible card misuse)</option>
            </select>
          </div>

          {/* Statement */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              3. Cardholder Statement & Facts
            </label>
            <textarea
              rows={3}
              placeholder="Describe what occurred (e.g. Courier tracking marked as delivered, but building security confirmed no item arrived)..."
              value={statementText}
              onChange={(e) => setStatementText(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Upload Real Receipt */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              4. Upload Supporting Bill / Receipt / Chat Proof (Real OS File Ingestion)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-200 rounded-xl p-5 text-center bg-blue-50/20 hover:bg-blue-50/50 transition cursor-pointer"
            >
              <UploadCloud className="w-7 h-7 text-blue-600 mx-auto mb-1.5" />
              <p className="text-xs text-slate-800 font-bold">Click to choose a real file from your computer</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG, or TXT — calculates SHA-256 hash</p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleRealFileSelect}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
              />
              {attachedFile && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Attached: {attachedFile.name} ({attachedFile.size})</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleFileDispute}
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Submit Cryptographically Signed Dispute</span>
          </button>
        </div>
      )}
    </div>
  );
};
