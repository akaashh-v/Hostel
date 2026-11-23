import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Clock, Filter, Utensils, ChevronDown } from 'lucide-react';
import { FoodCollection } from '../../types';
import { api } from '../../services/api';

export const StudentHistory: React.FC = () => {
  const [collections, setCollections] = useState<FoodCollection[]>([]);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const data = await api.getMyCollections(month, year);
        setCollections(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [month, year]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Food Collection History</h1>
          <p className="text-xs text-slate-500 mt-0.5">Verified record of all meals collected at the mess counter</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            {months.map((m, idx) => (
              <option key={m} value={idx + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'].map(mealType => {
          const count = collections.filter(c => c.meal_type === mealType).length;
          return (
            <div key={mealType} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{mealType}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{count}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Collected this month</p>
            </div>
          );
        })}
      </div>

      {/* Collections Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900">Verified Collections ({collections.length})</h2>
          <span className="text-xs text-emerald-700 font-medium">QR Timestamped</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading collection log...</div>
        ) : collections.length === 0 ? (
          <div className="p-12 text-center">
            <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No collections found</p>
            <p className="text-xs text-slate-400 mt-1">No meals were marked as collected during this month.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {collections.map(item => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{item.meal_type}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        CONFIRMED
                      </span>
                    </div>
                    {item.food_items_snapshot && item.food_items_snapshot.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        {item.food_items_snapshot.join(' • ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-500 pl-12 sm:pl-0">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.collection_date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(item.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
