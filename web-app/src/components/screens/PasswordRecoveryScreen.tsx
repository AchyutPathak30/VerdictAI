import React, { useState } from 'react';
import { ShieldCheck, Mail, KeyRound, ArrowLeft, CheckCircle2, Send, Lock } from 'lucide-react';
import { ToastMessage } from '../common/Toast';

interface PasswordRecoveryScreenProps {
  onBackToLogin?: () => void;
  onAddToast?: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const PasswordRecoveryScreen: React.FC<PasswordRecoveryScreenProps> = ({
  onBackToLogin,
  onAddToast
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStep(2);
    onAddToast?.({ type: 'info', title: 'Reset Code Sent', message: `Verification OTP sent to ${email}` });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setStep(3);
    onAddToast?.({ type: 'success', title: 'OTP Verified', message: 'Set your new secure password.' });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    setSubmitted(true);
    onAddToast?.({ type: 'success', title: 'Password Updated', message: 'Your credentials have been securely updated.' });
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
          WEB-02: PASSWORD RECOVERY
        </span>
        <h1 className="text-xl font-bold text-slate-900">Credential Recovery</h1>
        <p className="text-xs text-slate-500">Multi-factor identity verification & password reset</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 border-b border-slate-100 pb-4">
        <span className={step >= 1 ? 'text-blue-600 font-bold' : ''}>1. Email</span>
        <span>&rarr;</span>
        <span className={step >= 2 ? 'text-blue-600 font-bold' : ''}>2. Verify OTP</span>
        <span>&rarr;</span>
        <span className={step >= 3 ? 'text-blue-600 font-bold' : ''}>3. Reset</span>
      </div>

      {submitted ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Password Reset Complete!</h2>
          <p className="text-xs text-slate-500">You can now sign in with your new credentials.</p>
          <button
            onClick={onBackToLogin}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
          >
            Return to Dashboard
          </button>
        </div>
      ) : step === 1 ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">Account Email or Operator ID</label>
            <div className="mt-1 relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@verdictai.com"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>Send Reset Code</span>
          </button>
        </form>
      ) : step === 2 ? (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">Enter 6-Digit OTP Verification Code</label>
            <div className="mt-1 relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="882910"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            Verify Code
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">New Password</label>
            <div className="mt-1 relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            Update Password
          </button>
        </form>
      )}

      {onBackToLogin && (
        <button
          onClick={onBackToLogin}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition pt-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>
      )}
    </div>
  );
};
