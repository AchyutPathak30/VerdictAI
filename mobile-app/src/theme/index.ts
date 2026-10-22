/**
 * VerdictAI Design System & Theme Tokens
 * Aligned with Visily mobile wireframe color palette (Mayank Jayswal)
 * Clean Light Fintech Mode: #F8FAFC root, #FFFFFF cards, #2563EB primary
 */

export const Colors = {
  // Primary Brand (Visily Royal Blue)
  primary: '#2563EB',       // Blue 600 - CTAs, active tabs, buttons
  primaryDark: '#1D4ED8',   // Blue 700 - pressed states
  primaryLight: '#DBEAFE',  // Blue 100 - soft badge fills, highlights

  // Background Layer System (Visily Light Theme)
  bgDeep: '#F8FAFC',        // Slate 50 - clean root background
  bgCard: '#FFFFFF',        // Pure white — cards, modals
  bgSurface: '#F1F5F9',     // Slate 100 — search bars, tab containers, inputs
  bgElevated: '#FFFFFF',    // Pure white for popups, bottom sheets

  // Text Hierarchy
  textPrimary: '#0F172A',   // Slate 900 — headings, primary content
  textSecondary: '#64748B', // Slate 500 — subtext, labels
  textMuted: '#94A3B8',     // Slate 400 — placeholders, inactive
  textInvert: '#FFFFFF',    // White for use on blue/colored buttons

  // Status Colors (matching Visily pill badges)
  statusSubmitted: '#D97706',     // Amber 600 — SUBMITTED, EVIDENCE_PENDING
  statusInProgress: '#2563EB',    // Blue 600 — EVIDENCE_INGESTED, IN_ANALYSIS
  statusEvaluated: '#7C3AED',     // Violet 600 — SCORING_EVALUATED
  statusResolved: '#16A34A',      // Green 600 — AUTO_RESOLVED, CLOSED
  statusManual: '#EA580C',        // Orange 600 — MANUAL_REVIEW_QUEUE
  statusRejected: '#DC2626',      // Red 600 — REJECTED
  statusOverridden: '#4F46E5',    // Indigo 600 — ADMIN_OVERRIDDEN

  // Status Badge Background Fills (tinted light)
  statusSubmittedBg: '#FFFBEB',
  statusInProgressBg: '#EFF6FF',
  statusEvaluatedBg: '#F5F3FF',
  statusResolvedBg: '#F0FDF4',
  statusManualBg: '#FFF7ED',
  statusRejectedBg: '#FEF2F2',
  statusOverriddenBg: '#EEF2FF',

  // UI Utilities
  border: '#E2E8F0',        // Slate 200 — subtle crisp card & input borders
  divider: '#F1F5F9',       // Slate 100 — dividers
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',

  // Tab Bar
  tabActive: '#2563EB',
  tabInactive: '#64748B',
  tabBackground: '#FFFFFF',
} as const;

export const Typography = {
  // Font sizes (sp scale)
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,

  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 56,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const Shadow = {
  card: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  modal: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};
