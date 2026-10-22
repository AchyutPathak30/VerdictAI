import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';

interface Notification {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: 'resolved' | 'update' | 'warning' | 'info';
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    icon: '✅',
    title: 'Dispute Auto-Resolved',
    body: 'Your dispute against Apple Store Online ($1,299.00) has been resolved in your favor. Full refund credited.',
    time: '2 mins ago',
    read: false,
    type: 'resolved',
  },
  {
    id: '2',
    icon: '✨',
    title: 'Gemini XAI Rationale Available',
    body: 'VerdictAI has evaluated your dispute claim for Uber Technologies ($42.20). Plain-language rationale published.',
    time: '1 hour ago',
    read: false,
    type: 'update',
  },
  {
    id: '3',
    icon: '⏱',
    title: 'SLA Warning — 15 Hours Left',
    body: 'Merchant response window is nearing deadline for your Starbucks Coffee dispute ($15.75).',
    time: '3 hours ago',
    read: true,
    type: 'warning',
  },
  {
    id: '4',
    icon: '📋',
    title: 'Dispute Sealed with Merkle Hash',
    body: 'Your dispute for Amazon.com ($124.50) has been cryptographically sealed and verified.',
    time: 'Yesterday',
    read: true,
    type: 'info',
  },
  {
    id: '5',
    icon: '📊',
    title: 'Case Under Analysis',
    body: 'Evidence ingestion completed. Fair-Weighing models are scoring transaction metadata.',
    time: '2 days ago',
    read: true,
    type: 'info',
  },
];

export default function NotificationsScreen() {
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  const renderItem = ({ item }: { item: Notification }) => (
    <View style={[styles.card, !item.read && styles.unreadCard]}>
      <View style={styles.cardLeft}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>{item.icon}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardTime}>{item.time}</Text>
        </View>
        <Text style={styles.cardBody}>{item.body}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgDeep} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alerts & Notifications</Text>
          <Text style={styles.subtitle}>Real-time dispute lifecycle events</Text>
        </View>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount} New</Text>
          </View>
        )}
      </View>

      <FlatList
        data={MOCK_NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 4,
  },
  badgeText: { fontSize: Typography.xs, color: '#fff', fontWeight: Typography.bold },
  list: { padding: Spacing.xl, gap: Spacing.md },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    alignItems: 'flex-start',
    ...Shadow.card,
  },
  unreadCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  cardLeft: { paddingTop: 2 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  cardRight: { flex: 1, gap: 4 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  cardTime: { fontSize: Typography.xs, color: Colors.textMuted },
  cardBody: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
