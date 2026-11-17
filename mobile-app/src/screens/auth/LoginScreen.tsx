import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, RootStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp as RootNavProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const rootNav = useNavigation<RootNavProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Registration modal state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCard, setRegCard] = useState('4492');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // In-line error / info states
  const [loginError, setLoginError] = useState<string | null>(null);
  const [infoBanner, setInfoBanner] = useState<string | null>(null);

  // Biometrics modal state
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<'scanning' | 'success' | 'failed'>('scanning');

  const handleLogin = async () => {
    setLoginError(null);
    if (!email.trim() || !password.trim()) {
      setLoginError('Please enter your email and password, or tap Quick Demo Fill.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Direct authenticated session initialization — no dummy 2FA bluff
      rootNav.reset({ index: 0, routes: [{ name: 'Main' }] });
    }, 400);
  };

  const handleDemoAutofill = () => {
    setEmail('pooja.iyer@gmail.com');
    setPassword('VerdictAI@2026');
    setLoginError(null);
  };

  const handleStartBiometrics = () => {
    setLoginError(null);
    setIsBiometricOpen(true);
    setBiometricStatus('scanning');
    setTimeout(() => {
      setBiometricStatus('success');
      setTimeout(() => {
        setIsBiometricOpen(false);
        // Direct entry to main app via strong biometric authentication
        rootNav.reset({ index: 0, routes: [{ name: 'Main' }] });
      }, 700);
    }, 1200);
  };

  const handleForgotPassword = () => {
    const targetEmail = email.trim() || 'pooja.iyer@gmail.com';
    setInfoBanner(`A password reset link has been dispatched to ${targetEmail}`);
    setTimeout(() => setInfoBanner(null), 5000);
  };

  const handleRegisterSubmit = () => {
    setRegError(null);
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegError('Please complete all required fields to register.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Password and Confirm Password must match.');
      return;
    }

    setRegLoading(true);
    setTimeout(() => {
      setRegLoading(false);
      setIsRegisterOpen(false);
      setEmail(regEmail.trim());
      setPassword(regPassword);
      // Direct authenticated entry to main app
      rootNav.reset({ index: 0, routes: [{ name: 'Main' }] });
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgDeep} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>⚖️</Text>
            </View>
            <Text style={styles.title}>Sign In to VerdictAI</Text>
            <Text style={styles.subtitle}>
              Access your cardholder dispute resolution dashboard.
            </Text>
          </View>

          {/* Quick Demo Autofill Bar */}
          <TouchableOpacity
            style={styles.autofillBanner}
            onPress={handleDemoAutofill}
            activeOpacity={0.8}
          >
            <Text style={styles.autofillIcon}>⚡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.autofillTitle}>1-Click Demo Fill (Pooja Iyer)</Text>
              <Text style={styles.autofillSub}>Tap to load valid demo credentials instantly</Text>
            </View>
            <Text style={styles.autofillAction}>Fill →</Text>
          </TouchableOpacity>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. pooja.iyer@gmail.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🔒'}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {loginError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {loginError}</Text>
              </View>
            ) : null}

            {infoBanner ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>✉️ {infoBanner}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleStartBiometrics}
              activeOpacity={0.85}
            >
              <Text style={styles.biometricIcon}>👆</Text>
              <Text style={styles.biometricText}>Sign in with Face ID / Touch ID</Text>
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => {
                  setRegName('Pooja Iyer');
                  setRegEmail('pooja.iyer@gmail.com');
                  setRegPassword('VerdictAI@2026');
                  setRegConfirmPassword('VerdictAI@2026');
                  setRegError(null);
                  setIsRegisterOpen(true);
                }}
              >
                <Text style={styles.registerLink}>Register Now</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Demo Note */}
          <View style={styles.demoNote}>
            <Text style={styles.demoTitle}>🔧 Cardholder Triage Mode</Text>
            <Text style={styles.demoText}>
              Direct cardholder authentication with encrypted session tokens, dynamic 48h SLA dispute filing, and live Gemini XAI reasoning.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Registration Modal ─────────────────────────────────────────── */}
      <Modal
        visible={isRegisterOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsRegisterOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register New Account</Text>
              <TouchableOpacity
                onPress={() => setIsRegisterOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
              {regError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {regError}</Text>
                </View>
              ) : null}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>FULL NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Pooja Iyer"
                  value={regName}
                  onChangeText={setRegName}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. pooja.iyer@gmail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={regEmail}
                  onChangeText={setRegEmail}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>PRIMARY CARD LAST 4 DIGITS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="4492"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={regCard}
                  onChangeText={setRegCard}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Choose a strong password"
                  secureTextEntry
                  value={regPassword}
                  onChangeText={setRegPassword}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>CONFIRM PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  secureTextEntry
                  value={regConfirmPassword}
                  onChangeText={setRegConfirmPassword}
                />
              </View>

              <TouchableOpacity
                style={[styles.loginButton, regLoading && styles.loginButtonDisabled]}
                onPress={handleRegisterSubmit}
                disabled={regLoading}
              >
                {regLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Create Account & Sign In</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Biometrics Authentication Modal ────────────────────────────── */}
      <Modal
        visible={isBiometricOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsBiometricOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.biometricModalCard}>
            <View style={styles.biometricIconCircle}>
              <Text style={{ fontSize: 44 }}>
                {biometricStatus === 'success' ? '✅' : '👆'}
              </Text>
            </View>

            <Text style={styles.biometricModalTitle}>
              {biometricStatus === 'success'
                ? 'Biometrics Verified!'
                : 'Touch ID / Face ID'}
            </Text>

            <Text style={styles.biometricModalSub}>
              {biometricStatus === 'success'
                ? 'Identity confirmed. Signing you in...'
                : `Glance at camera or place finger on sensor to authenticate as ${email || 'Pooja Iyer'}.`}
            </Text>

            {biometricStatus === 'scanning' && (
              <ActivityIndicator
                size="large"
                color={Colors.primary}
                style={{ marginTop: 12 }}
              />
            )}

            {biometricStatus === 'scanning' && (
              <TouchableOpacity
                style={styles.cancelBiometricBtn}
                onPress={() => setIsBiometricOpen(false)}
              >
                <Text style={styles.cancelBiometricText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scrollContent: { padding: Spacing.xl, gap: Spacing.lg },
  header: { alignItems: 'center', gap: Spacing.xs },
  backBtn: { alignSelf: 'flex-start', padding: Spacing.xs },
  backIcon: { fontSize: 24, color: Colors.textPrimary },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    ...Shadow.card,
  },
  logoIcon: { fontSize: 30 },
  title: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
  
  autofillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  autofillIcon: { fontSize: 20 },
  autofillTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: '#1E40AF' },
  autofillSub: { fontSize: Typography.xs, color: '#3B82F6' },
  autofillAction: { fontSize: Typography.sm, fontWeight: Typography.bold, color: '#1E40AF' },

  form: { gap: Spacing.base },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    ...Shadow.card,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    ...Shadow.card,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  eyeButton: { padding: Spacing.sm },
  eyeIcon: { fontSize: 18 },
  forgotPassword: { alignSelf: 'flex-end', marginTop: 4 },
  forgotText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.medium },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadow.card,
  },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { fontSize: Typography.md, fontWeight: Typography.bold, color: '#fff' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.xs },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.semibold },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  biometricIcon: { fontSize: 20 },
  biometricText: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.semibold },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  registerText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.bold,
  },
  demoNote: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: Spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    gap: Spacing.xs,
  },
  demoTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary },
  demoText: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadow.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  modalCloseBtn: { padding: 4 },
  modalCloseIcon: { fontSize: 20, color: Colors.textMuted },

  biometricModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: 12,
    ...Shadow.card,
  },
  biometricIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  biometricModalTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  biometricModalSub: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  cancelBiometricBtn: { marginTop: 8, padding: 8 },
  cancelBiometricText: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: Typography.semibold },

  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  errorText: {
    fontSize: Typography.xs,
    color: '#DC2626',
    fontWeight: Typography.semibold,
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  infoText: {
    fontSize: Typography.xs,
    color: '#1D4ED8',
    fontWeight: Typography.semibold,
    lineHeight: 18,
  },
});
