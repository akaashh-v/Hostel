import React, { useState } from 'react';
import {
  Utensils,
  Lock,
  Phone,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  HelpCircle,
  CheckCircle2,
  Shield,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const StudentAuth: React.FC = () => {
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  const { studentLogin, setActivePortal } = useAuth();
  const { error: toastError } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone) {
      const msg = 'Please enter your registered phone number.';
      setErrorMessage(msg);
      toastError(msg);
      return;
    }

    if (cleanPhone.length < 7) {
      const msg = 'Please enter a valid phone number.';
      setErrorMessage(msg);
      toastError(msg);
      return;
    }

    if (!password) {
      const msg = 'Please enter your password.';
      setErrorMessage(msg);
      toastError(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await studentLogin(cleanPhone, password);
      if (!success) {
        setErrorMessage('Invalid phone number or password. Please verify your credentials.');
      }
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please check your credentials.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoStudent = () => {
    setPhone('9876543210');
    setPassword('Student@123');
    setErrorMessage('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 bg-[#F7FAFA]">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
        {/* Subtle decorative background ambient glow */}
        <div className="absolute -right-16 -top-16 w-36 h-36 bg-[#0D9488]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-[#0D9488]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Branding & Header */}
        <div className="relative text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-[#0D9488]/25"
            style={{ backgroundColor: '#0D9488' }}
          >
            <Utensils className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">HOSTEL MESS</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Student Portal • Scheduled daily meals & food collection
          </p>
        </div>

        {/* Login Security Badge */}
        <div className="mb-6 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900 flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-[#0D9488] shrink-0" />
          <span className="font-semibold text-[11px] leading-tight">
            Official Student Dining Access • Verified Counter Logins
          </span>
        </div>

        {/* Inline Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* STUDENT LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                autoComplete="tel"
                placeholder="Registered phone number (e.g. 9876543210)"
                value={phone}
                onChange={e => {
                  setPhone(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent text-sm bg-slate-50/60 font-mono text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent text-sm bg-slate-50/60 text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-0.5">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-xs text-slate-500 hover:text-[#0D9488] font-medium transition-colors focus:outline-none"
            >
              Forgot Password?
            </button>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: '#0D9488', color: '#FFFFFF' }}
              className="w-full h-[50px] min-h-[50px] rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-sm tracking-wider uppercase shadow-lg shadow-[#0D9488]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-white" />
                  <span>LOGIN</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-center text-center">
            <button
              type="button"
              onClick={fillDemoStudent}
              className="text-xs text-[#0D9488] hover:text-[#0F766E] font-semibold underline underline-offset-4 focus:outline-none transition-colors"
            >
              Autofill Demo Student Credentials
            </button>
            <span className="text-[11px] text-slate-400 mt-1 font-mono">
              Phone: 9876543210 • Pass: Student@123
            </span>
          </div>
        </form>

        {/* Admin Portal Switcher */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Hostel warden or manager?{' '}
            <button
              type="button"
              onClick={() => setActivePortal('admin')}
              className="font-bold text-[#0D9488] hover:underline"
            >
              Admin Portal
            </button>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3 border border-amber-200">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Forgot Your Password?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Student accounts are managed centrally by the hostel administration. Please visit the <strong>Mess Warden Office</strong> or contact the administrator to reset your password or verify your room assignment.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-left text-[11px] space-y-1 text-slate-600">
              <p>📍 <strong>Mess Office:</strong> Block-B, Ground Floor</p>
              <p>⏰ <strong>Office Hours:</strong> 8:00 AM – 8:00 PM</p>
              <p>📞 <strong>Helpline:</strong> +91 98765 00000</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
