import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('Admin@123');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { adminLogin, setActivePortal } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminLogin(username, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F7FAFA]">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
        {/* Subtle decorative background blur */}
        <div className="absolute -right-16 -top-16 w-36 h-36 bg-[#0D9488]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#0D9488]/25"
            style={{ backgroundColor: '#0D9488' }}
          >
            <Shield className="w-7 h-7 text-emerald-200" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">HOSTEL MESS Admin</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Authorized warden and mess manager control portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
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
                type="password"
                required
                placeholder="Admin@123"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent text-sm bg-slate-50/60 text-slate-900"
              />
            </div>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-2xl text-xs text-emerald-950 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Initial Administrator Credentials</p>
              <p className="text-emerald-800 text-[11px] font-mono mt-0.5">
                Username: <strong>admin</strong> • Password: <strong>Admin@123</strong>
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ backgroundColor: '#0D9488', color: '#FFFFFF' }}
            className="w-full py-3 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-sm tracking-wider uppercase transition-all shadow-lg shadow-[#0D9488]/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>AUTHENTICATING...</span>
              </>
            ) : (
              <>
                <span>ENTER ADMIN CONSOLE</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setActivePortal('student')}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            Are you a student? <span className="font-bold text-[#0D9488]">Go to Student Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
