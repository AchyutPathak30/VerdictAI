import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

const DEMO_USER = {
  name: 'Alice Smith',
  cardholderID: 'usr_alice_01',
  email: 'alice.smith@example.com',
  card: '•••• •••• •••• 8841',
  cardType: 'Visa Credit',
  memberSince: 'August 2026',
};

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgDeep} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile & Settings</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>AS</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{DEMO_USER.name}</Text>
            <Text style={styles.userEmail}>{DEMO_USER.email}</Text>
            <View style={styles.idBadge}>
              <Text style={styles.idText}>ID: {DEMO_USER.cardholderID}</Text>
            </View>
          </View>
        </View>

        {/* Linked Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>PRIMARY PAYMENT METHOD</Text>
          <View style={styles.cardRow}>
            <View style={styles.cardChip}>
              <Text style={styles.cardType}>💳 {DEMO_USER.cardType}</Text>
              <Text style={styles.cardNumber}>{DEMO_USER.card}</Text>
            </View>
          </View>
          <Text style={styles.cardMeta}>Protected by VerdictAI Fraud Monitoring</Text>
        </View>

        {/* Account Settings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>PREFERENCES & SECURITY</Text>
          <ActionItem label="Biometric Sign-In" value="Enabled (Touch ID)" icon="👆" />
          <ActionItem label="Push Notifications" value="Active (Instant)" icon="🔔" />
          <ActionItem label="Dispute Policy Guide" value="SRS FR-01 - FR-20" icon="📖" />
          <ActionItem label="Cryptographic Verification" value="SHA-256 / Merkle" icon="🔐" />
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionFooter}>
          VerdictAI Mobile v1.0.0 · IT644 SOA Project
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionItem({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.actionRow}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <View style={styles.actionTextCol}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionValue}>{value}</Text>
      </View>
      <Text style={styles.arrowIcon}>›</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scrollContent: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 60 },
  header: {
    paddingVertical: Spacing.sm,
  },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.textPrimary },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadow.card,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: Typography.xl, fontWeight: Typography.extrabold, color: '#1D4ED8' },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  userEmail: { fontSize: Typography.xs, color: Colors.textSecondary },
  idBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  idText: { fontSize: 10, color: Colors.textSecondary, fontWeight: Typography.semibold },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadow.card,
  },
  sectionHeader: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  cardRow: {
    backgroundColor: '#0F172A',
    borderRadius: Radius.md,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  cardChip: { gap: 4 },
  cardType: { fontSize: Typography.xs, color: '#94A3B8', fontWeight: Typography.semibold },
  cardNumber: { fontSize: Typography.base, color: '#FFFFFF', fontWeight: Typography.bold, letterSpacing: 1.5 },
  cardMeta: { fontSize: Typography.xs, color: Colors.textSecondary, fontStyle: 'italic' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: Spacing.sm,
  },
  actionIcon: { fontSize: 20 },
  actionTextCol: { flex: 1, gap: 2 },
  actionLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  actionValue: { fontSize: Typography.xs, color: Colors.textSecondary },
  arrowIcon: { fontSize: 20, color: Colors.textMuted },
  signOutBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    ...Shadow.card,
  },
  signOutText: { fontSize: Typography.md, fontWeight: Typography.bold, color: '#DC2626' },
  versionFooter: {
    textAlign: 'center',
    fontSize: Typography.xs,
    color: Colors.textMuted,
    paddingTop: Spacing.sm,
  },
});
