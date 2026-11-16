import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';

export interface Notification {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: 'resolved' | 'update' | 'warning' | 'info';
  disputeId?: string;
  merchantName?: string;
  amount?: string;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    icon: '✅',
    title: 'Dispute Auto-Resolved',
    body: 'Your dispute against Tata CLiQ Luxury (₹24,999.00) has been resolved in your favor. Full refund credited.',
    time: '2 mins ago',
    read: false,
    type: 'resolved',
    disputeId: 'DSP-663914',
    merchantName: 'Tata CLiQ Luxury',
    amount: '₹24,999.00',
  },
  {
    id: '2',
    icon: '✨',
    title: 'Gemini XAI Rationale Available',
    body: 'VerdictAI has evaluated your dispute claim for Reliance Digital (₹28,500.00). Plain-language rationale published.',
    time: '1 hour ago',
    read: false,
    type: 'update',
    disputeId: 'DSP-554101',
    merchantName: 'Reliance Digital',
    amount: '₹28,500.00',
  },
  {
    id: '3',
    icon: '⏱',
    title: 'SLA Warning — 15 Hours Left',
    body: 'Merchant response window is nearing deadline for your Swiggy Instamart dispute (₹1,499.00).',
    time: '3 hours ago',
    read: true,
    type: 'warning',
    disputeId: 'DSP-771822',
    merchantName: 'Swiggy Instamart',
    amount: '₹1,499.00',
  },
  {
    id: '4',
    icon: '📋',
    title: 'Dispute Sealed with Merkle Hash',
    body: 'Your dispute for Croma Electronics (₹18,999.00) has been cryptographically sealed and verified.',
    time: 'Yesterday',
    read: true,
    type: 'info',
    disputeId: 'DSP-882941',
    merchantName: 'Croma Electronics',
    amount: '₹18,999.00',
  },
  {
    id: '5',
    icon: '📊',
    title: 'Case Under Analysis',
    body: 'Evidence ingestion completed. Fair-Weighing models are scoring transaction metadata.',
    time: '2 days ago',
    read: true,
    type: 'info',
    disputeId: 'DSP-882941',
  },
];

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [activeBanner, setActiveBanner] = useState<Notification | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationPress = (item: Notification) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );

    if (item.disputeId) {
      // Cross-tab navigation to Home tab -> DisputeDetail screen
      navigation.navigate('HomeTab', {
        screen: 'DisputeDetail',
        params: { disputeId: item.disputeId },
      });
    } else {
      Alert.alert(item.title, item.body);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSimulatePushAlert = () => {
    const simulationTemplates = [
      {
        icon: '🔔',
        title: 'Instant Resolution Alert',
        body: 'Dispute #DSP-771822 against Swiggy Instamart (₹1,499.00) has been AUTO_RESOLVED. Gemini 2.0 Flash verified duplicate charge anomaly.',
        type: 'resolved' as const,
        disputeId: 'DSP-771822',
        merchantName: 'Swiggy Instamart',
        amount: '₹1,499.00',
      },
      {
        icon: '🛡️',
        title: 'Evidence Highlight Verified',
        body: 'Blue Dart courier telemetry ingested for Croma Electronics (₹18,999.00). Geolocation misdelivery confirmed.',
        type: 'update' as const,
        disputeId: 'DSP-882941',
        merchantName: 'Croma Electronics',
        amount: '₹18,999.00',
      },
    ];

    const pick = simulationTemplates[Math.floor(Math.random() * simulationTemplates.length)];
    const newAlert: Notification = {
      id: `sim_${Date.now()}`,
      icon: pick.icon,
      title: pick.title,
      body: pick.body,
      time: 'Just now',
      read: false,
      type: pick.type,
      disputeId: pick.disputeId,
      merchantName: pick.merchantName,
      amount: pick.amount,
    };

    // Prepend to notifications list
    setNotifications((prev) => [newAlert, ...prev]);

    // Show simulation banner
    setActiveBanner(newAlert);

    // Also trigger native alert with direct action
    Alert.alert(
      `${pick.icon} Push Notification Simulation`,
      `${pick.title}\n\n${pick.body}`,
      [
        {
          text: 'View Case',
          style: 'default',
          onPress: () => {
            setActiveBanner(null);
            handleNotificationPress(newAlert);
          },
        },
        {
          text: 'Dismiss',
          style: 'cancel',
          onPress: () => setActiveBanner(null),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => handleNotificationPress(item)}
      style={[styles.card, !item.read && styles.unreadCard]}
    >
      <View style={styles.cardLeft}>
        <View
          style={[
            styles.iconCircle,
            item.type === 'resolved' && styles.iconCircleGreen,
            item.type === 'warning' && styles.iconCircleAmber,
            item.type === 'update' && styles.iconCircleBlue,
          ]}
        >
          <Text style={styles.icon}>{item.icon}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardTime}>{item.time}</Text>
        </View>
        <Text style={styles.cardBody}>{item.body}</Text>
        {item.disputeId && (
          <View style={styles.actionRow}>
            <Text style={styles.caseRefPill}>Case: {item.disputeId}</Text>
            <Text style={styles.tapToViewText}>Tap to inspect case ›</Text>
          </View>
        )}
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgDeep} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alerts & Notifications</Text>
          <Text style={styles.subtitle}>Real-time dispute lifecycle events (SRS FR-19)</Text>
        </View>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount} New</Text>
            </View>
          )}
        </View>
      </View>

      {/* Simulation & Controls Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.simulateBtn}
          onPress={handleSimulatePushAlert}
          activeOpacity={0.8}
        >
          <Text style={styles.simulateBtnText}>🔔 Simulate Push Alert</Text>
        </TouchableOpacity>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markReadBtn}
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
          >
            <Text style={styles.markReadBtnText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Active Push Banner Simulation */}
      {activeBanner && (
        <TouchableOpacity
          style={styles.bannerContainer}
          onPress={() => {
            setActiveBanner(null);
            handleNotificationPress(activeBanner);
          }}
          activeOpacity={0.9}
        >
          <View style={styles.bannerIconBox}>
            <Text style={styles.bannerIcon}>{activeBanner.icon}</Text>
          </View>
          <View style={styles.bannerTextBox}>
            <Text style={styles.bannerTitle}>{activeBanner.title}</Text>
            <Text style={styles.bannerBody} numberOfLines={2}>
              {activeBanner.body}
            </Text>
          </View>
          <Text style={styles.bannerAction}>View ›</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  simulateBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  simulateBtnText: {
    fontSize: Typography.xs,
    color: Colors.primary,
    fontWeight: Typography.bold,
  },
  markReadBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  markReadBtnText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    ...Shadow.card,
  },
  bannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIcon: { fontSize: 18 },
  bannerTextBox: { flex: 1 },
  bannerTitle: { fontSize: Typography.xs, fontWeight: Typography.bold, color: '#FFFFFF' },
  bannerBody: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  bannerAction: { fontSize: Typography.xs, fontWeight: Typography.bold, color: '#60A5FA' },
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
    position: 'relative',
    ...Shadow.card,
  },
  unreadCard: {
    backgroundColor: '#F0F7FF',
    borderColor: '#BFDBFE',
  },
  cardLeft: { paddingTop: 2 },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleGreen: { backgroundColor: '#DCFCE7' },
  iconCircleAmber: { backgroundColor: '#FEF3C7' },
  iconCircleBlue: { backgroundColor: '#DBEAFE' },
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  caseRefPill: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.primary,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  tapToViewText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    position: 'absolute',
    top: Spacing.base,
    right: Spacing.base,
  },
});
