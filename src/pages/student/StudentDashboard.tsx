import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  ChevronRight,
  Coffee,
  Sun,
  Sunset,
  Moon,
  Utensils,
  ArrowRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { Meal, FoodItem, FoodCollection, MealType } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/ConfirmModal';

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
  const [selectedMealForCollection, setSelectedMealForCollection] = useState<(Meal & { items: FoodItem[] }) | null>(null);
  const [isMarking, setIsMarking] = useState<boolean>(false);

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

  const handleMarkCollected = async () => {
    if (!selectedMealForCollection) return;
    setIsMarking(true);

    try {
      const res = await api.markFoodCollected(selectedMealForCollection.id);
      success(res.message);

      // Trigger Celebration Confetti!
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.6 }
      });

      setSelectedMealForCollection(null);
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
          badgeBg: 'bg-amber-500/10 text-amber-700 border-amber-200/60',
          gradient: 'from-amber-500/5 via-transparent to-transparent'
        };
      case 'LUNCH':
        return {
          icon: <Sun className="w-5 h-5 text-emerald-600" />,
          badgeBg: 'bg-emerald-500/10 text-emerald-800 border-emerald-200/60',
          gradient: 'from-emerald-500/5 via-transparent to-transparent'
        };
      case 'SNACKS':
        return {
          icon: <Sunset className="w-5 h-5 text-rose-500" />,
          badgeBg: 'bg-rose-500/10 text-rose-700 border-rose-200/60',
          gradient: 'from-rose-500/5 via-transparent to-transparent'
        };
      case 'DINNER':
        return {
          icon: <Moon className="w-5 h-5 text-indigo-500" />,
          badgeBg: 'bg-indigo-500/10 text-indigo-700 border-indigo-200/60',
          gradient: 'from-indigo-500/5 via-transparent to-transparent'
        };
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const isMealCollected = (mealId: string) => {
    return collections.find(c => c.meal_id === mealId && c.collection_date === today);
  };

  // Dynamic time-based greeting
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
          <div className="w-11 h-11 border-4 border-[#087F5B] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold tracking-wide">Loading daily mess schedule...</p>
        </div>
      </div>
    );
  }

  const collectedTodayCount = collections.filter(c => c.collection_date === today).length;
  const allDishes = meals.flatMap(m => m.items || []);
  const featuredDishes = allDishes.slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-xl shadow-[#087F5B]/15 overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#087F5B] to-[#047857]">
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
              Welcome to the <strong>HOSTEL MESS</strong> Dining Hall. Check today's scheduled meals below and click <strong>"MARK AS COLLECTED"</strong> at the counter to verify your plate.
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

      {/* Scheduled Daily Meals & Food Collection Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Today's Scheduled Dining Sessions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Operating on scheduled hostel timetable • Mark each meal collected upon receiving your tray
            </p>
          </div>

          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('menu')}
              className="text-xs font-bold text-[#087F5B] hover:text-[#066749] flex items-center gap-1.5 transition-colors self-start sm:self-auto bg-emerald-50/80 hover:bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-200/60"
            >
              <span>Explore All 30 Dishes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {meals.map(meal => {
            const collected = isMealCollected(meal.id);
            const visuals = getMealVisuals(meal.meal_type);

            return (
              <div
                key={meal.id}
                className={`bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md ${collected
                  ? 'border-emerald-300/80 ring-1 ring-emerald-200/60'
                  : 'border-slate-200/80 hover:border-slate-300'
                  }`}
              >
                <div className="p-6">
                  {/* Meal Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                        {visuals.icon}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-lg text-slate-900 leading-tight">
                          {meal.name}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 font-mono mt-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{meal.start_time} – {meal.end_time}</span>
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100/80 px-3 py-1 rounded-full border border-slate-200/60">
                      {meal.items?.length || 0} Dishes
                    </span>
                  </div>

                  {/* Food Items Preview */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                      Session Menu & Demonstration Rates:
                    </p>
                    {meal.items && meal.items.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {meal.items.slice(0, 4).map(item => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 text-xs bg-slate-50/70 p-2 rounded-xl border border-slate-100/80 hover:bg-slate-100/70 transition-colors"
                          >
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-8 h-8 rounded-lg object-cover shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 truncate">{item.name}</p>
                              <p className="font-mono text-[11px] font-extrabold text-[#087F5B]">
                                ₹{item.price}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">No dishes scheduled for this session.</p>
                    )}

                    {meal.items && meal.items.length > 4 && (
                      <p className="text-[11px] text-slate-400 font-semibold mt-2 pl-1">
                        +{meal.items.length - 4} more dishes on complete menu
                      </p>
                    )}
                  </div>
                </div>

                {/* Collection Action Bar */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 rounded-b-3xl">
                  {collected ? (
                    <div className="flex items-center justify-between bg-emerald-50/90 border border-emerald-200 p-3.5 rounded-2xl text-xs text-emerald-950 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-wider text-[11px] text-emerald-900">
                            COLLECTED
                          </p>
                          <p className="text-[11px] text-emerald-700 font-mono">
                            Recorded today at {new Date(collected.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold bg-emerald-200/80 text-emerald-900 px-3 py-1 rounded-full uppercase tracking-wider">
                        Verified
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedMealForCollection(meal)}
                      style={{ backgroundColor: '#087F5B', color: '#FFFFFF' }}
                      className="w-full h-12 rounded-2xl bg-[#087F5B] hover:bg-[#066749] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[#087F5B]/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
                    >
                      <Utensils className="w-4 h-4 text-white" />
                      <span>MARK AS COLLECTED</span>
                      <ChevronRight className="w-4 h-4 text-white ml-auto" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Featured Dishes Section (Swiggy / Zomato style preview) */}
      {featuredDishes.length > 0 && (
        <div className="pt-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Featured Hostel Kitchen Dishes
              </h2>
              <p className="text-xs text-slate-500">Mouth-watering dishes prepared fresh daily</p>
            </div>
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('menu')}
                className="text-xs font-bold text-[#087F5B] hover:text-[#066749] transition-colors"
              >
                Browse All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredDishes.map(dish => (
              <div
                key={dish.id}
                onClick={() => onNavigateToTab && onNavigateToTab('menu')}
                className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={dish.image_url}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute bottom-3 right-3">
                      <span className="font-black font-mono text-xs px-2.5 py-1 rounded-xl bg-white text-slate-900 shadow-md">
                        ₹{dish.price}
                      </span>
                    </div>
                    <div className="absolute top-3 left-3">
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white shadow-sm ${dish.category === 'VEG'
                          ? 'bg-emerald-600'
                          : dish.category === 'NON_VEG'
                            ? 'bg-red-600'
                            : 'bg-amber-600'
                          }`}
                      >
                        {dish.category}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-sm">
                        {dish.meal_type}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug group-hover:text-[#087F5B] transition-colors">
                      {dish.name}
                    </h3>
                    {dish.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {dish.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-4 sm:px-5 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Hostel Special</span>
                  <span className="font-bold text-[#087F5B] font-mono">₹{dish.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedMealForCollection && (
        <ConfirmModal
          isOpen={!!selectedMealForCollection}
          title="Confirm Food Collection"
          mealName={selectedMealForCollection.name}
          items={selectedMealForCollection.items.map(i => `${i.name} (₹${i.price})`)}
          isLoading={isMarking}
          onConfirm={handleMarkCollected}
          onCancel={() => setSelectedMealForCollection(null)}
        />
      )}
    </div>
  );
};
