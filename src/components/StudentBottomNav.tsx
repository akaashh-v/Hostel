import React from 'react';
import { Home, UtensilsCrossed, History, ReceiptIndianRupee, User } from 'lucide-react';

export type StudentTab = 'dashboard' | 'menu' | 'history' | 'bill' | 'profile';

interface StudentBottomNavProps {
  activeTab: StudentTab;
  onSelectTab: (tab: StudentTab) => void;
}

export const StudentBottomNav: React.FC<StudentBottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'dashboard' as StudentTab, label: 'Today', icon: Home },
    { id: 'menu' as StudentTab, label: 'Menu', icon: UtensilsCrossed },
    { id: 'history' as StudentTab, label: 'History', icon: History },
    { id: 'bill' as StudentTab, label: 'My Bill', icon: ReceiptIndianRupee },
    { id: 'profile' as StudentTab, label: 'Profile', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? 'text-teal-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-teal-600/10 text-teal-600' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className="text-[11px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
