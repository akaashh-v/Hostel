import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Search,
  Utensils,
  Clock,
  Coffee,
  Sun,
  Sunset,
  Moon,
  X,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Meal, FoodItem, FoodCollection, MealType } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { useToast } from '../../context/ToastContext';

export const StudentMenu: React.FC = () => {
  const { student } = useAuth();
  const { success, error } = useToast();
  const [meals, setMeals] = useState<(Meal & { items: FoodItem[] })[]>([]);
  const [collections, setCollections] = useState<FoodCollection[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedMealCategory, setSelectedMealCategory] = useState<string>('ALL');
  const [selectedDietary, setSelectedDietary] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMarking, setIsMarking] = useState<boolean>(false);

  const { subscribe } = useRealtime();

  const loadMenuAndCollections = async () => {
    try {
      const [menuData, collData] = await Promise.all([
        api.getTodayMenu(),
        api.getMyCollections().catch(() => [])
      ]);
      setMeals(menuData.meals || []);
      setCollections(collData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenuAndCollections();
    const unsub = subscribe(e => {
      if (e.type === 'MENU_UPDATED' || e.type === 'COLLECTION_MARKED') {
        loadMenuAndCollections();
      }
    });
    return () => unsub();
  }, [subscribe]);

  const handleCollectDish = async (mealTypeOrId: string, dishId: string, dishName: string) => {
    setIsMarking(true);

    try {
      const mealObj = meals.find(m => m.id === mealTypeOrId || m.meal_type === mealTypeOrId);
      const mealIdToSend = mealObj ? mealObj.id : mealTypeOrId.startsWith('meal-') ? mealTypeOrId : `meal-${mealTypeOrId.toLowerCase()}`;

      const res = await api.markFoodCollected(mealIdToSend, dishId, dishName);
      success(res.message || `${dishName} marked as collected!`);

      // Trigger Celebration Confetti!
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.6 }
      });

      await loadMenuAndCollections();
    } catch (err: any) {
      error(err.message || 'Could not record food collection');
    } finally {
      setIsMarking(false);
    }
  };

  // Exact categories required by Prompt:
  // All, Breakfast, Lunch, Snacks, Dinner
  const categoryFilters = [
    { id: 'ALL', label: 'All' },
    { id: 'BREAKFAST', label: 'Breakfast', icon: Coffee },
    { id: 'LUNCH', label: 'Lunch', icon: Sun },
    { id: 'SNACKS', label: 'Snacks', icon: Sunset },
    { id: 'DINNER', label: 'Dinner', icon: Moon }
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  // Check if a specific food item was collected today by student
  const isDishCollected = (dishId: string, dishName: string) => {
    return collections.some(
      c =>
        c.collection_date === todayStr &&
        ((c.food_item_id && c.food_item_id === dishId) ||
          (c.food_item_name && c.food_item_name === dishName) ||
          (c.food_items_snapshot && c.food_items_snapshot.length === 1 && c.food_items_snapshot[0] === dishName))
    );
  };

  // Flatten all dishes across all meals
  const allDishes = meals.flatMap(m => m.items || []);

  const filteredDishes = allDishes.filter(dish => {
    const matchesSearch =
      dish.name.toLowerCase().includes(search.toLowerCase()) ||
      (dish.description && dish.description.toLowerCase().includes(search.toLowerCase()));

    const matchesMeal =
      selectedMealCategory === 'ALL' || dish.meal_type === selectedMealCategory;

    const matchesDietary =
      selectedDietary === 'ALL' || dish.category === selectedDietary;

    return matchesSearch && matchesMeal && matchesDietary;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6">
      {/* Header & Search Bar Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[#0D9488] text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HOSTEL MESS Scheduled Dining</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Hostel Food Menu
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
              Explore today's freshly prepared South and North Indian dishes. All meals are served on schedule at the hostel dining counters.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search dishes (e.g. Masala Dosa, Biriyani)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition-all shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categoryFilters.map(cat => {
              const isSelected = selectedMealCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedMealCategory(cat.id)}
                  style={isSelected ? { backgroundColor: '#0D9488', color: '#FFFFFF' } : {}}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                    isSelected
                      ? 'bg-[#0D9488] text-white shadow-md shadow-[#0D9488]/20'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dietary Type Filter */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="text-slate-400 text-[11px] hidden md:inline">Diet:</span>
            {['ALL', 'VEG', 'NON_VEG'].map(diet => (
              <button
                key={diet}
                onClick={() => setSelectedDietary(diet)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  selectedDietary === diet
                    ? 'bg-slate-900 text-white font-bold shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {diet === 'ALL' ? 'All' : diet === 'VEG' ? 'Pure Veg' : 'Non-Veg'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Meta Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <p>
          Showing <strong className="text-slate-800">{filteredDishes.length}</strong> delicious dishes
        </p>
        <span className="text-[11px] text-slate-400 font-medium">
          Fresh hostel meals prepared daily
        </span>
      </div>

      {/* Modern Responsive Food Ordering Grid: Desktop 3-4 cols, Tablet 2 cols, Mobile 1-2 cols */}
      {isLoading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-medium">Loading delicious mess dishes...</p>
        </div>
      ) : filteredDishes.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No dishes found matching your criteria</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or selecting "All" categories.</p>
          <button
            onClick={() => { setSearch(''); setSelectedMealCategory('ALL'); setSelectedDietary('ALL'); }}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredDishes.map(dish => {
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

                    {/* Dietary Marker (Swiggy / Zomato style square with dot) */}
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
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <h3 className="font-bold text-base text-slate-900 leading-tight">
                        {dish.name}
                      </h3>
                    </div>

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
                        onClick={() => handleCollectDish(dish.meal_id || meals.find(m => m.meal_type === dish.meal_type)?.id || `meal-${dish.meal_type.toLowerCase()}`, dish.id, dish.name)}
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
      )}
    </div>
  );
};
