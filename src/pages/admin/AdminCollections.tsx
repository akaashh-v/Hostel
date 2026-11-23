import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  ClipboardCheck,
  Search,
  Calendar,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';
import { FoodCollection } from '../../types';
import { api } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { useToast } from '../../context/ToastContext';

export const AdminCollections: React.FC = () => {
  const [collections, setCollections] = useState<FoodCollection[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'collected' | 'uncollected'>('collected');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { subscribe } = useRealtime();
  const { success } = useToast();

  const loadData = async () => {
    try {
      const [colls, sum] = await Promise.all([
        api.getAllCollections({ date, meal_type: mealType, search }),
        api.getCollectionsSummary(date)
      ]);
      setCollections(colls || []);
      setSummary(sum || null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribe(e => {
      if (e.type === 'COLLECTION_MARKED') {
        loadData();
      }
    });
    return () => unsub();
  }, [date, mealType, search, subscribe]);

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = collections.map(c => ({
      'Student Name': c.student_name,
      'Phone Number': c.student_phone,
      'Meal Type': c.meal_type,
      'Food Item': c.food_item_name || (c.food_items_snapshot ? c.food_items_snapshot.join(', ') : ''),
      'Collection Date': c.collection_date,
      'Timestamp': new Date(c.collected_at).toLocaleTimeString()
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Food Collections');
    XLSX.writeFile(wb, `Mess_Collections_${date}.xlsx`);
    success('Exported collections to Excel');
  };

  // Find uncollected students for active meal filter
  const currentMealSummary = summary?.meals?.find(
    (m: any) => (mealType ? m.meal_type === mealType : true)
  ) || summary?.meals?.[0];

  const uncollectedStudents = currentMealSummary?.uncollected_students || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Food Collection Tracker</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time verification of student meal redemptions and uncollected headcounts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="text-xs font-semibold focus:outline-none text-slate-800 font-mono"
            />
          </div>

          <select
            value={mealType}
            onChange={e => setMealType(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="">All Meals</option>
            <option value="BREAKFAST">Breakfast</option>
            <option value="LUNCH">Lunch</option>
            <option value="SNACKS">Snacks</option>
            <option value="DINNER">Dinner</option>
          </select>
        </div>

        {/* View Switcher: Collected vs Uncollected */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold ml-auto w-full md:w-auto">
          <button
            onClick={() => setActiveTab('collected')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg transition-all ${activeTab === 'collected' ? 'bg-white shadow text-teal-600' : 'text-slate-500'
              }`}
          >
            Collected ({collections.length})
          </button>
          <button
            onClick={() => setActiveTab('uncollected')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg transition-all ${activeTab === 'uncollected' ? 'bg-white shadow text-teal-600' : 'text-slate-500'
              }`}
          >
            Uncollected ({uncollectedStudents.length})
          </button>
        </div>
      </div>

      {/* Main Table View */}
      {activeTab === 'collected' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-900">Recorded Food Collections</h2>
            <span className="text-xs text-slate-400 font-mono">{collections.length} entries recorded</span>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-400">Loading collection log...</div>
          ) : collections.length === 0 ? (
            <div className="py-20 text-center">
              <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">No collections match criteria</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing filters or check another date.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Meal</th>
                    <th className="py-3 px-4">Items Snapshot</th>
                    <th className="py-3 px-4 font-mono">Date</th>
                    <th className="py-3 px-4 font-mono">Time</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {collections.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{item.student_name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{item.student_phone}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {item.meal_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate">
                        {item.food_item_name ? (
                          <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            {item.food_item_name}
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            {item.food_items_snapshot?.join(', ') || 'Standard Menu'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{item.collection_date}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {new Date(item.collected_at).toLocaleTimeString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          VERIFIED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Uncollected Students List */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                Uncollected Students for {currentMealSummary?.name || 'Meal'}
              </h2>
              <p className="text-xs text-slate-500">
                Students who have not marked their meal collected on {date}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
              {uncollectedStudents.length} Remaining
            </span>
          </div>

          {uncollectedStudents.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">All registered students have collected their meal!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {uncollectedStudents.map((st: any) => (
                <div
                  key={st.id}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-xs text-slate-900">{st.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{st.phone}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    PENDING
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
