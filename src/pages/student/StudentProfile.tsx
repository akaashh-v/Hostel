import React, { useState } from 'react';
import { User, Phone, Shield, Lock, LogOut, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export const StudentProfile: React.FC = () => {
  const { student, logout } = useAuth();
  const { success, error } = useToast();
  const [newPassword, setNewPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.trim().length < 4) {
      error('Password should be at least 4 characters long');
      return;
    }
    setIsUpdating(true);
    try {
      const res = await api.updateStudentPassword(newPassword.trim());
      setNewPassword('');
      success(res.message || 'Password updated successfully');
    } catch (err: any) {
      error(err.message || 'Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Student Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage your account information and authentication credentials</p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-2xl border border-emerald-300">
            {student?.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{student?.full_name}</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Phone: {student?.phone_number}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Active Student
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ID: {student?.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>

        {/* Details List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-slate-100 text-xs">
          <div>
            <p className="text-slate-400 uppercase font-semibold text-[10px]">Registered Phone</p>
            <p className="text-slate-800 font-semibold text-sm mt-0.5 font-mono">{student?.phone_number}</p>
          </div>
          <div>
            <p className="text-slate-400 uppercase font-semibold text-[10px]">Registered On</p>
            <p className="text-slate-800 font-semibold text-sm mt-0.5">
              {student?.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 uppercase font-semibold text-[10px]">Dining Hall</p>
            <p className="text-slate-800 font-semibold text-sm mt-0.5">TASTEBOX MEALS CO. Dining Hall</p>
          </div>
          <div>
            <p className="text-slate-400 uppercase font-semibold text-[10px]">Authentication Status</p>
            <p className="text-slate-800 font-semibold text-sm mt-0.5">Active Student Session</p>
          </div>
        </div>

        {/* Change Password */}
        <form onSubmit={handleUpdatePassword} className="pt-6">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#0D9488]" />
            <span>Update Password</span>
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Change your account password below. You can toggle the eye icon to view your input.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password (min. 4 characters)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488] bg-slate-50/50 text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#0D9488]/20 disabled:opacity-50 cursor-pointer"
            >
              {isUpdating ? 'Saving...' : 'Save Password'}
            </button>
          </div>
        </form>

        {/* Logout */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">Sign out of this device?</p>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
