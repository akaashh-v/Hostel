import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react';
import { Meal, FoodItem, FoodCollection, MealType } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';

export const StudentMenu: React.FC = () => {
  const { student } = useAuth();
  const [meals, setMeals] = useState<(Meal & { items: FoodItem[] })[]>([]);
  const [collections, setCollections] = useState<FoodCollection[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedMealCategory, setSelectedMealCategory] = useState<string>('ALL');
  const [selectedDietary, setSelectedDietary] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDishModal, setSelectedDishModal] = useState<FoodItem | null>(null);

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

  // Map meal_id to collection status for today
  const isMealCollected = (mealType: MealType) => {
    return collections.find(c => c.meal_type === mealType && c.collection_date === todayStr);
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
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          <span>Click any dish card for full details</span>
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
            const collectionRecord = isMealCollected(dish.meal_type);

            return (
              <div
                key={dish.id}
                onClick={() => setSelectedDishModal(dish)}
                className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Food Image with Overlays */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={dish.image_url}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
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

                    {/* Collection Status Pill (Where Applicable) */}
                    <div className="absolute bottom-3 left-3">
                      {collectionRecord ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-600 text-white shadow-md">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                          <span>Collected Today</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/90 text-slate-700 backdrop-blur-sm shadow-sm">
                          Scheduled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <h3 className="font-bold text-base text-slate-900 group-hover:text-[#0D9488] transition-colors leading-tight">
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

                {/* Card Footer: Meal Category & Status Indicator */}
                <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-400">
                    Category: <strong className="text-slate-600 font-semibold">{dish.meal_type}</strong>
                  </span>
                  <span className="font-mono font-bold text-[#0D9488] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dish Details Modal */}
      {selectedDishModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedDishModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 transform transition-all animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative aspect-[16/10] bg-slate-100">
              <img
                src={selectedDishModal.image_url}
                alt={selectedDishModal.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedDishModal(null)}
                className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-md"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-3 right-3">
                <span className="font-black font-mono text-lg px-4 py-1.5 rounded-2xl bg-white text-slate-900 shadow-xl border border-slate-200">
                  ₹{selectedDishModal.price}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white ${
                    selectedDishModal.category === 'VEG'
                      ? 'bg-emerald-600'
                      : selectedDishModal.category === 'NON_VEG'
                      ? 'bg-red-600'
                      : 'bg-amber-600'
                  }`}
                >
                  {selectedDishModal.category}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {selectedDishModal.meal_type}
                </span>
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-2">
                {selectedDishModal.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                {selectedDishModal.description || 'Delicious meal freshly prepared by our hostel dining chefs.'}
              </p>

              {/* Collection Status for this Meal */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Meal Status Today:</span>
                  {isMealCollected(selectedDishModal.meal_type) ? (
                    <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Collected for Today</span>
                    </span>
                  ) : (
                    <span className="font-semibold text-slate-500">
                      Scheduled • Collect at Counter
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedDishModal(null)}
                style={{ backgroundColor: '#0D9488', color: '#FFFFFF' }}
                className="w-full py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold uppercase tracking-wider shadow-md transition-colors"
              >
                Close Dish Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
