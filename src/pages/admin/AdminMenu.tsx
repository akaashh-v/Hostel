import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  IndianRupee,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { Meal, FoodItem, MealType } from '../../types';
import { api } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { useToast } from '../../context/ToastContext';

export const AdminMenu: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [mealType, setMealType] = useState<MealType>('BREAKFAST');
  const [price, setPrice] = useState<string>('40');
  const [category, setCategory] = useState<FoodItem['category']>('VEG');
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [servingDate, setServingDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  const { subscribe } = useRealtime();
  const { success, error } = useToast();

  const loadData = async () => {
    try {
      const res = await api.getAllMenu();
      setMeals(res.meals || []);
      setItems(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribe(e => {
      if (e.type === 'MENU_UPDATED') {
        loadData();
      }
    });
    return () => unsub();
  }, [subscribe]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setName('');
    setMealType('BREAKFAST');
    setPrice('40');
    setDescription('');
    setImageUrl('https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80');
    setCategory('VEG');
    setServingDate('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: FoodItem) => {
    setEditingItem(item);
    setName(item.name);
    setMealType(item.meal_type);
    setPrice(item.price ? item.price.toString() : '0');
    setCategory(item.category);
    setDescription(item.description || '');
    setImageUrl(item.image_url || '');
    setServingDate(item.serving_date || '');
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      error('Dish name is required');
      return;
    }

    const targetMeal = meals.find(m => m.meal_type === mealType) || meals[0];
    const mealId = targetMeal ? targetMeal.id : `meal-${mealType.toLowerCase()}`;
    const parsedPrice = parseFloat(price) || 0;

    try {
      if (editingItem) {
        await api.updateFoodItem(editingItem.id, {
          name,
          meal_id: mealId,
          meal_type: mealType,
          price: parsedPrice,
          category,
          description,
          image_url: imageUrl,
          serving_date: servingDate || undefined
        });
        success('Dish details updated successfully');
      } else {
        await api.createFoodItem({
          name,
          meal_id: mealId,
          meal_type: mealType,
          price: parsedPrice,
          category,
          description,
          image_url: imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
          is_available: true,
          serving_date: servingDate || undefined
        });
        success('New dish added to mess menu');
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save dish');
    }
  };

  const handleDeleteItem = async (id: string, itemName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${itemName}" from the menu?`)) {
      return;
    }
    try {
      await api.deleteFoodItem(id);
      success('Dish removed from menu');
      await loadData();
    } catch (err: any) {
      error(err.message || 'Failed to delete dish');
    }
  };

  const filteredItems = items.filter(dish => {
    const matchesSearch =
      dish.name.toLowerCase().includes(search.toLowerCase()) ||
      (dish.description && dish.description.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === 'ALL' || dish.meal_type === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Menu Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dishes, prices, descriptions, and categories for hostel students
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          style={{ backgroundColor: '#0D9488', color: '#FFFFFF' }}
          className="px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-md shadow-[#0D9488]/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Filter Row: Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategoryFilter === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'All Dishes' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search menu dishes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488] bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Dishes Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900">
            Configured Dishes ({filteredItems.length})
          </h2>
          <span className="text-xs text-slate-400">All prices editable by administrator</span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading menu directory...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center">
            <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No dishes found</p>
            <p className="text-xs text-slate-400 mt-1">Click "Add New Dish" above to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Dish</th>
                  <th className="py-3 px-4">Meal Session</th>
                  <th className="py-3 px-4">Dietary Type</th>
                  <th className="py-3 px-4 text-right">Price (₹)</th>
                  <th className="py-3 px-4">Serving Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredItems.map(dish => (
                  <tr key={dish.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Dish with thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={dish.image_url}
                          alt={dish.name}
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200 bg-slate-100"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{dish.name}</p>
                          {dish.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                              {dish.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Meal Session */}
                    <td className="py-3 px-4">
                      <span className="font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px]">
                        {dish.meal_type}
                      </span>
                    </td>

                    {/* Dietary */}
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          dish.category === 'VEG'
                            ? 'bg-emerald-100 text-emerald-800'
                            : dish.category === 'NON_VEG'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {dish.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      ₹{dish.price}
                    </td>

                    {/* Serving Date */}
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {dish.serving_date || 'Scheduled Daily'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(dish)}
                          title="Edit dish"
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(dish.id, dish.name)}
                          title="Delete dish"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingItem ? 'Edit Dish Details' : 'Add New Mess Dish'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* Dish Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masala Dosa"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              {/* Price & Meal Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Price (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      placeholder="40"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Meal Category *
                  </label>
                  <select
                    value={mealType}
                    onChange={e => setMealType(e.target.value as MealType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488] bg-white font-medium"
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="SNACKS">Evening Snacks</option>
                    <option value="DINNER">Dinner</option>
                  </select>
                </div>
              </div>

              {/* Dietary Category & Serving Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Dietary Classification
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488] bg-white font-medium"
                  >
                    <option value="VEG">VEG (Vegetarian)</option>
                    <option value="NON_VEG">NON_VEG</option>
                    <option value="BEVERAGE">BEVERAGE (Tea/Coffee)</option>
                    <option value="DESSERT">DESSERT</option>
                    <option value="STAPLE">STAPLE (Rice/Roti)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Serving Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={servingDate}
                    onChange={e => setServingDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488] font-mono bg-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Crispy fermented crepe served with spicy potato masala and coconut chutney"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              {/* Food Image URL with preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Food Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488] font-mono"
                />
                {imageUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                      onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <span className="text-[11px] text-slate-400">Image Preview</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#0D9488', color: '#FFFFFF' }}
                  className="flex-1 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  {editingItem ? 'Save Changes' : 'Add Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
