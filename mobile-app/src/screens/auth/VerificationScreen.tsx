import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
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
  const [otp, setOtp] = useState(['1', '2', '3', '4', '5', '6']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);
  const rootNav = useNavigation<RootNav<RootStackParamList, 'Auth'>>();

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < 6) {
      Alert.alert('Incomplete Code', 'Please enter all 6 digits of your verification code.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      rootNav.reset({ index: 0, routes: [{ name: 'Main' }] });
    }, 400);
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
        {/* Shield Icon Circle */}
        <View style={styles.shieldCircle}>
          <Text style={styles.shieldIcon}>🛡️</Text>
        </View>

        <Text style={styles.title}>Security Verification</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>{email}</Text>. Please enter it below to continue.
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
            />
          ))}
        </View>

        {/* Resend info */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Resend Code (59s)</Text>
          <Text style={styles.spamNote}>
            Check your spam folder if you haven't received the code within 1 minute.
          </Text>
        </View>

        {/* Verify Action */}
        <TouchableOpacity
          style={[styles.verifyBtn, loading && styles.verifyBtnDisabled]}
          onPress={handleVerify}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.verifyBtnText}>
            {loading ? 'Verifying...' : 'Verify Identity'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  backIcon: { fontSize: 24, color: Colors.textPrimary },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  logoIcon: { fontSize: 24 },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  shieldCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  shieldIcon: { fontSize: 32 },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  otpRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    textAlign: 'center',
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    ...Shadow.card,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#F8FAFC',
  },
  resendContainer: {
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  resendText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  spamNote: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 16,
  },
  verifyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.lg,
    ...Shadow.card,
  },
  verifyBtnDisabled: { opacity: 0.6 },
  verifyBtnText: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: '#fff',
  },
});
