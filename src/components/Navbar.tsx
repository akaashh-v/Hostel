import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Shield,
  LogOut,
  Clock,
  User,
  Sparkles,
  ChevronDown,
  Bell,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

export const Navbar: React.FC = () => {
  const { student, admin, activePortal, setActivePortal, logout } = useAuth();
  const { subscribe } = useRealtime();
  const [time, setTime] = useState<string>('');
  const [notifications, setNotifications] = useState<
    { id: string; student_name: string; food_name: string; time: string; timestamp: string }[]
  >([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!admin) return;

    const unsub = subscribe(e => {
      if (e.type === 'COLLECTION_MARKED') {
        const studentName = e.data?.student_name || 'Student';
        const foodName =
          e.data?.food_item_name ||
          (e.data?.food_items_snapshot && e.data.food_items_snapshot[0]) ||
          e.data?.meal_type ||
          'Food';
        const now = new Date();
        const newNotif = {
          id: String(Date.now()) + Math.random().toString(36).substring(2, 5),
          student_name: studentName,
          food_name: foodName,
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: now.toISOString()
        };
        setNotifications(prev => [newNotif, ...prev.slice(0, 19)]);
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => unsub();
  }, [admin, subscribe]);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[4.25rem]">
          {/* Logo & Hostel Name */}
          <div className="flex items-center gap-3.5 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#134E4A] via-[#0D9488] to-[#10b981] flex items-center justify-center text-white shadow-lg shadow-[#0D9488]/25 group-hover:scale-105 transition-transform duration-300">
                <Utensils className="w-5 h-5 text-emerald-100" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-400 border-2 border-white rounded-full flex items-center justify-center text-[7px] font-black text-amber-950">
                ★
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-none group-hover:text-[#0D9488] transition-colors">
                  HOSTEL MESS
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-[#0D9488] border border-emerald-200/80">
                  Hostel Dining
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-tight mt-1">
                Pure, Hygienic & Scheduled Food Collection
              </p>
            </div>
          </div>

          {/* Center Info: Live Clock with pulsating green status indicator */}
          <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-50 border border-slate-200/80 text-slate-700 text-xs shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-800">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className="text-slate-300 font-light">|</span>
            <span className="font-mono font-bold text-[#0D9488]">{time}</span>
          </div>

          {/* Right Actions & Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Portal Switcher for Admin */}
            {admin && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setActivePortal('student')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activePortal === 'student'
                      ? 'bg-white shadow text-slate-900 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Student View
                </button>
                <button
                  onClick={() => setActivePortal('admin')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activePortal === 'admin'
                      ? 'bg-[#0D9488] shadow-md shadow-[#0D9488]/20 text-white font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admin Portal
                </button>
              </div>
            )}

            {/* Student User Profile Badge */}
            {student && (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200/80">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-100 to-teal-50 border border-emerald-200 flex items-center justify-center font-black text-xs text-[#0D9488] shadow-sm">
                  {student.full_name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-bold text-slate-900 block leading-tight">
                    {student.full_name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block leading-tight">
                    {student.room_number || student.phone_number}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Live Notification Bell for Admin */}
            {admin && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) setUnreadCount(0);
                  }}
                  title="Live Food Collection Notifications"
                  className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white animate-bounce">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Live Collections ({notifications.length})
                        </h4>
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => {
                            setNotifications([]);
                            setUnreadCount(0);
                          }}
                          className="text-[10px] text-slate-400 hover:text-red-600 font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No food collected yet. New collections will appear here instantly.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-800 font-medium">
                                <strong className="font-bold text-slate-900">{n.student_name}</strong> has collected{' '}
                                <span className="font-semibold text-emerald-800">{n.food_name}</span>
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{n.time}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Admin Profile Badge */}
            {admin && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200/80">
                <div className="w-9 h-9 rounded-xl bg-emerald-950 text-white flex items-center justify-center font-black text-xs shadow-sm">
                  <Shield className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-bold text-slate-900 block leading-tight">
                    {admin.full_name}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block leading-tight">
                    Mess Warden
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Logout Admin"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
