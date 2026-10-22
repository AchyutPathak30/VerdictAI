import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgDeep} />

      {/* Top Branding Section */}
      <View style={styles.heroSection}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>⚖️</Text>
        </View>
        <Text style={styles.appName}>VerdictAI</Text>
        <Text style={styles.headline}>Smart Dispute Resolution</Text>
        <Text style={styles.subheadline}>
          Resolving contested card charges in minutes, not weeks.
        </Text>
      </View>

      {/* Feature Pills (Visily Value Props) */}
      <View style={styles.featuresSection}>
        <FeatureCard icon="⚡" title="Automated Resolution" text="AI-driven chargeback triage within 48h SLA" />
        <FeatureCard icon="🔍" title="Fair-Weighing ML" text="Impartial evidence scoring & Gemini XAI rationale" />
        <FeatureCard icon="🔒" title="Cryptographic Seal" text="Tamper-evident Merkle hash audit chains" />
      </View>

      {/* CTA Buttons */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Get Started →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.trustDivider}>
          <View style={styles.trustLine} />
          <Text style={styles.trustText}>Trusted by 50,000+ cardholders</Text>
          <View style={styles.trustLine} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconCircle}>
        <Text style={styles.featureIcon}>{icon}</Text>
      </View>
      <View style={styles.featureTextCol}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: Spacing['3xl'],
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
    ...Shadow.card,
  },
  logoIcon: {
    fontSize: 40,
  },
  appName: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headline: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  subheadline: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    maxWidth: 290,
    lineHeight: 20,
  },
  featuresSection: {
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadow.card,
  },
  featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 22,
  },
  featureTextCol: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  featureText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  actionsSection: {
    gap: Spacing.md,
    paddingTop: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    ...Shadow.card,
  },
  primaryButtonText: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  trustDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  trustLine: {
    width: 32,
    height: 1,
    backgroundColor: Colors.border,
  },
  trustText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
});
