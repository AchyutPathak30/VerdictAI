import React, { useState, useEffect } from 'react';
import {
  Store,
  Mail,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Plus,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Settings,
  Zap
} from 'lucide-react';
import { fetchMerchantProfile, updateMerchantProfile, MerchantProfileData, GatewayIntegration } from '../../services/api';
import { ToastMessage } from '../common/Toast';
import { GatewayIntegrationModal } from '../common/GatewayIntegrationModal';

interface MerchantProfileScreenProps {
  onAddToast?: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const MerchantProfileScreen: React.FC<MerchantProfileScreenProps> = ({ onAddToast }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<MerchantProfileData | null>(null);
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<GatewayIntegration | null>(null);
  const [syncingGatewayName, setSyncingGatewayName] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const res = await fetchMerchantProfile();
    if (res.data) setProfile(res.data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const res = await updateMerchantProfile(profile);
    setSaving(false);
    if (res.data) {
      onAddToast?.({
        type: 'success',
        title: 'Merchant Profile Saved',
        message: 'Business entity details & notification preferences updated.'
      });
    }
  };

  const handleOpenAddGateway = () => {
    setSelectedGateway(null);
    setIsGatewayModalOpen(true);
  };

  const handleEditGateway = (gateway: GatewayIntegration) => {
    setSelectedGateway(gateway);
    setIsGatewayModalOpen(true);
  };

  const handleSaveGateway = async (gatewayData: GatewayIntegration) => {
    if (!profile) return;
    const existingIndex = profile.integrations.findIndex(
      (g) => g.name.toLowerCase() === gatewayData.name.toLowerCase()
    );

    let updatedIntegrations: GatewayIntegration[];
    if (existingIndex >= 0) {
      updatedIntegrations = [...profile.integrations];
      updatedIntegrations[existingIndex] = gatewayData;
    } else {
      updatedIntegrations = [...profile.integrations, gatewayData];
    }

    const updatedProfile = { ...profile, integrations: updatedIntegrations };
    setProfile(updatedProfile);
    await updateMerchantProfile(updatedProfile);
  };

  const handleDeleteGateway = async (gatewayName: string) => {
    if (!profile) return;
    const updatedIntegrations = profile.integrations.filter(
      (g) => g.name.toLowerCase() !== gatewayName.toLowerCase()
    );
    const updatedProfile = { ...profile, integrations: updatedIntegrations };
    setProfile(updatedProfile);
    await updateMerchantProfile(updatedProfile);
    onAddToast?.({
      type: 'info',
      title: 'Gateway Disconnected',
      message: `${gatewayName} has been unlinked from this merchant profile.`
    });
  };

  const handleSyncGateway = async (gatewayName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile) return;
    setSyncingGatewayName(gatewayName);
    await new Promise((r) => setTimeout(r, 700));
    setSyncingGatewayName(null);

    const updatedIntegrations = profile.integrations.map((g) => {
      if (g.name === gatewayName) {
        return { ...g, status: 'CONNECTED' as const, lastSync: 'Just now' };
      }
      return g;
    });

    const updatedProfile = { ...profile, integrations: updatedIntegrations };
    setProfile(updatedProfile);
    await updateMerchantProfile(updatedProfile);

    onAddToast?.({
      type: 'success',
      title: 'Dispute Sync Completed',
      message: `Refreshed telemetry for ${gatewayName}. 0 pending chargebacks, channel health 100%.`
    });
  };

  if (loading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading Merchant Entity Profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            WEB-12: MERCHANT PROFILE
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Merchant Profile & Integration Settings
          </h1>
          <p className="text-xs text-slate-500">Configure corporate information, notification preferences, and payment gateways</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Profile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Entity Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">Corporate Business Entity</h2>
                <p className="text-xs text-slate-500">Legal entity name and operational contact details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Legal Business Name</label>
                <input
                  type="text"
                  value={profile.entityName}
                  onChange={(e) => setProfile({ ...profile, entityName: e.target.value })}
                  className="mt-1 w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Merchant Account ID</label>
                <input
                  type="text"
                  value={profile.id}
                  disabled
                  className="mt-1 w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Dispute Operations Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="mt-1 w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Urgent SLA Phone Number</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="mt-1 w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Corporate Address</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="mt-1 w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Connected Payment Gateways */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Connected Payment Gateways</h2>
                  <p className="text-xs text-slate-500">Live data synchronization for chargeback ingestion</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenAddGateway}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Provider</span>
              </button>
            </div>

            <div className="space-y-3">
              {profile.integrations.map((gateway, idx) => {
                const isSyncing = syncingGatewayName === gateway.name;
                const isConnected = gateway.status === 'CONNECTED';
                const isActionRequired = gateway.status === 'ACTION REQUIRED';

                return (
                  <div
                    key={idx}
                    onClick={() => handleEditGateway(gateway)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-300 hover:shadow-xs transition cursor-pointer group gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full shrink-0 ${
                          isConnected
                            ? 'bg-emerald-500'
                            : isActionRequired
                            ? 'bg-amber-500 animate-pulse'
                            : 'bg-slate-400'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition">
                            {gateway.name}
                          </p>
                          {gateway.environment && (
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                              {gateway.environment.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Last Synced: <span className="font-medium text-slate-700">{gateway.lastSync}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                          isConnected
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : isActionRequired
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {gateway.status}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleSyncGateway(gateway.name, e)}
                        disabled={isSyncing}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition"
                        title="Sync Webhooks Now"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-purple-600' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditGateway(gateway);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-purple-50 text-slate-600 hover:text-purple-600 transition"
                        title="Configure Credentials"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Notification Alerts */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Dispute Notification Channels
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <div>
                  <p className="text-xs font-semibold text-slate-900">Email Notification Dossiers</p>
                  <p className="text-[10px] text-slate-500">Full evidence request summaries</p>
                </div>
                <input
                  type="checkbox"
                  checked={profile.emailAlerts}
                  onChange={(e) => setProfile({ ...profile, emailAlerts: e.target.checked })}
                  className="w-4 h-4 text-blue-600 accent-blue-600"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <div>
                  <p className="text-xs font-semibold text-slate-900">SMS Urgent Deadline Alerts</p>
                  <p className="text-[10px] text-slate-500">Instant pings for &lt; 24h SLA</p>
                </div>
                <input
                  type="checkbox"
                  checked={profile.smsAlerts}
                  onChange={(e) => setProfile({ ...profile, smsAlerts: e.target.checked })}
                  className="w-4 h-4 text-blue-600 accent-blue-600"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Integration Setup & Configuration Modal */}
      <GatewayIntegrationModal
        isOpen={isGatewayModalOpen}
        gateway={selectedGateway}
        onClose={() => {
          setIsGatewayModalOpen(false);
          setSelectedGateway(null);
        }}
        onSave={handleSaveGateway}
        onDelete={handleDeleteGateway}
        onAddToast={onAddToast}
      />
    </div>
  );
};
