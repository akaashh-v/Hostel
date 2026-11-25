import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  Utensils,
  ArrowRight,
  ReceiptIndianRupee
} from 'lucide-react';
import { Meal, FoodItem, FoodCollection } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';

interface StudentDashboardProps {
  onNavigateToTab?: (tab: 'menu' | 'history' | 'bill') => void;
  onNavigateToPayment?: (collection: FoodCollection) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigateToTab,
  onNavigateToPayment
}) => {
  const { student } = useAuth();
  const { subscribe } = useRealtime();

  const [meals, setMeals] = useState<(Meal & { items: FoodItem[] })[]>([]);
  const [collections, setCollections] = useState<FoodCollection[]>([]);
  const [bill, setBill] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>('ALL');

  const fetchDashboardData = useCallback(async () => {
    try {
      const [menuRes, collRes, billRes] = await Promise.all([
        api.getTodayMenu().catch(err => {
          console.error('Failed to load today menu', err);
          return { date: '', meals: [] };
        }),
        api.getMyCollections().catch(err => {
          console.error('Failed to load collections', err);
          return [];
        }),
        api.getMyBill().catch(() => null)
      ]);
      setMeals(menuRes?.meals || []);
      setCollections(Array.isArray(collRes) ? collRes : []);
      setBill(billRes || null);
    } catch (err: any) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const unsubscribe = subscribe((event) => {
      if (event.type === 'MENU_UPDATED' || event.type === 'COLLECTION_MARKED') {
        fetchDashboardData();
      }
    });

    return () => unsubscribe();
  }, [fetchDashboardData, subscribe]);

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-11 h-11 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold tracking-wide">Loading daily mess schedule...</p>
        </div>
      </div>
    );
  }

  const todayCollections = collections.filter(c => c.collection_date === today);
  const collectedTodayCount = todayCollections.length;
  const filteredCollections = todayCollections.filter(
    c => selectedSessionFilter === 'ALL' || c.meal_type === selectedSessionFilter
  );
  const allDishes = meals.flatMap(m => m.items || []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-xl shadow-[#0D9488]/15 overflow-hidden bg-gradient-to-br from-[#134E4A] via-[#0D9488] to-[#0F766E]">
        {/* Decorative background ambient glows */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-teal-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-16 w-60 h-60 bg-teal-200/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-teal-100 text-[11px] font-bold tracking-wider uppercase border border-white/20">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              {getGreeting()}, {student?.full_name?.split(' ')[0] || 'Student'}! 👋
            </h1>

            <p className="text-teal-100/90 text-xs sm:text-sm max-w-xl leading-relaxed">
              Welcome to <strong>TASTEBOX MEALS CO.</strong> Below are your collected meal trays for today. To collect additional dishes, visit Today's Menu.
            </p>

            <button
              type="button"
              onClick={() => onNavigateToTab?.('menu')}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-teal-800 text-xs font-bold hover:bg-teal-50 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5 text-teal-700" />
              <span>Browse Today's Menu & Collect Dishes →</span>
            </button>
          </div>

          {/* Quick Attendance & Billing Status Widget */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-lg min-w-[280px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-teal-100 uppercase tracking-wider">
                Today's Attendance
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-amber-300 font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-black text-white">{collectedTodayCount} / 4</span>
                <span className="text-xs font-semibold text-teal-200">
                  {collectedTodayCount === 4 ? 'All Collected 🎉' : 'Meals Collected'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-black/20 h-2.5 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-amber-300 to-teal-300 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${(collectedTodayCount / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Monthly Financial Health Chip */}
            {bill && (
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-teal-200 font-medium">Monthly Bill Due</p>
                  <p className="font-mono font-bold text-white text-sm">₹{bill.balance_amount?.toFixed(0) || '0'}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  bill.payment_status === 'PAID' ? 'bg-teal-400/20 text-teal-200' : 'bg-amber-400/20 text-amber-200'
                }`}>
                  {bill.payment_status === 'PAID' ? 'Paid in Full' : 'Pending'}
                </span>
              </div>
            )}

            {collections.filter(c => c.collection_date === today).length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-teal-200 tracking-wider block">
                  Collected Today:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {collections
                    .filter(c => c.collection_date === today)
                    .map((c, i) => (
                      <span
                        key={c.id || i}
                        className="inline-flex items-center gap-1 bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg border border-white/20 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3 h-3 text-amber-300" />
                        {c.food_item_name || (c.food_items_snapshot && c.food_items_snapshot[0]) || c.meal_type}
                      </span>
                    ))}
                </div>
              </div>
            )}

            <p className="text-[10px] text-teal-200/80 mt-2">
              TASTEBOX MEALS CO. Dining Hall • Counter Block-B
            </p>
          </div>
        </div>
      </div>

      {/* Today's Collected Food Items Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Today's Collected Food Items
              </h2>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                {todayCollections.length} collected
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Food items collected by you at the counter today • Track collected trays and settlement status
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToTab?.('menu')}
              className="px-4 py-2 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Collect More in Today's Menu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter Pills for Collected Items */}
        {todayCollections.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Collected' },
              { id: 'BREAKFAST', label: 'Breakfast' },
              { id: 'LUNCH', label: 'Lunch' },
              { id: 'SNACKS', label: 'Snacks' },
              { id: 'DINNER', label: 'Dinner' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedSessionFilter(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm active:scale-95 cursor-pointer ${
                  selectedSessionFilter === cat.id
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Empty State when no food collected yet today */}
        {todayCollections.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 text-[#0D9488] flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <Utensils className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900">No Meals Collected Yet Today</h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              Dishes you collect at the hostel mess counter will be displayed here immediately along with your collection timestamps and payment settlement.
            </p>
            <button
              type="button"
              onClick={() => onNavigateToTab?.('menu')}
              className="mt-6 px-6 py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#0D9488]/20 flex items-center justify-center gap-2 mx-auto cursor-pointer active:scale-95"
            >
              <Utensils className="w-4 h-4" />
              <span>Open Today's Menu to Collect Food</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center text-slate-500 shadow-xs">
            <p className="text-xs text-slate-400">No collected dishes found for this meal category today.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredCollections.map(coll => {
              const matchedDish = allDishes.find(
                d => (coll.food_item_id && d.id === coll.food_item_id) ||
                     (coll.food_item_name && d.name.toLowerCase() === coll.food_item_name.toLowerCase())
              );
              const imageUrl = matchedDish?.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600';
              const dishName = coll.food_item_name || matchedDish?.name || coll.meal_type;
              const price = coll.amount || matchedDish?.price || 40;

              return (
                <div
                  key={coll.id}
                  className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Food Image with Category badge */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      <img
                        src={imageUrl}
                        alt={dishName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20 pointer-events-none" />

                      {/* Collected Top Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          COLLECTED
                        </span>
                      </div>

                      {/* Meal Category */}
                      <div className="absolute top-3 right-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur-sm border border-white/20 shadow-sm">
                          {coll.meal_type}
                        </span>
                      </div>

                      {/* Price Pill */}
                      <div className="absolute bottom-3 right-3">
                        <span className="font-black font-mono text-sm px-3 py-1 rounded-xl bg-white text-slate-900 shadow-lg border border-slate-100">
                          ₹{price}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 sm:p-5">
                      <h4 className="font-bold text-base text-slate-900 leading-tight">
                        {dishName}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 font-mono mt-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Collected at {new Date(coll.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Payment status & Action */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Amount</span>
                      <span className="font-mono text-base font-black text-slate-900">
                        ₹{price}
                      </span>
                    </div>

                    <div>
                      {coll.payment_status === 'PAID' ? (
                        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs select-none">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span>PAID</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onNavigateToPayment?.(coll)}
                          className="px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-black uppercase tracking-wider shadow-sm hover:shadow-md shadow-[#0D9488]/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <ReceiptIndianRupee className="w-3.5 h-3.5 text-white flex-shrink-0" />
                          <span>PAY NOW</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
