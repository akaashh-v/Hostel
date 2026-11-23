import React, { useState, useEffect } from 'react';
import {
  Users,
  Utensils,
  ReceiptIndianRupee,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  Sparkles,
  Clock,
  CheckCircle2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { AdminTab } from '../../components/AdminSidebar';

interface AdminDashboardProps {
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { subscribe } = useRealtime();
  const [summary, setSummary] = useState<any>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [sumRes, billsRes, studentsRes] = await Promise.all([
        api.getCollectionsSummary(),
        api.getMonthlyBills(),
        api.getStudents()
      ]);
      setSummary(sumRes);
      setBills(billsRes || []);
      setStudents(studentsRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribe(e => {
      if (e.type === 'COLLECTION_MARKED' || e.type === 'BILL_UPDATED' || e.type === 'MENU_UPDATED') {
        loadData();
      }
    });
    return () => unsub();
  }, [subscribe]);

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#087F5B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading mess analytics...</p>
      </div>
    );
  }

  // Key figures
  const totalStudents = students.length;
  const activeStudentsCount = students.filter(s => s.status === 'ACTIVE').length;
  const todayCollections = summary?.total_collections_today || 0;
  const monthlyCollections = summary?.monthly_collections || 0;
  const totalRevenue = bills.reduce((acc, b) => acc + (b.paid_amount || 0), 0);
  const totalPending = bills.reduce((acc, b) => acc + (b.balance_amount || 0), 0);

  // Meal-wise collection statistics for bar chart
  const mealDistributionData = summary?.meals
    ? summary.meals.map((m: any) => ({
      name: m.name,
      collections: m.collected_count,
      uncollected: Math.max(0, m.total_students - m.collected_count)
    }))
    : [];

  const revenuePieData = [
    { name: 'Collected Revenue', value: totalRevenue, color: '#087F5B' },
    { name: 'Pending Balance', value: totalPending, color: '#EF4444' }
  ];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hostel Mess Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational overview for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('menu')}
            style={{ backgroundColor: '#0D9488', color: '#FFFFFF' }}
            className="px-4 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-md shadow-[#0D9488]/20"
          >
            <Utensils className="w-4 h-4" />
            <span>Manage Daily Menu</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Students */}
        <div
          onClick={() => onNavigateTab('students')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Students</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{totalStudents}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>{activeStudentsCount} active</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#087F5B] transition-colors" />
          </div>
        </div>

        {/* 2. Today's Collections */}
        <div
          onClick={() => onNavigateTab('collections')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Meals</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{todayCollections}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Logged today</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#087F5B] transition-colors" />
          </div>
        </div>

        {/* 3. Monthly Collections */}
        <div
          onClick={() => onNavigateTab('collections')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Count</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{monthlyCollections}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>This month</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#087F5B] transition-colors" />
          </div>
        </div>

        {/* 4. Monthly Revenue */}
        <div
          onClick={() => onNavigateTab('billing')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#087F5B] flex items-center justify-center">
              <ReceiptIndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#087F5B] mt-2 font-mono">
            ₹{totalRevenue.toFixed(0)}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Collected fees</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#087F5B] transition-colors" />
          </div>
        </div>

        {/* 5. Pending Payments */}
        <div
          onClick={() => onNavigateTab('billing')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Dues</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-red-600 mt-2 font-mono">
            ₹{totalPending.toFixed(0)}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Outstanding</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#087F5B] transition-colors" />
          </div>
        </div>
      </div>

      {/* Visual Charts: Meal-Wise Collections & Revenue Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meal-Wise Collection Statistics Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-base text-slate-900">Meal-Wise Collection Statistics</h2>
              <p className="text-xs text-slate-500">Total plates collected across daily dining sessions</p>
            </div>
            <span className="text-xs font-bold text-[#087F5B] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Today's Log
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mealDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} students`, 'Collected']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="collections" fill="#087F5B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Status Pie Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-base text-slate-900 mb-1">Billing Reconciliation</h2>
            <p className="text-xs text-slate-500 mb-4">Collected revenue vs outstanding balance</p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenuePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {revenuePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`₹${val.toFixed(2)}`, '']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#087F5B]" />
                  <span>Collected:</span>
                </span>
                <span className="font-bold text-[#087F5B] font-mono">₹{totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>Pending Dues:</span>
                </span>
                <span className="font-bold text-red-600 font-mono">₹{totalPending.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('billing')}
            className="mt-4 w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors text-center"
          >
            Open Billing Ledger
          </button>
        </div>
      </div>

      {/* Daily Scheduled Meals Status Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-slate-900">Today's Meal Headcount Breakdown</h2>
            <p className="text-xs text-slate-500">Collected plates vs pending student counts</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Daily Schedule</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Meal Session</th>
                <th className="py-3 px-4">Timing</th>
                <th className="py-3 px-4 text-center">Collected Plates</th>
                <th className="py-3 px-4 text-center">Pending Students</th>
                <th className="py-3 px-4 text-center">Attendance %</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {summary?.meals?.map((meal: any) => {
                const total = meal.total_students || 1;
                const collected = meal.collected_count || 0;
                const uncollected = Math.max(0, total - collected);
                const percent = Math.round((collected / total) * 100);

                return (
                  <tr key={meal.meal_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{meal.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {meal.start_time} - {meal.end_time}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700">
                      {collected}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500">
                      {uncollected}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#087F5B] h-full rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold">{percent}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onNavigateTab('collections')}
                        className="text-xs font-semibold text-[#087F5B] hover:text-[#066749] underline"
                      >
                        View Students
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
