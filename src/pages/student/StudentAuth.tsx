import React, { useState } from 'react';
import {
  Utensils,
  Lock,
  Phone,
  User,
  LogIn,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  HelpCircle,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const StudentAuth: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  const { studentLogin, studentRegister, setActivePortal } = useAuth();
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || fullName.trim().length < 2) {
      const msg = 'Please enter your full name (minimum 2 characters).';
      setErrorMessage(msg);
      toastError(msg);
      return;
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      const msg = 'Please enter a valid 10-digit phone number.';
      setErrorMessage(msg);
      toastError(msg);
      return;
    }

    if (!password || password.trim().length < 4) {
      const msg = 'Password must be at least 4 characters long.';
      setErrorMessage(msg);
      toastError(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await studentRegister(fullName.trim(), cleanPhone, password.trim());
      if (!success) {
        setErrorMessage('Registration failed. A student with this phone number may already exist.');
      }
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please check your details.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 bg-[#F7FAFA]">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
        {/* Subtle decorative background ambient glow */}
        <div className="absolute -right-16 -top-16 w-36 h-36 bg-[#0D9488]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-[#0D9488]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Branding & Header */}
        <div className="relative text-center mb-6">
          <div className="w-16 h-16 rounded-full mx-auto mb-3.5 shadow-lg border-2 border-amber-400 overflow-hidden bg-black flex items-center justify-center">
            <img
              src="/tastebox-logo.jpg"
              alt="Tastebox Meals Co."
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">TASTEBOX</h2>
          <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-50 text-amber-800 border border-amber-300">
            MEALS CO.
          </span>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">
            Student Portal • Scheduled daily meals & food collection
          </p>
        </div>

        {/* Mode Selector Tabs: Login vs Create Account */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              authMode === 'login'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              authMode === 'register'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Login Security Badge */}
        <div className="mb-5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900 flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-[#0D9488] shrink-0" />
          <span className="font-semibold text-[11px] leading-tight">
            {authMode === 'login'
              ? 'Official Student Dining Access • Verified Counter Logins'
              : 'New Student Registration • Instant Access to Dining Schedule'}
          </span>
        </div>

        {/* Inline Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* LOGIN FORM */}
        {authMode === 'login' ? (
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
                  placeholder="Enter your registered 10-digit phone number"
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
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-slate-500 hover:text-[#0D9488] font-medium transition-colors focus:outline-none cursor-pointer"
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

            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMessage('');
                  }}
                  className="font-bold text-[#0D9488] hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </p>
            </div>
          </form>
        ) : (
          /* CREATE ACCOUNT FORM */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Student Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={e => {
                    setFullName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent text-sm bg-slate-50/60 text-slate-900"
                />
              </div>
            </div>

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
                  placeholder="Enter your 10-digit phone number"
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
                  autoComplete="new-password"
                  placeholder="Create a password (min. 4 characters)"
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
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: '#0D9488', color: '#FFFFFF' }}
                className="w-full h-[50px] min-h-[50px] rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-sm tracking-wider uppercase shadow-lg shadow-[#0D9488]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>CREATING ACCOUNT...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-white" />
                    <span>CREATE ACCOUNT</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage('');
                  }}
                  className="font-bold text-[#0D9488] hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        )}

        {/* Admin Portal Switcher */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Hostel warden or manager?{' '}
            <button
              type="button"
              onClick={() => setActivePortal('admin')}
              className="font-bold text-[#0D9488] hover:underline cursor-pointer"
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
              You can contact the <strong>Mess Warden Office</strong> or administrator to reset your password or verify your registered phone number.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-left text-[11px] space-y-1 text-slate-600">
              <p>📍 <strong>Mess Office:</strong> Block-B, Ground Floor</p>
              <p>⏰ <strong>Office Hours:</strong> 8:00 AM – 8:00 PM</p>
              <p>📞 <strong>Helpline:</strong> +91 98765 00000</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
