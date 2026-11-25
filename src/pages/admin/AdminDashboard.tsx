import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Utensils,
  Coffee,
  Sun,
  Sunset,
  Moon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Users,
  CreditCard,
  Sparkles,
  Filter,
  X,
  ArrowRight,
  ShieldCheck,
  ReceiptIndianRupee,
  Check
} from 'lucide-react';
import { Meal, FoodItem, FoodCollection, MealType } from '../../types';
import { api } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { useToast } from '../../context/ToastContext';
import { AdminTab } from '../../components/AdminSidebar';
import { getTodayDateString } from '../../utils/date';

interface AdminDashboardProps {
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { subscribe } = useRealtime();
  const { success, error } = useToast();

  const [todayMenu, setTodayMenu] = useState<{ meals: (Meal & { items: FoodItem[] })[] } | null>(null);
  const [collections, setCollections] = useState<FoodCollection[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters for collections section
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [isSettlingId, setIsSettlingId] = useState<string | null>(null);

  const paymentRegistryRef = useRef<HTMLDivElement>(null);

  const todayStr = getTodayDateString();

  const loadDashboardData = useCallback(async () => {
    try {
      const [menuData, collsData, summaryData] = await Promise.all([
        api.getTodayMenu(),
        api.getAllCollections({ date: todayStr }),
        api.getCollectionsSummary(todayStr)
      ]);
      setTodayMenu(menuData);
      setCollections(collsData || []);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  }, [todayStr]);

  const handleSettleCollection = async (collectionId: string, studentName: string) => {
    setIsSettlingId(collectionId);
    try {
      await api.payCollection({
        collection_id: collectionId,
        payment_method: 'CASH',
        reference_id: `ADMIN-CASH-${Date.now().toString().slice(-6)}`
      });
      success(`Payment confirmed and settled for ${studentName}!`);
      await loadDashboardData();
    } catch (err: any) {
      error(err.message || 'Failed to settle payment');
    } finally {
      setIsSettlingId(null);
    }
  };

  const scrollToPaymentRegistry = (filter: 'PAID' | 'PENDING') => {
    setPaymentFilter(filter);
    paymentRegistryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    loadDashboardData();

    const unsub = subscribe(e => {
      if (
        e.type === 'COLLECTION_MARKED' ||
        e.type === 'PAYMENT_RECORDED' ||
        e.type === 'MENU_UPDATED' ||
        e.type === 'NOTIFICATION_CREATED' ||
        e.type === 'STUDENT_CREATED' ||
        e.type === 'STUDENT_UPDATED' ||
        e.type === 'POLL_SYNC'
      ) {
        Promise.all([
          api.getTodayMenu(),
          api.getAllCollections({ date: todayStr }),
          api.getCollectionsSummary(todayStr)
        ]).then(([menuData, collsData, summaryData]) => {
          setTodayMenu(menuData);
          setCollections(collsData || []);
          setSummary(summaryData);
        }).catch(() => {});
      }
    });

    return () => unsub();
  }, [loadDashboardData, subscribe]);

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400 font-medium">Loading mess operations dashboard...</p>
      </div>
    );
  }

  // Count collections by meal category
  const breakfastCount = collections.filter(c => c.meal_type === 'BREAKFAST').length;
  const lunchCount = collections.filter(c => c.meal_type === 'LUNCH').length;
  const snacksCount = collections.filter(c => c.meal_type === 'SNACKS').length;
  const dinnerCount = collections.filter(c => c.meal_type === 'DINNER').length;
  const totalCollections = collections.length;

  // Real payment metrics
  const successfulCount = summary?.successful_payments_count ?? collections.filter(c => c.payment_status === 'PAID').length;
  const successfulAmount = summary?.successful_payments_amount ?? 0;
  const pendingCount = summary?.pending_payments_count ?? collections.filter(c => c.payment_status === 'PENDING' || !c.payment_status).length;
  const pendingAmount = summary?.pending_payments_amount ?? 0;
  const failedCount = summary?.failed_payments_count ?? collections.filter(c => c.payment_status === 'FAILED').length;

  // Filter collections
  const filteredCollections = collections.filter(c => {
    const matchesCategory = categoryFilter === 'ALL' || c.meal_type === categoryFilter;
    const matchesSearch =
      !searchQuery ||
      c.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.student_phone.includes(searchQuery) ||
      (c.food_item_name && c.food_item_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getMealVisuals = (mealType: string) => {
    switch (mealType) {
      case 'BREAKFAST':
        return {
          icon: Coffee,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          border: 'border-amber-200'
        };
      case 'LUNCH':
        return {
          icon: Sun,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200'
        };
      case 'SNACKS':
        return {
          icon: Sunset,
          color: 'text-rose-600',
          bg: 'bg-rose-50',
          border: 'border-rose-200'
        };
      case 'DINNER':
      default:
        return {
          icon: Moon,
          color: 'text-indigo-600',
          bg: 'bg-indigo-50',
          border: 'border-indigo-200'
        };
    }
  };

  const getPaymentStatusBadge = (status?: string) => {
    if (status === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          SUCCESSFUL
        </span>
      );
    }
    if (status === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          FAILED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        PENDING
      </span>
    );
  };

  const mealGroups: { type: MealType; title: string; count: number }[] = [
    { type: 'BREAKFAST', title: 'Breakfast Collections', count: breakfastCount },
    { type: 'LUNCH', title: 'Lunch Collections', count: lunchCount },
    { type: 'SNACKS', title: 'Evening Snacks Collections', count: snacksCount },
    { type: 'DINNER', title: 'Dinner Collections', count: dinnerCount }
  ];

  return (
    <div className="space-y-7 pb-16 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#0D9488] text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TASTEBOX MEALS CO. Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Warden & Admin Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Realtime visibility for today's food preparation, collections, and settlement records • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('menu')}
            className="px-4 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-[#0D9488]/20 cursor-pointer"
          >
            <Utensils className="w-4 h-4" />
            <span>Manage Daily Menu</span>
          </button>
        </div>
      </div>

      {/* 2. Top Collection Counts Row (Breakfast, Lunch, Snacks, Dinner, Total) - NO DUE SECTION */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Breakfast */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Breakfast</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">{breakfastCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Meals collected</span>
        </div>

        {/* Lunch */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lunch</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">{lunchCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Meals collected</span>
        </div>

        {/* Evening Snacks */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Evening Snacks</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Sunset className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">{snacksCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Snacks collected</span>
        </div>

        {/* Dinner */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dinner</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">{dinnerCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Meals collected</span>
        </div>

        {/* Total Collections Today */}
        <div className="bg-gradient-to-tr from-[#134E4A] to-[#0D9488] text-white rounded-2xl p-4 sm:p-5 shadow-md shadow-[#0D9488]/20 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Total Today</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2 font-mono">{totalCollections}</p>
          <span className="text-[11px] text-emerald-100 mt-1 block">Plates served today</span>
        </div>
      </div>

      {/* 3. Real Payment Settlement Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Successful Payments */}
        <div
          onClick={() => scrollToPaymentRegistry('PAID')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200/80 bg-emerald-50/20 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer group"
          title="Click to view paid students below"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider group-hover:underline flex items-center gap-1">
              <span>Successful Payments</span>
              <ArrowRight className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-800 font-mono">{successfulCount}</span>
            <span className="text-xs text-emerald-600 font-semibold">transactions</span>
          </div>
          <p className="text-xs font-black text-emerald-700 mt-1 font-mono">
            ₹{successfulAmount.toFixed(2)} collected
          </p>
        </div>

        {/* Pending Payments */}
        <div
          onClick={() => scrollToPaymentRegistry('PENDING')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/80 bg-amber-50/20 shadow-xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer group"
          title="Click to view students with pending payments"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider group-hover:underline flex items-center gap-1">
              <span>Pending Payments</span>
              <ArrowRight className="w-3 h-3 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-amber-800 font-mono">{pendingCount}</span>
            <span className="text-xs text-amber-600 font-semibold">awaiting settlement</span>
          </div>
          <p className="text-xs font-black text-amber-700 mt-1 font-mono">
            ₹{pendingAmount.toFixed(2)} pending
          </p>
        </div>

        {/* Failed Payments */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-200/80 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Failed Payments</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-rose-800 font-mono">{failedCount}</span>
            <span className="text-xs text-rose-600 font-semibold">failed records</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Requires student retry</p>
        </div>
      </div>

      {/* DEDICATED STUDENT PAYMENT REGISTRY: PAID VS PENDING */}
      <div ref={paymentRegistryRef} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ReceiptIndianRupee className="w-5 h-5 text-[#0D9488]" />
                <span>Student Payment Settlement Status (Today)</span>
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {collections.length} total collections
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status showing which students have paid and which students have payment pending for today's meals
            </p>
          </div>

          {/* Payment Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl shrink-0">
            <button
              type="button"
              onClick={() => setPaymentFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                paymentFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({collections.length})
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter('PAID')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                paymentFilter === 'PAID'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Paid ({successfulCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                paymentFilter === 'PENDING'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending ({pendingCount})</span>
            </button>
          </div>
        </div>

        {/* Collections filtered by payment status */}
        {(() => {
          const list = collections.filter(c => {
            if (paymentFilter === 'PAID') return c.payment_status === 'PAID';
            if (paymentFilter === 'PENDING') return c.payment_status === 'PENDING' || !c.payment_status;
            return true;
          });

          if (collections.length === 0) {
            return (
              <div className="py-8 text-center text-slate-400">
                <Utensils className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No food collections recorded yet today.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">When students collect food, their payment status will appear here immediately.</p>
              </div>
            );
          }

          if (list.length === 0) {
            return (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  {paymentFilter === 'PENDING'
                    ? 'All collected meals today have been fully paid! 🎉'
                    : 'No paid collections found for this filter.'}
                </p>
              </div>
            );
          }

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Meal Collected</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {list.map(c => {
                    const isPaid = c.payment_status === 'PAID';
                    const dateObj = new Date(c.collected_at);
                    const formattedTime = !isNaN(dateObj.getTime())
                      ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';
                    const dishName =
                      c.food_item_name ||
                      (c.food_items_snapshot && c.food_items_snapshot[0]) ||
                      c.meal_type;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {c.student_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-900">{c.student_name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{c.student_phone}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">{dishName}</span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {c.meal_type}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{formattedTime || 'Today'}</td>
                        <td className="py-3.5 px-4 font-mono font-black text-slate-900">₹{c.amount || 25}</td>
                        <td className="py-3.5 px-4">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              PAID (SUCCESSFUL)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              PAYMENT PENDING
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isPaid ? (
                            <span className="text-xs font-semibold text-emerald-600 flex items-center justify-end gap-1">
                              <Check className="w-3.5 h-3.5" />
                              Settled
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSettleCollection(c.id, c.student_name)}
                              disabled={isSettlingId === c.id}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 ml-auto cursor-pointer disabled:opacity-50"
                              title="Mark as paid if collected in cash or verified via UPI"
                            >
                              {isSettlingId === c.id ? (
                                <span>Saving...</span>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Mark as Paid</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* 4. TODAY'S MENU SECTION (4 Meal Sessions: Breakfast, Lunch, Evening Snacks, Dinner) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Utensils className="w-5 h-5 text-[#0D9488]" />
              <span>Today's Scheduled Dining Menu</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dishes actively prepared and available at the hostel dining counters for each meal session
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('menu')}
            className="text-xs font-bold text-[#0D9488] hover:text-[#0F766E] flex items-center gap-1 cursor-pointer"
          >
            <span>Edit dishes in Menu Management</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Meal Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {todayMenu?.meals?.map(meal => {
            const visual = getMealVisuals(meal.meal_type);
            const Icon = visual.icon;

            return (
              <div
                key={meal.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  {/* Session Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl ${visual.bg} ${visual.color} flex items-center justify-center border ${visual.border}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                          {meal.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {meal.start_time} - {meal.end_time}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                      {meal.items?.length || 0} items
                    </span>
                  </div>

                  {/* Dishes List */}
                  <div className="mt-3 space-y-2.5">
                    {meal.items && meal.items.length > 0 ? (
                      meal.items.map(dish => (
                        <div
                          key={dish.id}
                          className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-slate-100 shadow-2xs"
                        >
                          <img
                            src={dish.image_url}
                            alt={dish.name}
                            className="w-11 h-11 rounded-lg object-cover bg-slate-100 shrink-0"
                            loading="lazy"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  dish.category === 'VEG' ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                              />
                              <h4 className="text-xs font-bold text-slate-800 truncate">
                                {dish.name}
                              </h4>
                            </div>
                            <span className="text-[11px] font-black font-mono text-[#0D9488] block mt-0.5">
                              ₹{dish.price}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-400 italic py-3 text-center">
                        No dishes listed
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Session collections:</span>
                  <strong className="font-mono text-slate-900">
                    {collections.filter(c => c.meal_type === meal.meal_type).length} plates
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. TODAY'S FOOD COLLECTIONS SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Today's Food Collections ({filteredCollections.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live collection registry with student identity, exact timestamp, and payment settlement status
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student or phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'BREAKFAST', label: 'Breakfast' },
                { id: 'LUNCH', label: 'Lunch' },
                { id: 'SNACKS', label: 'Snacks' },
                { id: 'DINNER', label: 'Dinner' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-[#0D9488] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Distinct Groups: Breakfast, Lunch, Evening Snacks, Dinner */}
        <div className="space-y-6">
          {mealGroups
            .filter(grp => categoryFilter === 'ALL' || categoryFilter === grp.type)
            .map(grp => {
              const grpColls = filteredCollections.filter(c => c.meal_type === grp.type);
              const visual = getMealVisuals(grp.type);
              const Icon = visual.icon;

              return (
                <div key={grp.type} className="rounded-2xl border border-slate-200 overflow-hidden">
                  {/* Group Sub-Header */}
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg ${visual.bg} ${visual.color} flex items-center justify-center`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                        {grp.title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      {grpColls.length} collected
                    </span>
                  </div>

                  {/* Group Table / Cards */}
                  {grpColls.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No collections recorded for {grp.type.toLowerCase()} today.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                          <tr>
                            <th className="py-2.5 px-4">Student Name</th>
                            <th className="py-2.5 px-4">Phone / Room</th>
                            <th className="py-2.5 px-4">Meal Item</th>
                            <th className="py-2.5 px-4">Collected Time</th>
                            <th className="py-2.5 px-4">Amount</th>
                            <th className="py-2.5 px-4 text-right">Payment Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {grpColls.map(c => {
                            const dateObj = new Date(c.collected_at);
                            const formattedTime = !isNaN(dateObj.getTime())
                              ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '';
                            const foodName =
                              c.food_item_name ||
                              (c.food_items_snapshot && c.food_items_snapshot[0]) ||
                              grp.title.replace(' Collections', '');

                            return (
                              <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-900">
                                  {c.student_name}
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-500">
                                  {c.student_phone}
                                </td>
                                <td className="py-3 px-4 font-semibold text-slate-800">
                                  {foodName}
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-500">
                                  {c.collection_date} {formattedTime && `• ${formattedTime}`}
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                  ₹{c.amount || 40}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {getPaymentStatusBadge(c.payment_status)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
