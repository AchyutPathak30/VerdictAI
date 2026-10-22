import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList, UnifiedCaseFile, DisputeStatus, CaseReasoningResponse } from '../../types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { getDisputeById } from '../../services/disputesService';
import { getCaseReasoning } from '../../services/reasoningService';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'DisputeDetail'>;
  route: RouteProp<HomeStackParamList, 'DisputeDetail'>;
};

// Full lifecycle state machine order (mirrors backend state_machine.py)
const LIFECYCLE_STEPS: DisputeStatus[] = [
  'SUBMITTED',
  'EVIDENCE_INGESTED',
  'IN_ANALYSIS',
  'SCORING_EVALUATED',
  'AUTO_RESOLVED',
];

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Dispute Filed',
  EVIDENCE_PENDING: 'Evidence Pending',
  EVIDENCE_INGESTED: 'Evidence Analyzed',
  IN_ANALYSIS: 'AI Analysis',
  SCORING_EVALUATED: 'Score Generated',
  AUTO_RESOLVED: 'Auto Resolved',
  MANUAL_REVIEW_QUEUE: 'Manual Review',
  ADMIN_OVERRIDDEN: 'Admin Override',
  RESOLUTION_NOTIFIED: 'Notified',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
};

export default function DisputeDetailScreen({ navigation, route }: Props) {
  const { disputeId } = route.params;
  const [caseFile, setCaseFile] = useState<UnifiedCaseFile | null>(null);
  const [reasoning, setReasoning] = useState<CaseReasoningResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCase();
  }, [disputeId]);

  const fetchCase = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getDisputeById(disputeId);
      setCaseFile(data);

      try {
        const reasoningData = await getCaseReasoning(disputeId);
        setReasoning(reasoningData);
      } catch {
        setReasoning(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load case file.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading case file...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !caseFile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error ?? 'Case not found.'}</Text>
          <TouchableOpacity onPress={() => fetchCase()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = caseFile.header.current_status;
  const slaDate = new Date(caseFile.header.sla_deadline);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.floor((slaDate.getTime() - now.getTime()) / 3600000));
  const minsLeft = Math.max(0, Math.floor(((slaDate.getTime() - now.getTime()) % 3600000) / 60000));
  const isResolved = ['AUTO_RESOLVED', 'CLOSED', 'REJECTED'].includes(status);
  const currentStepIndex = LIFECYCLE_STEPS.indexOf(status as DisputeStatus);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgDeep} />

      {/* Nav Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Case Tracker</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchCase(true)}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Case Identity Card */}
        <View style={styles.identityCard}>
          <Text style={styles.merchantName}>{caseFile.transaction.merchant_name}</Text>
          <Text style={styles.caseRef}>{caseFile.header.case_reference_number}</Text>
          <Text style={styles.disputedAmount}>
            ₹{caseFile.header.disputed_amount.toLocaleString('en-IN')} {caseFile.header.currency}
          </Text>
          <Text style={styles.caseHash}>
            🔐 SHA-256: {caseFile.case_hash_sha256.slice(0, 24)}...
          </Text>
        </View>

        {/* SLA Countdown Card for Active Cases */}
        {!isResolved && (
          <View style={styles.slaCard}>
            <Text style={styles.slaTitle}>⏱ SLA Decision Window</Text>
            <Text style={styles.slaTime}>{hoursLeft}h {minsLeft}m remaining</Text>
            <Text style={styles.slaNote}>
              Merchant response deadline: {slaDate.toLocaleDateString()}
            </Text>
          </View>
        )}

        {/* Resolution Banner */}
        {isResolved && (
          <View style={styles.resolvedBanner}>
            <Text style={styles.resolvedTitle}>✅ Dispute Resolved</Text>
            {caseFile.resolution && (
              <Text style={styles.resolvedOutcome}>
                Outcome: {String(caseFile.resolution.outcome ?? 'Decision recorded')}
              </Text>
            )}
          </View>
        )}

        {/* AI Transparent Reasoning Card (SRS FR-19, FR-20, AC-10) */}
        {reasoning && (
          <View style={styles.reasoningCard}>
            <View style={styles.reasoningHeader}>
              <View style={styles.reasoningTitleRow}>
                <Text style={styles.geminiIcon}>✨</Text>
                <Text style={styles.reasoningTitle}>Resolution Rationale</Text>
              </View>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {reasoning.confidence_score_pct.toFixed(0)}% Confidence
                </Text>
              </View>
            </View>

            <Text style={styles.cardholderRationaleText}>
              {reasoning.cardholder_rationale}
            </Text>

            <View style={styles.reasoningDivider} />

            <Text style={styles.factorsHeading}>Contributing Evidence Factors (AC-10):</Text>
            {reasoning.contributing_factors.map((factor, idx) => (
              <View key={idx} style={styles.factorRow}>
                <Text style={styles.factorCheck}>✓</Text>
                <Text style={styles.factorText}>{factor}</Text>
              </View>
            ))}

            <View style={styles.guardrailFooter}>
              <View style={styles.guardrailPill}>
                <Text style={styles.guardrailText}>🛡️ Guardrails Verified</Text>
              </View>
              <Text style={styles.modelTag}>Gemini 2.0 Flash XAI</Text>
            </View>
          </View>
        )}

        {/* Lifecycle Progress Stepper */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifecycle Progress</Text>
          <View style={styles.stepper}>
            {LIFECYCLE_STEPS.map((step, index) => {
              const isPast = currentStepIndex > index;
              const isCurrent = currentStepIndex === index;
              return (
                <View key={step} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View style={[
                      styles.stepDot,
                      isPast && styles.stepDotDone,
                      isCurrent && styles.stepDotActive,
                    ]}>
                      <Text style={[styles.stepDotText, (isPast || isCurrent) && styles.stepDotTextWhite]}>
                        {isPast ? '✓' : isCurrent ? '●' : '○'}
                      </Text>
                    </View>
                    {index < LIFECYCLE_STEPS.length - 1 && (
                      <View style={[styles.stepLine, isPast && styles.stepLineDone]} />
                    )}
                  </View>
                  <Text style={[
                    styles.stepLabel,
                    isCurrent && styles.stepLabelActive,
                    isPast && styles.stepLabelDone,
                  ]}>
                    {STATUS_LABELS[step] ?? step}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Evidence Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Evidence Items ({caseFile.evidence_items.length})
          </Text>
          {caseFile.evidence_items.length === 0 ? (
            <Text style={styles.noEvidence}>No supporting evidence attached yet.</Text>
          ) : (
            caseFile.evidence_items.map((item, idx) => (
              <View key={idx} style={styles.evidenceItem}>
                <Text style={styles.evidenceType}>📄 {item.evidence_type}</Text>
                <Text style={styles.evidenceFile}>{item.file_name ?? 'Structured Payload'}</Text>
              </View>
            ))
          )}
        </View>

        {/* Cardholder Statement */}
        {caseFile.cardholder_statement ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Statement</Text>
            <View style={styles.statementBox}>
              <Text style={styles.statementText}>{caseFile.cardholder_statement}</Text>
            </View>
          </View>
        ) : null}

        {/* Cryptographic Audit Chain Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 Cryptographic Audit Chain</Text>
          <View style={styles.auditBox}>
            <Text style={styles.auditText}>
              Merkle Events Logged: {caseFile.audit_chain_length}
            </Text>
            <Text style={styles.auditText}>
              Tamper-Proof Seal: {caseFile.header.is_sealed ? '✅ Immutable' : '⏳ In-Progress'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  loadingText: { color: Colors.textSecondary, fontSize: Typography.sm },
  errorIcon: { fontSize: 40 },
  errorText: { color: Colors.error, textAlign: 'center', fontSize: Typography.base },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  retryText: { color: '#fff', fontWeight: Typography.bold },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.xs },
  backIcon: { fontSize: 24, color: Colors.textPrimary },
  navTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  scrollContent: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 60 },
  identityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
    ...Shadow.card,
  },
  merchantName: { fontSize: Typography.xl, fontWeight: Typography.extrabold, color: Colors.textPrimary },
  caseRef: { fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.bold },
  disputedAmount: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, marginTop: 4 },
  caseHash: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 4 },
  slaCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 4,
  },
  slaTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: '#D97706' },
  slaTime: { fontSize: Typography.xl, fontWeight: Typography.extrabold, color: '#92400E' },
  slaNote: { fontSize: Typography.xs, color: '#B45309' },
  resolvedBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 4,
  },
  resolvedTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: '#16A34A' },
  resolvedOutcome: { fontSize: Typography.sm, color: '#15803D', fontWeight: Typography.medium },
  reasoningCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: Spacing.sm,
    ...Shadow.card,
  },
  reasoningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reasoningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  geminiIcon: { fontSize: 18 },
  reasoningTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: '#1D4ED8',
  },
  confidenceBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 3,
  },
  confidenceText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: '#1D4ED8',
  },
  cardholderRationaleText: {
    fontSize: Typography.sm,
    color: '#1E293B',
    lineHeight: 22,
    marginTop: 2,
  },
  reasoningDivider: {
    height: 1,
    backgroundColor: '#DBEAFE',
    marginVertical: 4,
  },
  factorsHeading: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  factorCheck: {
    fontSize: Typography.sm,
    color: '#16A34A',
    fontWeight: Typography.bold,
  },
  factorText: {
    flex: 1,
    fontSize: Typography.xs,
    color: '#334155',
    lineHeight: 18,
    fontWeight: Typography.medium,
  },
  guardrailFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
  },
  guardrailPill: {
    backgroundColor: '#DBEAFE',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  guardrailText: {
    fontSize: 10,
    color: '#1D4ED8',
    fontWeight: Typography.bold,
  },
  modelTag: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: Typography.medium,
  },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary },
  stepper: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
    ...Shadow.card,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stepLeft: { alignItems: 'center', width: 28 },
  stepDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#CBD5E1',
  },
  stepDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepDotDone: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  stepDotText: { fontSize: 11, color: '#64748B', fontWeight: Typography.bold },
  stepDotTextWhite: { color: '#ffffff' },
  stepLine: { width: 2, height: 16, backgroundColor: '#E2E8F0', marginVertical: 2 },
  stepLineDone: { backgroundColor: '#16A34A' },
  stepLabel: { fontSize: Typography.sm, color: Colors.textMuted },
  stepLabelActive: { color: Colors.primary, fontWeight: Typography.bold },
  stepLabelDone: { color: Colors.textPrimary, fontWeight: Typography.medium },
  noEvidence: { fontSize: Typography.sm, color: Colors.textMuted, fontStyle: 'italic' },
  evidenceItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  evidenceType: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary },
  evidenceFile: { fontSize: Typography.xs, color: Colors.textSecondary },
  statementBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  statementText: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 22 },
  auditBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    ...Shadow.card,
  },
  auditText: { fontSize: Typography.xs, color: Colors.textSecondary },
});
