import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList, RootStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp as RootNav } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Verification'>;
  route: RouteProp<AuthStackParamList, 'Verification'>;
};

export default function VerificationScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [activeCode, setActiveCode] = useState('842915');
  const [secondsLeft, setSecondsLeft] = useState(59);
  const [loading, setLoading] = useState(false);
  const [codeBannerVisible, setCodeBannerVisible] = useState(true);

  const inputRefs = useRef<TextInput[]>([]);
  const rootNav = useNavigation<RootNav<RootStackParamList>>();

  // Active countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleOtpChange = (text: string, index: number) => {
    // Clean to single digit
    const cleaned = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleaned.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleAutofillCode = () => {
    const digits = activeCode.split('');
    setOtp(digits);
    if (inputRefs.current[5]) {
      inputRefs.current[5].focus();
    }
  };

  const handleResend = () => {
    const newCode = String(Math.floor(100000 + Math.random() * 900000));
    setActiveCode(newCode);
    setSecondsLeft(59);
    setOtp(['', '', '', '', '', '']);
    setCodeBannerVisible(true);
    inputRefs.current[0]?.focus();
    Alert.alert(
      'New Verification Code Dispatched',
      `A fresh 6-digit 2FA code has been sent to ${email || 'your email'}: ${newCode}`
    );
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < 6) {
      Alert.alert('Incomplete Code', 'Please enter all 6 digits of your verification code.');
      return;
    }

    if (code !== activeCode && code !== '123456') {
      Alert.alert(
        'Invalid Verification Code',
        `The code entered (${code}) does not match the active passkey (${activeCode}). Please check and retry.`,
        [
          { text: 'Auto-fill Correct Code', onPress: handleAutofillCode },
          { text: 'Try Again', style: 'cancel' }
        ]
      );
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      rootNav.reset({ index: 0, routes: [{ name: 'Main' }] });
    }, 450);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgDeep} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>⚖️</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* In-App Simulated Email / Notification Banner */}
        {codeBannerVisible && (
          <View style={styles.notificationBanner}>
            <Text style={styles.bannerIcon}>📩</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>2FA Passkey Dispatched to Email</Text>
              <Text style={styles.bannerText}>
                Your active verification code is <Text style={styles.codeHighlight}>{activeCode}</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={handleAutofillCode} style={styles.bannerAction}>
              <Text style={styles.bannerActionText}>Auto-Fill</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Shield Icon Circle */}
        <View style={styles.shieldCircle}>
          <Text style={styles.shieldIcon}>🛡️</Text>
        </View>

        <Text style={styles.title}>Security Verification</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{' '}
          <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>{email || 'pooja.iyer@gmail.com'}</Text>. Please enter it below to continue.
        </Text>

        {/* 6-Digit OTP Blocks */}
        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(ref) => {
                if (ref) inputRefs.current[idx] = ref;
              }}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : null,
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, idx)}
              onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, idx)}
              selectTextOnFocus
              placeholder="•"
              placeholderTextColor="#CBD5E1"
            />
          ))}
        </View>

        {/* 1-Tap Quick Action */}
        <TouchableOpacity
          style={styles.autofillPill}
          onPress={handleAutofillCode}
          activeOpacity={0.8}
        >
          <Text style={styles.autofillPillText}>⚡ Auto-fill Code ({activeCode})</Text>
        </TouchableOpacity>

        {/* Resend info with Live Countdown */}
        <View style={styles.resendContainer}>
          {secondsLeft > 0 ? (
            <Text style={styles.resendText}>Resend Code in ({secondsLeft}s)</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} style={styles.resendButton}>
              <Text style={styles.resendButtonText}>🔄 Resend Verification Code Now</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.spamNote}>
            Check your spam folder or tap "Auto-fill Code" above for instant demo access.
          </Text>
        </View>

        {/* Verify Action */}
        <TouchableOpacity
          style={[styles.verifyBtn, loading && styles.verifyBtnDisabled]}
          onPress={handleVerify}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.verifyBtnText}>Verify Identity</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    color: Colors.textPrimary,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  logoIcon: {
    fontSize: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
    marginTop: -20,
  },
  notificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  bannerIcon: { fontSize: 22 },
  bannerTitle: { fontSize: Typography.xs, fontWeight: Typography.bold, color: '#1E3A8A' },
  bannerText: { fontSize: Typography.xs, color: '#1E40AF', marginTop: 1 },
  codeHighlight: { fontWeight: Typography.bold, color: '#1D4ED8', fontSize: Typography.sm },
  bannerAction: {
    backgroundColor: '#2563EB',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  bannerActionText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: '#fff' },

  shieldCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  shieldIcon: {
    fontSize: 34,
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: Colors.bgCard,
    textAlign: 'center',
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    ...Shadow.card,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#F0F9FF',
  },
  autofillPill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: 6,
    marginTop: -4,
  },
  autofillPillText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: '#334155',
  },
  resendContainer: {
    alignItems: 'center',
    gap: 4,
    marginVertical: Spacing.xs,
  },
  resendText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.semibold,
  },
  resendButton: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
  },
  resendButtonText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.bold,
  },
  spamNote: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  verifyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadow.card,
  },
  verifyBtnDisabled: {
    opacity: 0.6,
  },
  verifyBtnText: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: '#fff',
  },
});
