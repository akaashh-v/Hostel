import React from 'react';
import {
  LayoutDashboard,
  ClipboardCheck,
  UtensilsCrossed,
  Users,
  ReceiptIndianRupee,
  CreditCard,
  FileBarChart,
  QrCode,
  Settings,
  Shield,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type AdminTab =
  | 'overview'
  | 'students'
  | 'menu'
  | 'collections'
  | 'billing'
  | 'payments'
  | 'reports'
  | 'qr-code'
  | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onSelectTab }) => {
  const { logout } = useAuth();

  const navItems: { id: AdminTab; label: string; icon: any; badge?: string }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Student Management', icon: Users },
    { id: 'menu', label: 'Menu Management', icon: UtensilsCrossed },
    { id: 'collections', label: 'Food Collections', icon: ClipboardCheck },
    { id: 'billing', label: 'Monthly Billing', icon: ReceiptIndianRupee },
    { id: 'payments', label: 'Payment Management', icon: CreditCard },
    { id: 'reports', label: 'Reports & Analytics', icon: FileBarChart },
    { id: 'qr-code', label: 'QR Code Poster', icon: QrCode },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col h-[calc(100vh-4rem)] sticky top-16 select-none shrink-0">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-950 rounded-xl text-xs font-bold border border-emerald-100">
          <Shield className="w-4 h-4 text-[#0D9488]" />
          <span>HOSTEL MESS Admin</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#0D9488] text-white shadow-md shadow-[#0D9488]/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-emerald-500/30 text-emerald-200' : 'bg-red-100 text-red-600 animate-pulse'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <div>
          <p className="font-bold text-slate-800">HOSTEL MESS Portal</p>
          <p className="text-[10px] text-slate-400">Production v2.4 • Secure Session</p>
        </div>
        <button
          onClick={logout}
          title="Logout"
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
