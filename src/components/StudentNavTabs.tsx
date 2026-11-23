import React from 'react';
import { Utensils, History, Receipt } from 'lucide-react';

export type StudentTab = 'collect' | 'history' | 'bill';

interface Props {
  currentTab: StudentTab;
  onSelectTab: (tab: StudentTab) => void;
}

export const StudentNavTabs: React.FC<Props> = ({ currentTab, onSelectTab }) => {
  const tabs: Array<{ id: StudentTab; label: string; icon: React.ReactNode }> = [
    { id: 'collect', label: 'Food Collection Counter', icon: <Utensils className="w-4 h-4" /> },
    { id: 'history', label: 'My Meal History', icon: <History className="w-4 h-4" /> },
    { id: 'bill', label: 'Monthly Expense & Bill', icon: <Receipt className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white border-b border-slate-200/80 sticky top-16 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 overflow-x-auto py-2">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
