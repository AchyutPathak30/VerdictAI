import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building2,
  Phone,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Sparkles,
  Info,
  Store,
  ChevronRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { ToastMessage } from '../common/Toast';
import { ScreenId } from '../layout/Sidebar';

import { UserPersona } from '../../types/dispute';
import { authenticateUser, registerCardholderWeb, registerMerchantWeb } from '../../services/api';
export type { UserPersona };

interface LoginScreenProps {
  onLogin: (user: UserPersona, targetScreen: ScreenId) => void;
  onNavigateToForgotPassword: () => void;
  onAddToast?: (toast: Omit<ToastMessage, 'id'>) => void;
}

const DEMO_PERSONAS: Array<{
  persona: UserPersona;
  targetScreen: ScreenId;
  badge: string;
  badgeColor: string;
  desc: string;
}> = [
  {
    persona: {
      name: 'Priya Sharma',
      role: 'Admin Lead',
      email: 'priya.sharma@verdictai-bank.com',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      userId: 'usr_priya_01',
    },
    targetScreen: 'dashboard',
    badge: 'BANK ADMIN CORE',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    desc: 'Full administrative access, override engine, team provisioning & ML calibration.',
  },
  {
    persona: {
      name: 'Rajesh Verma',
      role: 'Senior Dispute Investigator',
      email: 'rajesh.verma@verdictai-bank.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      userId: 'usr_rajesh_01',
    },
    targetScreen: 'case-queue',
    badge: 'DISPUTE INVESTIGATOR',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    desc: 'Analyst case triage queue, multi-modal evidence review & NLP verification.',
  },
  {
    persona: {
      name: 'Amit Patel',
      role: 'Store Operations Manager',
      email: 'amit.patel@croma.infiniti.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
      userId: 'usr_amit_01',
    },
    targetScreen: 'merchant-portal',
    badge: 'STORE OPERATIONS (MERCHANT)',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    desc: 'Merchant chargeback rebuttal console, 48h SLA timer, receipt & invoice upload.',
  },
  {
    persona: {
      name: 'Pooja Iyer',
      role: 'Cardholder (Customer)',
      email: 'pooja.iyer@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      userId: 'usr_pooja_01',
    },
    targetScreen: 'cardholder-portal',
    badge: 'CONSUMER CARDHOLDER',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    desc: 'Consumer claim initiation, real-time SLA status tracker & Gemini XAI plain rationale.',
  },
];

type AuthTab = 'signin' | 'merchant-signup' | 'cardholder-signup';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onNavigateToForgotPassword,
  onAddToast,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');

  // Sign In form state
  const [email, setEmail] = useState('priya.sharma@verdictai-bank.com');
  const [password, setPassword] = useState('VerdictAI@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'merchant' | 'cardholder'>('admin');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Merchant Signup form state
  const [merchantForm, setMerchantForm] = useState({
    businessName: 'Tata Croma Infiniti Retail',
    managerName: 'Amit Patel',
    email: 'ops@croma.com',
    password: 'VerdictAI@2026',
    taxId: '27AAACL3045K1Z3',
    mcc: '5732 - Electronic Sales',
  });

  // Cardholder Signup form state
  const [cardholderForm, setCardholderForm] = useState({
    fullName: 'Pooja Iyer',
    email: 'pooja.iyer@gmail.com',
    password: 'VerdictAI@2026',
    phone: '+91 98765 43210',
    cardType: 'HDFC RuPay Platinum Debit (•••• 4012)',
  });

  const handleCustomSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const emailClean = email.trim();
    const pwdClean = password.trim();

    if (!emailClean) {
      setLoginError('Please enter your registered email address.');
      onAddToast?.({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter your registered email address.',
      });
      return;
    }

    if (!pwdClean) {
      setLoginError('Please enter your password.');
      onAddToast?.({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter your password.',
      });
      return;
    }

    setIsAuthenticating(true);

    try {
      // Real backend credential verification against POST /api/v1/auth/login
      const res = await authenticateUser(emailClean, pwdClean);

      if (!res.data || res.error) {
        const errorMsg = res.error || 'Invalid email or password. Please verify your credentials.';
        setLoginError(errorMsg);
        onAddToast?.({
          type: 'error',
          title: 'Authentication Failed',
          message: errorMsg,
        });
        setIsAuthenticating(false);
        // STRICT BLOCK - DO NOT PROCEED IF CREDENTIALS DO NOT MATCH
        return;
      }

      const userPersona = res.data.user;
      let targetScreen: ScreenId = 'dashboard';
      const r = (userPersona.role || '').toLowerCase();
      if (r.includes('admin')) {
        targetScreen = 'dashboard';
      } else if (r.includes('investigator')) {
        targetScreen = 'case-queue';
      } else if (r.includes('merchant') || r.includes('store')) {
        targetScreen = 'merchant-portal';
      } else {
        targetScreen = 'cardholder-portal';
      }

      onLogin(userPersona, targetScreen);
      onAddToast?.({
        type: 'success',
        title: 'Authentication Successful',
        message: `Signed in as ${userPersona.name} (${userPersona.role})`,
      });
    } catch (err: any) {
      const msg = err?.message || 'Authentication error. Please verify your credentials.';
      setLoginError(msg);
      onAddToast?.({
        type: 'error',
        title: 'Sign In Failed',
        message: msg,
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleMerchantRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsAuthenticating(true);

    try {
      const res = await registerMerchantWeb({
        businessName: merchantForm.businessName,
        managerName: merchantForm.managerName,
        email: merchantForm.email,
        taxId: merchantForm.taxId,
        mcc: merchantForm.mcc,
        password: merchantForm.password
      });

      if (!res.data || res.error) {
        onAddToast?.({
          type: 'error',
          title: 'Onboarding Failed',
          message: res.error || 'Could not register merchant profile.',
        });
        setIsAuthenticating(false);
        return;
      }

      onAddToast?.({
        type: 'success',
        title: 'Merchant Onboarded',
        message: `${merchantForm.businessName} successfully registered. Password configured.`,
      });
      onLogin(res.data.user, 'merchant-portal');
    } catch (err: any) {
      onAddToast?.({
        type: 'error',
        title: 'Registration Error',
        message: err?.message || 'Failed to complete merchant onboarding.',
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCardholderRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsAuthenticating(true);

    try {
      const res = await registerCardholderWeb({
        fullName: cardholderForm.fullName,
        email: cardholderForm.email,
        phone: cardholderForm.phone,
        cardType: cardholderForm.cardType,
        password: cardholderForm.password
      });

      if (!res.data || res.error) {
        onAddToast?.({
          type: 'error',
          title: 'Registration Failed',
          message: res.error || 'Could not create cardholder account.',
        });
        setIsAuthenticating(false);
        return;
      }

      onAddToast?.({
        type: 'success',
        title: 'Cardholder Account Created',
        message: `Welcome, ${cardholderForm.fullName}! Mobile number verified.`,
      });
      onLogin(res.data.user, 'cardholder-portal');
    } catch (err: any) {
      onAddToast?.({
        type: 'error',
        title: 'Registration Error',
        message: err?.message || 'Failed to complete registration.',
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-between text-slate-100 p-4 md:p-8">
      {/* Top Brand Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              VerdictAI
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Gateway v1.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">Autonomous Frictionless Dispute & Chargeback Resolution</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Zero-Trust Enterprise RBAC</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-6xl w-full mx-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Quick Persona Switcher (For Demo & Jury Evaluation) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">
                  Quick Access
                </span>
                <h2 className="text-base font-bold text-white mt-1">1-Click Live Demo Personas</h2>
              </div>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-xs text-slate-400">
              Select any pre-configured enterprise role to instantly enter its dedicated portal workspace:
            </p>

            <div className="space-y-2.5 pt-1">
              {DEMO_PERSONAS.map((item) => (
                <button
                  key={item.persona.name}
                  onClick={() => {
                    onLogin(item.persona, item.targetScreen);
                    onAddToast?.({
                      type: 'success',
                      title: 'Role Activated',
                      message: `Entering ${item.badge} as ${item.persona.name}`,
                    });
                  }}
                  className="w-full text-left p-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/60 transition group flex items-start gap-3.5 shadow-sm"
                >
                  <img
                    src={item.persona.avatar}
                    alt={item.persona.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-700 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white group-hover:text-blue-400 transition truncate">
                        {item.persona.name}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${item.badgeColor}`}>
                        {item.persona.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                      {item.desc}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 shrink-0 mt-3 group-hover:translate-x-0.5 transition" />
                </button>
              ))}
            </div>
          </div>

          {/* Admin Policy Notice */}
          <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-900/40 flex items-start gap-3 text-xs text-slate-300">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-200">Enterprise Admin Access Control</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Admins and Dispute Investigators cannot self-register through public forms. They must be provisioned internally by an authorized <strong>Head Admin</strong> via the Admin Console.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication & Registration Forms */}
        <div className="lg:col-span-7 bg-white text-slate-800 rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 gap-2">
            <button
              onClick={() => setActiveTab('signin')}
              className={`pb-3 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 border-b-2 -mb-px ${
                activeTab === 'signin'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              Sign In (WEB-01)
            </button>
            <button
              onClick={() => setActiveTab('merchant-signup')}
              className={`pb-3 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 border-b-2 -mb-px ${
                activeTab === 'merchant-signup'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Store className="w-4 h-4" />
              Merchant Onboarding
            </button>
            <button
              onClick={() => setActiveTab('cardholder-signup')}
              className={`pb-3 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 border-b-2 -mb-px ${
                activeTab === 'cardholder-signup'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              Cardholder Sign Up
            </button>
          </div>

          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <form onSubmit={handleCustomSignIn} className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  WEB-01: SECURE AUTHENTICATION
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Sign in to VerdictAI Console</h3>
                <p className="text-xs text-slate-500">Enter your enterprise email and credentials to enter your role-scoped environment.</p>
              </div>

              {/* Login Error Alert Banner */}
              {loginError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-800">Authentication Rejected</p>
                    <p className="text-[11px] text-rose-600 mt-0.5">{loginError}</p>
                  </div>
                </div>
              )}

              {/* Role Selection Radio Pill */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Target Role Scope</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('admin');
                      setEmail('priya.sharma@verdictai-bank.com');
                      setPassword('VerdictAI@2026');
                      setLoginError(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-center ${
                      selectedRole === 'admin'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Bank Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('merchant');
                      setEmail('amit.patel@croma.infiniti.com');
                      setPassword('VerdictAI@2026');
                      setLoginError(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-center ${
                      selectedRole === 'merchant'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Merchant
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('cardholder');
                      setEmail('pooja.iyer@gmail.com');
                      setPassword('VerdictAI@2026');
                      setLoginError(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-center ${
                      selectedRole === 'cardholder'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Cardholder
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="name@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={onNavigateToForgotPassword}
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Forgot Password? (WEB-02)
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="Enter password..."
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enterprise credentials password: <code className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">VerdictAI@2026</code>
                </p>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className={`w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 mt-2 ${
                  isAuthenticating ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Authorize & Enter Environment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: MERCHANT ONBOARDING */}
          {activeTab === 'merchant-signup' && (
            <form onSubmit={handleMerchantRegister} className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  B2B COMMERCIAL ONBOARDING
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Register Merchant Business Account</h3>
                <p className="text-xs text-slate-500">
                  Integrate your retail store or e-commerce gateway to upload counter-proofs within the 48-hour SLA.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Legal Business Entity Name</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={merchantForm.businessName}
                      onChange={(e) => setMerchantForm({ ...merchantForm, businessName: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Store / Ops Manager Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={merchantForm.managerName}
                      onChange={(e) => setMerchantForm({ ...merchantForm, managerName: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Official Merchant Work Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={merchantForm.email}
                      onChange={(e) => setMerchantForm({ ...merchantForm, email: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">GSTIN / Business Tax ID</label>
                  <input
                    type="text"
                    required
                    value={merchantForm.taxId}
                    onChange={(e) => setMerchantForm({ ...merchantForm, taxId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Merchant Category Code (MCC)</label>
                  <select
                    value={merchantForm.mcc}
                    onChange={(e) => setMerchantForm({ ...merchantForm, mcc: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value="5732 - Electronic Sales">5732 - Electronic Sales & Appliances</option>
                    <option value="5411 - Grocery Stores & Supermarkets">5411 - Grocery Stores & Supermarkets</option>
                    <option value="5651 - Family Clothing Stores">5651 - Family Clothing Stores</option>
                    <option value="7011 - Hotels & Lodging">7011 - Hotels & Lodging</option>
                    <option value="4816 - Computer Network / Information Services">4816 - Computer Network / Information Services</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Create Merchant Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={merchantForm.password}
                      onChange={(e) => setMerchantForm({ ...merchantForm, password: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      placeholder="Min 6 characters"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className={`w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 mt-2 ${
                  isAuthenticating ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering Merchant Account...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Merchant Onboarding & Enter Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: CARDHOLDER SIGN UP */}
          {activeTab === 'cardholder-signup' && (
            <form onSubmit={handleCardholderRegister} className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  CONSUMER SELF-SERVICE PORTAL
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Register Cardholder Account</h3>
                <p className="text-xs text-slate-500">
                  Track settled transactions, dispute unrecognized merchant charges, and track AI refunds in real time.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Full Legal Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={cardholderForm.fullName}
                    onChange={(e) => setCardholderForm({ ...cardholderForm, fullName: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={cardholderForm.email}
                      onChange={(e) => setCardholderForm({ ...cardholderForm, email: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Registered Mobile Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={cardholderForm.phone}
                      onChange={(e) => setCardholderForm({ ...cardholderForm, phone: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Primary Bank Card / Account Link</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={cardholderForm.cardType}
                      onChange={(e) => setCardholderForm({ ...cardholderForm, cardType: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Create Account Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={cardholderForm.password}
                      onChange={(e) => setCardholderForm({ ...cardholderForm, password: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      placeholder="Min 6 characters"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className={`w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 mt-2 ${
                  isAuthenticating ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Cardholder Account...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Enter Cardholder Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="max-w-6xl w-full mx-auto pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>&copy; 2026 VerdictAI Enterprise Utility &bull; Legal Compliance &bull; Data Privacy Policy</p>
        <p className="font-mono text-[11px]">Reporting Node: AP-SOUTH-1 (Mumbai) &bull; v4.2.1-STABLE</p>
      </div>
    </div>
  );
};
