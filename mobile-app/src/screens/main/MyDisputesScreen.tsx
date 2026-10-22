import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList, UnifiedCaseFile, DisputeStatus } from '../../types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { getDisputes } from '../../services/disputesService';
import { getBackendReachable } from '../../services/apiClient';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'MyDisputes'>;
};

// Hardcoded demo cardholder ID matching backend seed data
const DEMO_CARDHOLDER_ID = 'usr_alice_01';

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  SUBMITTED: { label: 'Submitted', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  EVIDENCE_PENDING: { label: 'Evidence Pending', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  EVIDENCE_INGESTED: { label: 'Analyzing', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  IN_ANALYSIS: { label: 'In Analysis', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  SCORING_EVALUATED: { label: 'Scored', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  AUTO_RESOLVED: { label: 'Resolved ✓', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  CLOSED: { label: 'Closed', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  MANUAL_REVIEW_QUEUE: { label: 'Under Review', color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
  ADMIN_OVERRIDDEN: { label: 'Overridden', color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' },
  RESOLUTION_NOTIFIED: { label: 'Notified', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  REJECTED: { label: 'Rejected', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

export default function MyDisputesScreen({ navigation }: Props) {
  const [disputes, setDisputes] = useState<UnifiedCaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'resolved'>('all');
  const [isLiveApi, setIsLiveApi] = useState(false);

  const fetchDisputes = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await getDisputes(DEMO_CARDHOLDER_ID);
      setDisputes(response.items);
      setIsLiveApi(getBackendReachable());
    } catch {
      setIsLiveApi(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDisputes();
    }, [])
  );

  const activeDisputes = disputes.filter(
    (d) => !['AUTO_RESOLVED', 'CLOSED', 'REJECTED'].includes(d.header.current_status)
  );
  const resolvedDisputes = disputes.filter(
    (d) => ['AUTO_RESOLVED', 'CLOSED', 'REJECTED'].includes(d.header.current_status)
  );

  const displayedDisputes =
    activeTab === 'all'
      ? disputes
      : activeTab === 'active'
      ? activeDisputes
      : resolvedDisputes;

  const renderDisputeCard = ({ item }: { item: UnifiedCaseFile }) => {
    const status = item.header.current_status as DisputeStatus;
    const statusConf = STATUS_CONFIG[status] ?? {
      label: status,
      color: Colors.textSecondary,
      bg: '#F8FAFC',
      border: '#E2E8F0',
    };
    const slaDate = new Date(item.header.sla_deadline);
    const now = new Date();
    const hoursLeft = Math.max(0, Math.floor((slaDate.getTime() - now.getTime()) / 3600000));
    const isResolved = ['AUTO_RESOLVED', 'CLOSED', 'REJECTED'].includes(status);
    const dateFormatted = new Date(
      item.transaction.transaction_timestamp || item.header.created_at
    ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DisputeDetail', { disputeId: item.header.dispute_id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: Spacing.sm }}>
            <Text style={styles.merchantName}>{item.transaction.merchant_name}</Text>
            <Text style={styles.txnDate}>{dateFormatted}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConf.bg, borderColor: statusConf.border }]}>
            <Text style={[styles.statusText, { color: statusConf.color }]}>
              {statusConf.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardBody}>
          <View>
            <Text style={styles.amountLabel}>AMOUNT</Text>
            <Text style={styles.amount}>
              ₹{item.header.disputed_amount.toLocaleString('en-IN')}
            </Text>
          </View>
          <View>
            <Text style={styles.caseIdLabel}>CASE ID</Text>
            <Text style={styles.caseId}>{item.header.case_reference_number}</Text>
          </View>
        </View>

        {item.cardholder_statement ? (
          <Text style={styles.statementSnippet} numberOfLines={1}>
            💬 {item.cardholder_statement}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          {!isResolved ? (
            <Text style={styles.slaText}>⏱ {hoursLeft}h response window</Text>
          ) : (
            <Text style={styles.resolvedOutcomeText}>
              {item.resolution?.outcome ? `✓ ${String(item.resolution.outcome)}` : '✓ Closed & Verified'}
            </Text>
          )}
          <Text style={styles.viewLink}>View Details →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgDeep} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>My Disputes</Text>
          <Text style={styles.subGreeting}>Card Member Dispute Resolution</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.connectionBadge, isLiveApi ? styles.badgeLive : styles.badgeOffline]}>
            <View style={[styles.connectionDot, isLiveApi ? styles.dotLive : styles.dotOffline]} />
            <Text style={[styles.connectionText, isLiveApi ? styles.textLive : styles.textOffline]}>
              {isLiveApi ? 'Live API' : 'Demo Mode'}
            </Text>
          </View>
        </View>
      </View>

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <SummaryCard label="Total Claims" value={disputes.length} color={Colors.primary} />
        <SummaryCard label="Active In-Flight" value={activeDisputes.length} color={Colors.statusSubmitted} />
        <SummaryCard label="Resolved" value={resolvedDisputes.length} color={Colors.statusResolved} />
      </View>

      {/* 3-Way Tab Selector (Visily Pill Switch) */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All ({disputes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active ({activeDisputes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'resolved' && styles.tabActive]}
          onPress={() => setActiveTab('resolved')}
        >
          <Text style={[styles.tabText, activeTab === 'resolved' && styles.tabTextActive]}>
            Resolved ({resolvedDisputes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main List / Loader / Empty */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading dispute records...</Text>
        </View>
      ) : displayedDisputes.length === 0 ? (
        <EmptyState
          tab={activeTab}
          onFileDispute={() => (navigation as any).navigate('FileDisputeTab')}
        />
      ) : (
        <FlatList
          data={displayedDisputes}
          keyExtractor={(item) => item.header.dispute_id}
          renderItem={renderDisputeCard}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchDisputes(true)}
              tintColor={Colors.primary}
            />
          }
        />
      )}

      {/* Floating Action Button for Fast Filing */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => (navigation as any).navigate('FileDisputeTab')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.summaryCard, { borderTopColor: color }]}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ tab, onFileDispute }: { tab: string; onFileDispute: () => void }) {
  return (
    <View style={styles.center}>
      <View style={styles.emptyIconCircle}>
        <Text style={styles.emptyIcon}>{tab === 'active' ? '⚖️' : '📭'}</Text>
      </View>
      <Text style={styles.emptyTitle}>
        {tab === 'active'
          ? 'No Active Disputes'
          : tab === 'resolved'
          ? 'No Resolved Disputes'
          : 'No Disputes Filed Yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {tab === 'active'
          ? 'All your dispute claims have been resolved or closed. File a new claim whenever needed.'
          : 'Contested charges will appear here once submitted and verified by VerdictAI.'}
      </Text>
      <TouchableOpacity style={styles.fileDisputeCta} onPress={onFileDispute} activeOpacity={0.85}>
        <Text style={styles.fileDisputeCtaText}>File a New Dispute +</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: { color: Colors.textSecondary, fontSize: Typography.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
  },
  subGreeting: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 6,
  },
  badgeLive: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  badgeOffline: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
  connectionDot: { width: 7, height: 7, borderRadius: 4 },
  dotLive: { backgroundColor: '#10B981' },
  dotOffline: { backgroundColor: '#94A3B8' },
  connectionText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  textLive: { color: '#065F46' },
  textOffline: { color: '#475569' },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    ...Shadow.card,
  },
  summaryValue: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
    fontWeight: Typography.medium,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    ...Shadow.card,
  },
  tabText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: Typography.bold,
  },
  list: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 90,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  merchantName: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  txnDate: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: Typography.bold,
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: 1,
  },
  caseIdLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: Typography.bold,
    textAlign: 'right',
    letterSpacing: 0.5,
  },
  caseId: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.primary,
    marginTop: 1,
    textAlign: 'right',
  },
  statementSnippet: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  slaText: {
    fontSize: Typography.xs,
    color: '#D97706',
    fontWeight: Typography.medium,
  },
  resolvedOutcomeText: {
    fontSize: Typography.xs,
    color: '#16A34A',
    fontWeight: Typography.medium,
  },
  viewLink: {
    fontSize: Typography.xs,
    color: Colors.primary,
    fontWeight: Typography.bold,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  emptySubtext: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  fileDisputeCta: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    ...Shadow.card,
  },
  fileDisputeCtaText: {
    color: '#ffffff',
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 30,
    color: '#ffffff',
    fontWeight: '300',
    lineHeight: 34,
  },
});
