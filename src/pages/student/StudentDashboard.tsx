import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  Coffee,
  Sun,
  Sunset,
  Moon,
  Utensils,
  ArrowRight,
  ShieldCheck,
  ReceiptIndianRupee,
  AlertCircle
} from 'lucide-react';
import { Meal, FoodItem, FoodCollection, MealType } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { useToast } from '../../context/ToastContext';

interface StudentDashboardProps {
  onNavigateToTab?: (tab: 'menu' | 'history' | 'bill') => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigateToTab }) => {
  const { student } = useAuth();
  const { subscribe } = useRealtime();
  const { success, error } = useToast();

  const [meals, setMeals] = useState<(Meal & { items: FoodItem[] })[]>([]);
  const [collections, setCollections] = useState<FoodCollection[]>([]);
  const [bill, setBill] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMarking, setIsMarking] = useState<boolean>(false);
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>('ALL');

  const fetchDashboardData = useCallback(async () => {
    try {
      const [menuRes, collRes, billRes] = await Promise.all([
        api.getTodayMenu(),
        api.getMyCollections(),
        api.getMyBill().catch(() => null)
      ]);
      setMeals(menuRes.meals || []);
      setCollections(collRes || []);
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

  const handleCollectMeal = async (mealId: string, mealName: string) => {
    setIsMarking(true);

    try {
      const res = await api.markFoodCollected(mealId);
      success(res.message || `${mealName} marked as collected!`);

      // Trigger Celebration Confetti!
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.6 }
      });

      await fetchDashboardData();
    } catch (err: any) {
      error(err.message || 'Could not record food collection');
    } finally {
      setIsMarking(false);
    }
  };

  const handleCollectDish = async (mealId: string, dishId: string, dishName: string) => {
    setIsMarking(true);

    try {
      const res = await api.markFoodCollected(mealId, dishId, dishName);
      success(res.message || `${dishName} marked as collected!`);

      // Trigger Celebration Confetti!
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.6 }
      });

      await fetchDashboardData();
    } catch (err: any) {
      error(err.message || 'Could not record food collection');
    } finally {
      setIsMarking(false);
    }
  };

  const getMealVisuals = (type: MealType) => {
    switch (type) {
      case 'BREAKFAST':
        return {
          icon: <Coffee className="w-5 h-5 text-amber-500" />,
          badgeBg: 'bg-amber-500/10 text-amber-700 border-amber-200/60'
        };
      case 'LUNCH':
        return {
          icon: <Sun className="w-5 h-5 text-emerald-600" />,
          badgeBg: 'bg-emerald-500/10 text-emerald-800 border-emerald-200/60'
        };
      case 'SNACKS':
        return {
          icon: <Sunset className="w-5 h-5 text-rose-500" />,
          badgeBg: 'bg-rose-500/10 text-rose-700 border-rose-200/60'
        };
      case 'DINNER':
        return {
          icon: <Moon className="w-5 h-5 text-indigo-500" />,
          badgeBg: 'bg-indigo-500/10 text-indigo-700 border-indigo-200/60'
        };
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const isMealCollected = (mealId: string) => {
    return collections.find(c => c.meal_id === mealId && c.collection_date === today);
  };

  const isDishCollected = (dishId: string, dishName: string) => {
    return collections.some(
      c =>
        c.collection_date === today &&
        ((c.food_item_id && c.food_item_id === dishId) ||
          (c.food_item_name && c.food_item_name === dishName) ||
          (c.food_items_snapshot && c.food_items_snapshot.length === 1 && c.food_items_snapshot[0] === dishName))
    );
  };

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

  const collectedTodayCount = collections.filter(c => c.collection_date === today).length;
  const filteredMeals = meals.filter(m => selectedSessionFilter === 'ALL' || m.meal_type === selectedSessionFilter);

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
              Welcome to the <strong>HOSTEL MESS</strong> Dining Hall. Review today's dishes below and tap <strong>COLLECT</strong> at the counter when you receive your tray.
            </p>
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

            <p className="text-[10px] text-teal-200/80 mt-2">
              HOSTEL MESS Dining Hall • Counter Block-B
            </p>
          </div>
        </div>
      </div>

      {/* Session Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Today's Scheduled Dining Sessions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operating on scheduled hostel timetable • Tap COLLECT upon taking your meal tray
          </p>
        </div>

        {/* Meal Session Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Sessions' },
            { id: 'BREAKFAST', label: 'Breakfast' },
            { id: 'LUNCH', label: 'Lunch' },
            { id: 'SNACKS', label: 'Snacks' },
            { id: 'DINNER', label: 'Dinner' }
          ].map(cat => {
            const isSelected = selectedSessionFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedSessionFilter(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm active:scale-95 ${
                  isSelected
                    ? 'bg-[#0D9488] text-white shadow-md shadow-[#0D9488]/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Meal Sessions & Food Cards Grid */}
      <div className="space-y-8">
        {filteredMeals.map(meal => {
          const collected = isMealCollected(meal.id);
          const visuals = getMealVisuals(meal.meal_type);

          return (
            <div
              key={meal.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-6"
            >
              {/* Session Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                    {visuals.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-xl text-slate-900 tracking-tight">
                        {meal.name}
                      </h3>
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/60">
                        {meal.items?.length || 0} Dishes
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 font-mono mt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{meal.start_time} – {meal.end_time}</span>
                    </p>
                  </div>
                </div>

                {/* The Collect / Collected Button Only */}
                <div>
                  {collected ? (
                    <div className="px-6 py-2.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>COLLECTED</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCollectMeal(meal.id, meal.name)}
                      disabled={isMarking}
                      className="px-6 py-2.5 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-black uppercase tracking-wider shadow-md shadow-[#0D9488]/20 transition-all flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>COLLECT</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Food Dishes Grid (Exactly Like Today's Menu Screenshot) */}
              {meal.items && meal.items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {meal.items.map(dish => {
                    const dishCollected = isDishCollected(dish.id, dish.name);

                    return (
                      <div
                        key={dish.id}
                        className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                      >
                        <div>
                          {/* Food Image with Overlays */}
                          <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                            <img
                              src={dish.image_url}
                              alt={dish.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />

                            {/* Gradient Overlay for Text Legibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20 pointer-events-none" />

                            {/* Dietary Marker (Square with dot) */}
                            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm p-1 rounded-md shadow-md flex items-center justify-center">
                              <div
                                className={`w-3.5 h-3.5 border-2 flex items-center justify-center rounded-[3px] ${
                                  dish.category === 'VEG'
                                    ? 'border-emerald-600'
                                    : dish.category === 'NON_VEG'
                                    ? 'border-red-600'
                                    : 'border-amber-600'
                                }`}
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    dish.category === 'VEG'
                                      ? 'bg-emerald-600'
                                      : dish.category === 'NON_VEG'
                                      ? 'bg-red-600'
                                      : 'bg-amber-600'
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Meal Category Pill */}
                            <div className="absolute top-3 right-3">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur-sm border border-white/20 shadow-sm">
                                {dish.meal_type}
                              </span>
                            </div>

                            {/* Prominent Price Tag Floating Pill */}
                            <div className="absolute bottom-3 right-3">
                              <span className="font-black font-mono text-sm px-3 py-1 rounded-xl bg-white text-slate-900 shadow-lg border border-slate-100">
                                ₹{dish.price}
                              </span>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-4 sm:p-5">
                            <h4 className="font-bold text-base text-slate-900 leading-tight">
                              {dish.name}
                            </h4>

                            {dish.description && (
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                                {dish.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Card Footer: Action button specifically on each food card */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Price</span>
                            <span className="font-mono text-base font-black text-slate-900">
                              ₹{dish.price}
                            </span>
                          </div>

                          <div>
                            {dishCollected ? (
                              <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs select-none">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                <span>COLLECTED</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCollectDish(meal.id, dish.id, dish.name)}
                                disabled={isMarking}
                                className="px-5 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-black uppercase tracking-wider shadow-sm hover:shadow-md shadow-[#0D9488]/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-white flex-shrink-0" />
                                <span>COLLECT</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No dishes scheduled for this session.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
