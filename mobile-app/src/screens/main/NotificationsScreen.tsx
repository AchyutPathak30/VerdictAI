import React, { useState } from 'react';
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
    body: 'Your dispute against Tata CLiQ Luxury (₹24,999.00) has been resolved in your favor. Full refund credited.',
    time: '2 mins ago',
    read: false,
    type: 'resolved',
  },
  {
    id: '2',
    icon: '✨',
    title: 'Gemini XAI Rationale Available',
    body: 'VerdictAI has evaluated your dispute claim for Reliance Digital (₹2,850.00). Plain-language rationale published.',
    time: '1 hour ago',
    read: false,
    type: 'update',
  },
  {
    id: '3',
    icon: '⏱',
    title: 'SLA Warning — 15 Hours Left',
    body: 'Merchant response window is nearing deadline for your Swiggy Instamart dispute (₹1,499.00).',
    time: '3 hours ago',
    read: true,
    type: 'warning',
  },
  {
    id: '4',
    icon: '📋',
    title: 'Dispute Sealed with Merkle Hash',
    body: 'Your dispute for Croma Electronics (₹18,999.00) has been cryptographically sealed and verified.',
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
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.unreadCard]}
      onPress={() => handleToggleRead(item.id)}
      activeOpacity={0.8}
    >
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
    </TouchableOpacity>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.actionPill}>
              <Text style={styles.actionPillText}>Read All ({unreadCount})</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleClearAll} style={styles.actionPill}>
              <Text style={styles.actionPillText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
            <Text style={{ fontSize: 36 }}>📭</Text>
            <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textSecondary }}>
              No active alerts
            </Text>
            <Text style={{ fontSize: Typography.xs, color: Colors.textMuted }}>
              You are completely up-to-date with your dispute cases.
            </Text>
          </View>
        }
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
  actionPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 5,
  },
  actionPillText: { fontSize: Typography.xs, color: '#1E40AF', fontWeight: Typography.bold },
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
