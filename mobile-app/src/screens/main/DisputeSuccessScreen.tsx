import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { FileDisputeStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<FileDisputeStackParamList, 'DisputeSuccess'>;
  route: RouteProp<FileDisputeStackParamList, 'DisputeSuccess'>;
};

export default function DisputeSuccessScreen({ navigation, route }: Props) {
  const { caseId, referenceNumber } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgDeep} />

      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconRing}>
          <Text style={styles.icon}>✅</Text>
        </View>

        <Text style={styles.title}>Dispute Filed!</Text>
        <Text style={styles.subtitle}>
          Your dispute has been submitted and a cryptographically sealed case file has been created.
        </Text>

        {/* Case Info */}
        <View style={styles.caseCard}>
          <View style={styles.caseRow}>
            <Text style={styles.caseLabel}>Case ID</Text>
            <Text style={styles.caseValue}>{caseId.slice(0, 12).toUpperCase()}...</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.caseRow}>
            <Text style={styles.caseLabel}>Reference</Text>
            <Text style={[styles.caseValue, { color: Colors.primary }]}>{referenceNumber}</Text>
          </View>
        </View>

        {/* What Happens Next */}
        <View style={styles.nextStepsCard}>
          <Text style={styles.nextTitle}>What happens next?</Text>
          <Step n="1" text="Merchant has 48 hours to respond with evidence" />
          <Step n="2" text="VerdictAI AI engine analyzes all evidence" />
          <Step n="3" text="Fair-Weighing Model calculates confidence score" />
          <Step n="4" text="You'll receive push notification with decision" />
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            (navigation as any).navigate('HomeTab', {
              screen: 'DisputeDetail',
              params: { disputeId: caseId },
            });
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Track Case Status →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => {
            (navigation as any).navigate('HomeTab', {
              screen: 'MyDisputes',
            });
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryBtnText}>Return to Disputes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepNum}>{n}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  iconRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  icon: { fontSize: 44 },
  title: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  caseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    gap: Spacing.md,
    ...Shadow.card,
  },
  caseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  caseLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  caseValue: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border },
  nextStepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    gap: Spacing.md,
    ...Shadow.card,
  },
  nextTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { fontSize: Typography.xs, fontWeight: Typography.bold, color: '#fff' },
  stepText: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    width: '100%',
    alignItems: 'center',
    ...Shadow.card,
  },
  primaryBtnText: { fontSize: Typography.md, fontWeight: Typography.bold, color: '#fff' },
  secondaryBtn: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: Typography.semibold },
});
