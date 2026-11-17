import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

export interface PaymentCard {
  id: string;
  bankName: string;
  cardholderName: string;
  cardType: string;
  cardNumber: string; // e.g. '•••• •••• •••• 4492'
  rawLast4: string;
  expiry: string; // '08/29'
  network: 'RuPay' | 'Visa' | 'Mastercard' | 'Amex';
  isPrimary: boolean;
  bgColor: string;
}

const DEFAULT_CARDS: PaymentCard[] = [
  {
    id: 'card_hdfc_4492',
    bankName: 'HDFC Bank',
    cardholderName: 'Pooja Iyer',
    cardType: 'HDFC RuPay Platinum',
    cardNumber: '•••• •••• •••• 4492',
    rawLast4: '4492',
    expiry: '08/29',
    network: 'RuPay',
    isPrimary: true,
    bgColor: '#0F172A',
  },
  {
    id: 'card_icici_8102',
    bankName: 'ICICI Bank',
    cardholderName: 'Pooja Iyer',
    cardType: 'ICICI Coral Visa',
    cardNumber: '•••• •••• •••• 8102',
    rawLast4: '8102',
    expiry: '11/28',
    network: 'Visa',
    isPrimary: false,
    bgColor: '#1E3A8A',
  },
];

const DEMO_USER = {
  name: 'Pooja Iyer',
  cardholderID: 'usr_pooja_01',
  email: 'pooja.iyer@gmail.com',
  creditScore: '812 (Excellent)',
  memberSince: 'March 2021',
};

const STORAGE_CARDS_KEY = 'verdictai_mobile_payment_cards_v1';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Cards State
  const [cards, setCards] = useState<PaymentCard[]>(DEFAULT_CARDS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Card Modal State
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [newCardholder, setNewCardholder] = useState('Pooja Iyer');
  const [newBank, setNewBank] = useState('State Bank of India');
  const [newNetwork, setNewNetwork] = useState<'RuPay' | 'Visa' | 'Mastercard' | 'Amex'>('Visa');
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [newCvv, setNewCvv] = useState('');
  const [newSetPrimary, setNewSetPrimary] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Preferences & Security States
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Preference Modals
  const [isBiometricsModalOpen, setIsBiometricsModalOpen] = useState(false);
  const [bioTestState, setBioTestState] = useState<'idle' | 'testing' | 'success'>('idle');

  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [notifDisputeUpdate, setNotifDisputeUpdate] = useState(true);
  const [notifEvidenceIngest, setNotifEvidenceIngest] = useState(true);
  const [notifSlaExpiry, setNotifSlaExpiry] = useState(true);
  const [notifRefundCredit, setNotifRefundCredit] = useState(true);

  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isCryptoModalOpen, setIsCryptoModalOpen] = useState(false);
  const [cryptoCheckState, setCryptoCheckState] = useState<'idle' | 'running' | 'verified'>('idle');
  const [cryptoStep, setCryptoStep] = useState(0);

  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  // Load persisted cards from localStorage on web
  useEffect(() => {
    const win = typeof globalThis !== 'undefined' ? (globalThis as any) : null;
    if (win && win.localStorage) {
      try {
        const stored = win.localStorage.getItem(STORAGE_CARDS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCards(parsed);
          }
        }
      } catch {
        // ignore storage parse error
      }
    }
  }, []);

  const saveCards = (updated: PaymentCard[]) => {
    setCards(updated);
    const win = typeof globalThis !== 'undefined' ? (globalThis as any) : null;
    if (win && win.localStorage) {
      try {
        win.localStorage.setItem(STORAGE_CARDS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSetPrimary = (cardId: string) => {
    const updated = cards.map((c) => ({
      ...c,
      isPrimary: c.id === cardId,
    }));
    saveCards(updated);
    const target = updated.find((c) => c.id === cardId);
    showToast(`Primary card set to ${target?.cardType || 'Selected Card'}`);
  };

  const handleDeleteCard = (cardId: string) => {
    const target = cards.find((c) => c.id === cardId);
    if (target?.isPrimary) {
      showToast('Cannot delete primary card. Please set another card as primary first.');
      return;
    }
    const updated = cards.filter((c) => c.id !== cardId);
    saveCards(updated);
    showToast('Payment method removed.');
  };

  // Format Card Number (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 16);
    const parts = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      parts.push(cleaned.slice(i, i + 4));
    }
    setNewCardNumber(parts.join(' '));
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setNewExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setNewExpiry(cleaned);
    }
  };

  const handleSaveNewCard = () => {
    setCardError(null);
    const rawNumber = newCardNumber.replace(/\s/g, '');
    if (rawNumber.length < 16) {
      setCardError('Please enter a valid 16-digit card number.');
      return;
    }
    if (newExpiry.length < 5) {
      setCardError('Please enter a valid expiry date (MM/YY).');
      return;
    }
    if (newCvv.length < 3) {
      setCardError('Please enter a valid 3 or 4 digit CVV.');
      return;
    }
    if (!newBank.trim()) {
      setCardError('Please enter issuing bank name.');
      return;
    }

    const last4 = rawNumber.slice(-4);
    const networkColors: Record<string, string> = {
      RuPay: '#0F172A',
      Visa: '#1E3A8A',
      Mastercard: '#7C2D12',
      Amex: '#065F46',
    };

    const newCard: PaymentCard = {
      id: `card_${Date.now()}`,
      bankName: newBank.trim(),
      cardholderName: newCardholder.trim() || 'Pooja Iyer',
      cardType: `${newBank.trim()} ${newNetwork}`,
      cardNumber: `•••• •••• •••• ${last4}`,
      rawLast4: last4,
      expiry: newExpiry,
      network: newNetwork,
      isPrimary: newSetPrimary || cards.length === 0,
      bgColor: networkColors[newNetwork] || '#1E293B',
    };

    let updated = [...cards];
    if (newCard.isPrimary) {
      updated = updated.map((c) => ({ ...c, isPrimary: false }));
    }
    updated.push(newCard);

    saveCards(updated);
    setIsAddCardOpen(false);
    setNewCardNumber('');
    setNewExpiry('');
    setNewCvv('');
    showToast(`✓ New ${newCard.cardType} added successfully!`);
  };

  const handleTestBiometrics = () => {
    setBioTestState('testing');
    setTimeout(() => {
      setBioTestState('success');
      setTimeout(() => {
        setBioTestState('idle');
      }, 2500);
    }, 1200);
  };

  const handleRunCryptoCheck = () => {
    setCryptoCheckState('running');
    setCryptoStep(1);
    const timer1 = setTimeout(() => {
      setCryptoStep(3);
    }, 600);
    const timer2 = setTimeout(() => {
      setCryptoStep(5);
      setCryptoCheckState('verified');
    }, 1300);
  };

  const executeSignOut = () => {
    setIsSignOutModalOpen(false);
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgDeep} />

      {/* Floating Toast Notification */}
      {toastMessage ? (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile & Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your dispute identity, cards, and security.</Text>
        </View>

        {/* User Identity Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>PI</Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{DEMO_USER.name}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified Member</Text>
              </View>
            </View>
            <Text style={styles.userEmail}>{DEMO_USER.email}</Text>
            <View style={styles.metaRow}>
              <View style={styles.idBadge}>
                <Text style={styles.idText}>ID: {DEMO_USER.cardholderID}</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>Credit Score: {DEMO_USER.creditScore}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── PAYMENT METHODS MANAGEMENT ─────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionHeader}>PAYMENT METHODS & CARDS</Text>
              <Text style={styles.sectionSubtext}>Select active card for automated chargeback refunds.</Text>
            </View>
            <TouchableOpacity
              style={styles.addCardButton}
              onPress={() => {
                setCardError(null);
                setNewCardNumber('');
                setNewExpiry('');
                setNewCvv('');
                setNewSetPrimary(false);
                setIsAddCardOpen(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.addCardButtonText}>+ Add Card</Text>
            </TouchableOpacity>
          </View>

          {/* Cards List */}
          <View style={{ gap: Spacing.md }}>
            {cards.map((card) => (
              <View key={card.id} style={[styles.cardItem, { backgroundColor: card.bgColor }]}>
                <View style={styles.cardItemTop}>
                  <View style={{ gap: 2 }}>
                    <Text style={styles.cardItemBank}>{card.bankName.toUpperCase()}</Text>
                    <Text style={styles.cardItemType}>{card.cardType}</Text>
                  </View>
                  <View style={styles.networkBadge}>
                    <Text style={styles.networkBadgeText}>{card.network}</Text>
                  </View>
                </View>

                <Text style={styles.cardItemNumber}>{card.cardNumber}</Text>

                <View style={styles.cardItemBottom}>
                  <View>
                    <Text style={styles.cardItemLabel}>EXPIRES</Text>
                    <Text style={styles.cardItemVal}>{card.expiry}</Text>
                  </View>
                  <View>
                    <Text style={styles.cardItemLabel}>CARDHOLDER</Text>
                    <Text style={styles.cardItemVal}>{card.cardholderName}</Text>
                  </View>

                  <View style={styles.cardItemActions}>
                    {card.isPrimary ? (
                      <View style={styles.primaryPill}>
                        <Text style={styles.primaryPillText}>★ PRIMARY</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.setPrimaryBtn}
                        onPress={() => handleSetPrimary(card.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.setPrimaryBtnText}>Set Primary</Text>
                      </TouchableOpacity>
                    )}

                    {!card.isPrimary && (
                      <TouchableOpacity
                        style={styles.deleteCardBtn}
                        onPress={() => handleDeleteCard(card.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.deleteCardBtnText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.cardMeta}>
            🛡️ Protected by 256-bit bank encryption & VerdictAI automated fraud monitoring.
          </Text>
        </View>

        {/* ─── PREFERENCES & SECURITY ─────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>PREFERENCES & SECURITY</Text>

          {/* 1. Biometric Sign-In */}
          <View style={styles.actionRowWithSwitch}>
            <TouchableOpacity
              style={styles.actionLeft}
              onPress={() => setIsBiometricsModalOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>👆</Text>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionLabel}>Biometric Sign-In</Text>
                <Text style={styles.actionValue}>
                  {biometricsEnabled ? 'Enabled (Touch / Face ID Active)' : 'Disabled'}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.switchCol}>
              <Switch
                value={biometricsEnabled}
                onValueChange={(val) => {
                  setBiometricsEnabled(val);
                  showToast(
                    val
                      ? 'Face ID / Touch ID enabled for instant sign-in.'
                      : 'Biometric sign-in turned off.'
                  );
                }}
                trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
                thumbColor={biometricsEnabled ? Colors.primary : '#94A3B8'}
              />
              <TouchableOpacity
                onPress={() => setIsBiometricsModalOpen(true)}
                style={styles.arrowClickArea}
              >
                <Text style={styles.arrowIcon}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Push Notifications */}
          <View style={styles.actionRowWithSwitch}>
            <TouchableOpacity
              style={styles.actionLeft}
              onPress={() => setIsNotificationsModalOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>🔔</Text>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionLabel}>Push Notifications</Text>
                <Text style={styles.actionValue}>
                  {notificationsEnabled ? 'Active (Real-Time SLA & Evidence)' : 'Muted'}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.switchCol}>
              <Switch
                value={notificationsEnabled}
                onValueChange={(val) => {
                  setNotificationsEnabled(val);
                  showToast(
                    val
                      ? 'Real-time dispute lifecycle alerts activated.'
                      : 'Push notifications paused.'
                  );
                }}
                trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
                thumbColor={notificationsEnabled ? Colors.primary : '#94A3B8'}
              />
              <TouchableOpacity
                onPress={() => setIsNotificationsModalOpen(true)}
                style={styles.arrowClickArea}
              >
                <Text style={styles.arrowIcon}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Dispute Policy Guide */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setIsPolicyModalOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>📖</Text>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionLabel}>Dispute Policy Guide</Text>
              <Text style={styles.actionValue}>View Statutory Rules & 48h SLA</Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>

          {/* 4. Cryptographic Verification */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => {
              setCryptoCheckState('idle');
              setCryptoStep(0);
              setIsCryptoModalOpen(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>🔐</Text>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionLabel}>Cryptographic Verification</Text>
              <Text style={styles.actionValue}>SHA-256 / Merkle Ledger Attestation</Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => setIsSignOutModalOpen(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionFooter}>
          VerdictAI Mobile v1.0.0 · IT644 SOA Architecture · DA-IICT
        </Text>
      </ScrollView>

      {/* ─── MODAL 1: ADD PAYMENT CARD ──────────────────────────── */}
      <Modal
        visible={isAddCardOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddCardOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Payment Card</Text>
              <TouchableOpacity onPress={() => setIsAddCardOpen(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
              {cardError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {cardError}</Text>
                </View>
              ) : null}

              {/* Card Network Selector */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>CARD NETWORK</Text>
                <View style={styles.networkPillRow}>
                  {(['RuPay', 'Visa', 'Mastercard', 'Amex'] as const).map((net) => (
                    <TouchableOpacity
                      key={net}
                      style={[styles.networkPill, newNetwork === net && styles.networkPillActive]}
                      onPress={() => setNewNetwork(net)}
                    >
                      <Text
                        style={[
                          styles.networkPillText,
                          newNetwork === net && styles.networkPillTextActive,
                        ]}
                      >
                        {net}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>ISSUING BANK NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. State Bank of India, Axis Bank"
                  value={newBank}
                  onChangeText={setNewBank}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>CARDHOLDER NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Pooja Iyer"
                  value={newCardholder}
                  onChangeText={setNewCardholder}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>16-DIGIT CARD NUMBER</Text>
                <TextInput
                  style={styles.input}
                  placeholder="4532 8912 0041 8102"
                  keyboardType="number-pad"
                  value={newCardNumber}
                  onChangeText={handleCardNumberChange}
                  maxLength={19}
                />
              </View>

              <View style={styles.rowTwoCols}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>EXPIRY (MM/YY)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="12/28"
                    keyboardType="number-pad"
                    value={newExpiry}
                    onChangeText={handleExpiryChange}
                    maxLength={5}
                  />
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="•••"
                    secureTextEntry
                    keyboardType="number-pad"
                    value={newCvv}
                    onChangeText={setNewCvv}
                    maxLength={4}
                  />
                </View>
              </View>

              {/* Set Primary Toggle */}
              <View style={styles.switchRow}>
                <Text style={styles.switchRowLabel}>Set as Primary Card for Refunds</Text>
                <Switch
                  value={newSetPrimary}
                  onValueChange={setNewSetPrimary}
                  trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
                  thumbColor={newSetPrimary ? Colors.primary : '#94A3B8'}
                />
              </View>

              <TouchableOpacity
                style={styles.primaryModalBtn}
                onPress={handleSaveNewCard}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryModalBtnText}>Save & Link Card</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 2: BIOMETRIC SETTINGS ────────────────────────── */}
      <Modal
        visible={isBiometricsModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsBiometricsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardSmall}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Biometric Settings</Text>
              <TouchableOpacity onPress={() => setIsBiometricsModalOpen(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBodyCentered}>
              <View style={styles.bioIconCircle}>
                <Text style={{ fontSize: 36 }}>
                  {bioTestState === 'success' ? '✅' : '👆'}
                </Text>
              </View>

              <Text style={styles.dialogHeading}>Touch ID & Face ID</Text>
              <Text style={styles.dialogBody}>
                Cryptographically bound to your device Secure Enclave. Used to sign dispute claims and authenticate instant chargeback refunds without re-entering passwords.
              </Text>

              <View style={styles.bioStatusPill}>
                <Text style={styles.bioStatusText}>
                  ● Status: {biometricsEnabled ? 'Active & Hardware Enrolled' : 'Disabled'}
                </Text>
              </View>

              {bioTestState === 'testing' ? (
                <View style={{ marginVertical: 12, alignItems: 'center' }}>
                  <ActivityIndicator color={Colors.primary} size="small" />
                  <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 6 }}>
                    Scanning biometric sensor...
                  </Text>
                </View>
              ) : bioTestState === 'success' ? (
                <View style={styles.successTestBox}>
                  <Text style={styles.successTestText}>
                    ✓ Biometric Sensor Authenticated Successfully!
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.testBioBtn}
                  onPress={handleTestBiometrics}
                  activeOpacity={0.8}
                >
                  <Text style={styles.testBioBtnText}>Test Biometric Sensor</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.closeSimpleBtn}
                onPress={() => setIsBiometricsModalOpen(false)}
              >
                <Text style={styles.closeSimpleBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 3: PUSH NOTIFICATIONS ────────────────────────── */}
      <Modal
        visible={isNotificationsModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsNotificationsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Channels</Text>
              <TouchableOpacity onPress={() => setIsNotificationsModalOpen(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14 }}>
              <Text style={styles.dialogBody}>
                Configure real-time alerts for your active chargeback investigations:
              </Text>

              <View style={styles.notifToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.notifTitle}>Dispute Status Transitions</Text>
                  <Text style={styles.notifDesc}>Alert when case moves to Scored or Auto-Resolved.</Text>
                </View>
                <Switch
                  value={notifDisputeUpdate}
                  onValueChange={setNotifDisputeUpdate}
                  thumbColor={notifDisputeUpdate ? Colors.primary : '#94A3B8'}
                />
              </View>

              <View style={styles.notifToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.notifTitle}>Merchant Evidence Uploads</Text>
                  <Text style={styles.notifDesc}>Notify immediately when counter-evidence is ingested.</Text>
                </View>
                <Switch
                  value={notifEvidenceIngest}
                  onValueChange={setNotifEvidenceIngest}
                  thumbColor={notifEvidenceIngest ? Colors.primary : '#94A3B8'}
                />
              </View>

              <View style={styles.notifToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.notifTitle}>SLA Deadline Warnings</Text>
                  <Text style={styles.notifDesc}>Urgent notification when merchant response window is &lt; 6 hours.</Text>
                </View>
                <Switch
                  value={notifSlaExpiry}
                  onValueChange={setNotifSlaExpiry}
                  thumbColor={notifSlaExpiry ? Colors.primary : '#94A3B8'}
                />
              </View>

              <View style={styles.notifToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.notifTitle}>Refund & Credit Alerts</Text>
                  <Text style={styles.notifDesc}>Immediate SMS and in-app confirmation upon credit release.</Text>
                </View>
                <Switch
                  value={notifRefundCredit}
                  onValueChange={setNotifRefundCredit}
                  thumbColor={notifRefundCredit ? Colors.primary : '#94A3B8'}
                />
              </View>

              <TouchableOpacity
                style={styles.primaryModalBtn}
                onPress={() => {
                  setIsNotificationsModalOpen(false);
                  showToast('Notification preferences updated.');
                }}
              >
                <Text style={styles.primaryModalBtnText}>Save Preferences</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 4: DISPUTE POLICY GUIDE ──────────────────────── */}
      <Modal
        visible={isPolicyModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPolicyModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>VerdictAI Dispute Policy & SLA</Text>
              <TouchableOpacity onPress={() => setIsPolicyModalOpen(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 16 }}>
              <View style={styles.policySection}>
                <Text style={styles.policyHeading}>🏛️ RBI Zero-Liability Framework</Text>
                <Text style={styles.policyText}>
                  Under RBI Master Direction (DBR.No.Leg.BC.78/09.07.005/2017-18), cardholders have zero liability for fraudulent or unauthorized third-party transactions when reported within 3 working days.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policyHeading}>⏱️ Statutory 48-Hour SLA Window</Text>
                <Text style={styles.policyText}>
                  When a dispute is initiated, the merchant gateway receives an automated statutory 48-hour deadline to upload counter-proof (shipping manifest, signature proof, RMA record). If unmet, VerdictAI auto-resolves in customer favor.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policyHeading}>⚖️ Impartial Fair-Weighing ML</Text>
                <Text style={styles.policyText}>
                  VerdictAI applies a 7-factor mathematical arbitration matrix, cross-referencing courier GPS telematics against society CCTV logs and dual-swipe POS terminal timestamps to eliminate merchant or buyer bias.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policyHeading}>💳 Escrow Reversal Guarantee</Text>
                <Text style={styles.policyText}>
                  Upon case resolution, funds are automatically re-credited to your primary payment card within 2 to 4 hours via NPCI / RuPay fast settlement channels.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryModalBtn}
                onPress={() => setIsPolicyModalOpen(false)}
              >
                <Text style={styles.primaryModalBtnText}>Understood & Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 5: CRYPTOGRAPHIC VERIFICATION ────────────────── */}
      <Modal
        visible={isCryptoModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCryptoModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cryptographic Proof & Ledger</Text>
              <TouchableOpacity onPress={() => setIsCryptoModalOpen(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 16 }}>
              <Text style={styles.dialogBody}>
                Every dispute, evidence upload, and scoring decision is hashed using SHA-256 and sealed into an immutable Merkle Audit Ledger.
              </Text>

              <View style={styles.cryptoHashBox}>
                <Text style={styles.cryptoHashLabel}>ACTIVE MERKLE ROOT HASH</Text>
                <Text style={styles.cryptoHashValue}>
                  0x7a8f9b2d88192034e341c0989f1a4bfd3391c7a8b1f2e4c0
                </Text>
              </View>

              <View style={styles.auditInfoGrid}>
                <View style={styles.auditInfoItem}>
                  <Text style={styles.auditInfoLabel}>ALGORITHM</Text>
                  <Text style={styles.auditInfoVal}>SHA-256 (FIPS 180-4)</Text>
                </View>
                <View style={styles.auditInfoItem}>
                  <Text style={styles.auditInfoLabel}>AUDIT BLOCKS</Text>
                  <Text style={styles.auditInfoVal}>5 Sealed Cases</Text>
                </View>
                <View style={styles.auditInfoItem}>
                  <Text style={styles.auditInfoLabel}>STANDARD</Text>
                  <Text style={styles.auditInfoVal}>Visa Core & RBI 2026</Text>
                </View>
                <View style={styles.auditInfoItem}>
                  <Text style={styles.auditInfoLabel}>INTEGRITY</Text>
                  <Text style={[styles.auditInfoVal, { color: '#16A34A' }]}>● Tamper-Evident</Text>
                </View>
              </View>

              {cryptoCheckState === 'running' ? (
                <View style={styles.verificationProgressBox}>
                  <ActivityIndicator color={Colors.primary} size="small" />
                  <Text style={styles.progressText}>
                    Verifying SHA-256 Block [{cryptoStep}/5] against Merkle Root...
                  </Text>
                </View>
              ) : cryptoCheckState === 'verified' ? (
                <View style={styles.verifiedSuccessBox}>
                  <Text style={styles.verifiedSuccessTitle}>✓ Audit Chain 100% Intact</Text>
                  <Text style={styles.verifiedSuccessSub}>
                    All 5 dispute case files and evidence checksums match the root ledger hash. Zero tampering detected.
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.runAuditBtn}
                  onPress={handleRunCryptoCheck}
                  activeOpacity={0.8}
                >
                  <Text style={styles.runAuditBtnText}>Run SHA-256 Audit Integrity Check</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.closeSimpleBtn}
                onPress={() => setIsCryptoModalOpen(false)}
              >
                <Text style={styles.closeSimpleBtnText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 6: SIGN OUT CONFIRMATION ─────────────────────── */}
      <Modal
        visible={isSignOutModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsSignOutModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardSmall}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sign Out</Text>
              <TouchableOpacity onPress={() => setIsSignOutModalOpen(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBodyCentered}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🚪</Text>
              <Text style={styles.dialogHeading}>End Active Session?</Text>
              <Text style={styles.dialogBody}>
                Are you sure you want to sign out of VerdictAI as Pooja Iyer (usr_pooja_01)?
              </Text>

              <View style={styles.signOutBtnRow}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setIsSignOutModalOpen(false)}
                >
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmSignOutBtn}
                  onPress={executeSignOut}
                >
                  <Text style={styles.confirmSignOutBtnText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scrollContent: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 60 },

  // Toast
  toastContainer: {
    position: 'absolute',
    top: 16,
    left: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: '#0F172A',
    borderRadius: Radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    ...Shadow.card,
  },
  toastText: { color: '#FFFFFF', fontSize: Typography.sm, fontWeight: Typography.bold },

  header: { paddingVertical: Spacing.xs },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.textPrimary },
  headerSubtitle: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },

  // User Card
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#93C5FD',
  },
  avatarInitial: { fontSize: Typography.xl, fontWeight: Typography.extrabold, color: '#1D4ED8' },
  userInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  userName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  verifiedText: { fontSize: 10, fontWeight: Typography.bold, color: '#166534' },
  userEmail: { fontSize: Typography.xs, color: Colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  idBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  idText: { fontSize: 10, color: Colors.textSecondary, fontWeight: Typography.semibold },
  scoreBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  scoreText: { fontSize: 10, color: '#1E40AF', fontWeight: Typography.bold },

  // Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadow.card,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionHeader: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  sectionSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  addCardButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  addCardButtonText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: '#1D4ED8',
  },

  // Payment Cards
  cardItem: {
    borderRadius: Radius.lg,
    padding: Spacing.base,
    gap: Spacing.md,
    ...Shadow.card,
  },
  cardItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardItemBank: { fontSize: 10, color: '#94A3B8', fontWeight: Typography.extrabold, letterSpacing: 1 },
  cardItemType: { fontSize: Typography.sm, color: '#FFFFFF', fontWeight: Typography.bold },
  networkBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  networkBadgeText: { fontSize: 11, color: '#FFFFFF', fontWeight: Typography.bold },
  cardItemNumber: {
    fontSize: Typography.lg,
    color: '#FFFFFF',
    fontWeight: Typography.bold,
    letterSpacing: 2,
    marginVertical: 4,
  },
  cardItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardItemLabel: { fontSize: 9, color: '#94A3B8', fontWeight: Typography.bold, letterSpacing: 0.5 },
  cardItemVal: { fontSize: Typography.xs, color: '#FFFFFF', fontWeight: Typography.semibold, marginTop: 1 },
  cardItemActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  primaryPill: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  primaryPillText: { fontSize: 10, fontWeight: Typography.extrabold, color: '#FFFFFF' },
  setPrimaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  setPrimaryBtnText: { fontSize: 10, fontWeight: Typography.bold, color: '#FFFFFF' },
  deleteCardBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  deleteCardBtnText: { fontSize: 11, color: '#FCA5A5', fontWeight: Typography.bold },
  cardMeta: { fontSize: Typography.xs, color: Colors.textSecondary, fontStyle: 'italic', marginTop: 2 },

  // Action Rows
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionRowWithSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  switchCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrowClickArea: {
    padding: 4,
  },
  actionIcon: { fontSize: 20 },
  actionTextCol: { flex: 1, gap: 2 },
  actionLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  actionValue: { fontSize: Typography.xs, color: Colors.textSecondary },
  arrowIcon: { fontSize: 22, color: Colors.textMuted },

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
    paddingTop: Spacing.xs,
  },

  // Modal Common
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadow.card,
  },
  modalCardSmall: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadow.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  modalCloseBtn: { padding: 4 },
  modalCloseIcon: { fontSize: 20, color: Colors.textMuted },
  modalBodyCentered: { alignItems: 'center', gap: 10, paddingVertical: 8 },

  fieldGroup: { gap: 6 },
  label: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textSecondary, letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  rowTwoCols: { flexDirection: 'row', gap: 12 },
  networkPillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  networkPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  networkPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  networkPillText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textSecondary },
  networkPillTextActive: { color: '#1D4ED8', fontWeight: Typography.bold },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchRowLabel: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.medium },

  primaryModalBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadow.card,
  },
  primaryModalBtnText: { fontSize: Typography.md, fontWeight: Typography.bold, color: '#FFFFFF' },

  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  errorText: { fontSize: Typography.xs, color: '#DC2626', fontWeight: Typography.semibold },

  // Biometrics Modal
  bioIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    marginBottom: 4,
  },
  dialogHeading: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary, textAlign: 'center' },
  dialogBody: { fontSize: Typography.xs, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  bioStatusPill: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  bioStatusText: { fontSize: 11, fontWeight: Typography.bold, color: '#15803D' },
  testBioBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
    marginTop: 6,
  },
  testBioBtnText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: '#1D4ED8' },
  successTestBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: Radius.md,
    padding: 10,
    marginTop: 6,
  },
  successTestText: { fontSize: Typography.xs, color: '#166534', fontWeight: Typography.bold },
  closeSimpleBtn: { marginTop: 6, padding: 8 },
  closeSimpleBtnText: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: Typography.semibold },

  // Notifications Modal
  notifToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notifTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  notifDesc: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

  // Policy Modal
  policySection: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  policyHeading: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary },
  policyText: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18 },

  // Crypto Modal
  cryptoHashBox: {
    backgroundColor: '#0F172A',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
  },
  cryptoHashLabel: { fontSize: 10, color: '#94A3B8', fontWeight: Typography.bold, letterSpacing: 0.5 },
  cryptoHashValue: { fontSize: 11, color: '#38BDF8', fontFamily: 'monospace', letterSpacing: 0.5 },
  auditInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  auditInfoItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 2,
  },
  auditInfoLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: Typography.bold },
  auditInfoVal: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textPrimary },
  runAuditBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: 6,
  },
  runAuditBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: '#1D4ED8' },
  verificationProgressBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: Radius.md,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  progressText: { fontSize: Typography.xs, color: '#1E40AF', fontWeight: Typography.semibold },
  verifiedSuccessBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: Radius.md,
    padding: 12,
    gap: 4,
    marginTop: 6,
  },
  verifiedSuccessTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: '#15803D' },
  verifiedSuccessSub: { fontSize: Typography.xs, color: '#166534', lineHeight: 16 },

  // Sign Out Modal
  signOutBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    width: '100%',
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelModalBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textSecondary },
  confirmSignOutBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmSignOutBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: '#FFFFFF' },
});
