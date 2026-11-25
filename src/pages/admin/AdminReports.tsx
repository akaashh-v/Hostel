import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Users,
  Utensils,
  ReceiptIndianRupee,
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { FoodCollection, MonthlyBill, Payment } from '../../types';
import { useToast } from '../../context/ToastContext';
import { getTodayDateString } from '../../utils/date';

type ReportType =
  | 'daily_collections'
  | 'monthly_collections'
  | 'meal_wise'
  | 'student_wise'
  | 'monthly_billing'
  | 'payment_records'
  | 'pending_payments';

export const AdminReports: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('daily_collections');
  const [collections, setCollections] = useState<FoodCollection[]>([]);
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMealCategory, setSelectedMealCategory] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const { success, error } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [collsData, billsData, studentsData] = await Promise.all([
        api.getAllCollections({ month: selectedMonth, year: selectedYear }),
        api.getMonthlyBills(selectedMonth, selectedYear),
        api.getStudents()
      ]);
      setCollections(collsData || []);
      setBills(billsData || []);
      setStudents(studentsData || []);
    } catch (err: any) {
      console.error(err);
      error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  // Derived filtered collections
  const filteredCollections = collections.filter(c => {
    const matchesCategory = selectedMealCategory === 'ALL' || c.meal_type === selectedMealCategory;
    const matchesStudent = selectedStudentId === 'ALL' || c.student_id === selectedStudentId;
    const matchesDate = reportType === 'daily_collections' ? c.collection_date === selectedDate : true;
    const matchesSearch =
      c.student_name.toLowerCase().includes(search.toLowerCase()) ||
      c.student_phone.includes(search);
    return matchesCategory && matchesStudent && matchesDate && matchesSearch;
  });

  // Derived filtered bills
  const filteredBills = bills.filter(b => {
    const matchesStudent = selectedStudentId === 'ALL' || b.student_id === selectedStudentId;
    const matchesSearch =
      b.student_name.toLowerCase().includes(search.toLowerCase()) ||
      b.student_phone.includes(search);
    const matchesPending = reportType === 'pending_payments' ? b.balance_amount > 0 : true;
    return matchesStudent && matchesSearch && matchesPending;
  });

  // Export functions
  const handleExportExcel = () => {
    let exportData: any[] = [];
    let fileName = `HOSTEL_MESS_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;

    if (reportType === 'monthly_billing' || reportType === 'pending_payments') {
      exportData = filteredBills.map(b => ({
        'Student Name': b.student_name,
        'Phone': b.student_phone,
        'Month': `${selectedMonth}/${selectedYear}`,
        'Billing Mode': b.billing_mode,
        'Breakfast Count': b.breakfast_count,
        'Lunch Count': b.lunch_count,
        'Snacks Count': b.snacks_count,
        'Dinner Count': b.dinner_count,
        'Total Meals': b.total_meals,
        'Total Billed (₹)': b.total_amount,
        'Paid Amount (₹)': b.paid_amount,
        'Balance Due (₹)': b.balance_amount,
        'Status': b.payment_status
      }));
    } else {
      exportData = filteredCollections.map(c => ({
        'Student Name': c.student_name,
        'Phone': c.student_phone,
        'Meal Category': c.meal_type,
        'Collection Date': c.collection_date,
        'Collected At (Time)': new Date(c.collected_at).toLocaleTimeString(),
        'Dishes Snapshot': c.food_items_snapshot ? c.food_items_snapshot.join(', ') : 'Standard Menu'
      }));
    }

    if (exportData.length === 0) {
      error('No records match the selected filters to export.');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, fileName);
    success(`Successfully exported ${exportData.length} records to Excel`);
  };

  const handleExportCSV = () => {
    let exportData: any[] = [];
    let fileName = `HOSTEL_MESS_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

    if (reportType === 'monthly_billing' || reportType === 'pending_payments') {
      exportData = filteredBills.map(b => ({
        'Student Name': b.student_name,
        'Phone': b.student_phone,
        'Billing Month': `${selectedMonth}/${selectedYear}`,
        'Billing Mode': b.billing_mode,
        'Total Meals': b.total_meals,
        'Total (INR)': b.total_amount,
        'Paid (INR)': b.paid_amount,
        'Balance (INR)': b.balance_amount,
        'Status': b.payment_status
      }));
    } else {
      exportData = filteredCollections.map(c => ({
        'Student Name': c.student_name,
        'Phone': c.student_phone,
        'Meal Category': c.meal_type,
        'Date': c.collection_date,
        'Time': new Date(c.collected_at).toLocaleTimeString()
      }));
    }

    if (exportData.length === 0) {
      error('No records match the selected filters to export.');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success(`Successfully exported ${exportData.length} records to CSV`);
  };

  const reportOptions: { id: ReportType; label: string; icon: any }[] = [
    { id: 'daily_collections', label: 'Daily Collections', icon: Utensils },
    { id: 'monthly_collections', label: 'Monthly Collections', icon: Calendar },
    { id: 'student_wise', label: 'Student-Wise Collections', icon: Users },
    { id: 'monthly_billing', label: 'Monthly Billing Ledger', icon: ReceiptIndianRupee },
    { id: 'pending_payments', label: 'Pending Dues & Balances', icon: AlertCircle }
  ];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Page Title & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">HOSTEL MESS Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time reporting, audit trails, and exportable reconciliation statements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportExcel}
            style={{ backgroundColor: '#0D9488', color: '#FFFFFF' }}
            className="px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-md shadow-[#0D9488]/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {reportOptions.map(opt => {
          const isSelected = reportType === opt.id;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => setReportType(opt.id)}
              style={isSelected ? { backgroundColor: '#0D9488', color: '#FFFFFF' } : {}}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shadow-sm ${
                isSelected
                  ? 'bg-[#0D9488] text-white shadow-md shadow-[#0D9488]/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          />
        </div>

        {/* Date Filter (for daily collections) */}
        {reportType === 'daily_collections' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-xs font-semibold focus:outline-none bg-transparent text-slate-800 font-mono"
            />
          </div>
        )}

        {/* Month Selector */}
        <div className="flex items-center gap-1.5">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          >
            {[
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ].map((m, idx) => (
              <option key={m} value={idx + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#0D9488] font-mono"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>

        {/* Meal Category Filter */}
        {(reportType === 'daily_collections' || reportType === 'monthly_collections' || reportType === 'student_wise') && (
          <select
            value={selectedMealCategory}
            onChange={e => setSelectedMealCategory(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          >
            <option value="ALL">All Meal Categories</option>
            <option value="BREAKFAST">Breakfast</option>
            <option value="LUNCH">Lunch</option>
            <option value="SNACKS">Evening Snacks</option>
            <option value="DINNER">Dinner</option>
          </select>
        )}

        {/* Student Filter */}
        <select
          value={selectedStudentId}
          onChange={e => setSelectedStudentId(e.target.value)}
          className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#0D9488] max-w-[180px]"
        >
          <option value="ALL">All Students</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
      </div>

      {/* Data Report Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-slate-900">
              {reportType === 'monthly_billing'
                ? 'Monthly Billing Ledger'
                : reportType === 'pending_payments'
                ? 'Outstanding Balances Report'
                : 'Verified Collection Log'}
            </h2>
            <p className="text-xs text-slate-400">
              {reportType === 'monthly_billing' || reportType === 'pending_payments'
                ? `Showing ${filteredBills.length} billing statements`
                : `Showing ${filteredCollections.length} meal collection records`}
            </p>
          </div>
          <span className="text-xs font-bold text-[#0D9488] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Database Verified
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading report data...</div>
        ) : (reportType === 'monthly_billing' || reportType === 'pending_payments') ? (
          filteredBills.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">No billing records found matching criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Billing Mode</th>
                    <th className="py-3 px-4 text-center">Meals Logged</th>
                    <th className="py-3 px-4 text-right">Billed (₹)</th>
                    <th className="py-3 px-4 text-right">Paid (₹)</th>
                    <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                  {filteredBills.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 font-sans">{b.student_name}</td>
                      <td className="py-3 px-4 text-slate-500">{b.student_phone}</td>
                      <td className="py-3 px-4 font-sans text-xs">
                        {b.billing_mode === 'FIXED' ? 'Fixed Fee' : 'Pay-Per-Meal'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{b.total_meals}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">₹{b.total_amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-bold">₹{b.paid_amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-red-600 font-bold">₹{b.balance_amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            b.payment_status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : b.payment_status === 'PARTIALLY_PAID'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {b.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          filteredCollections.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">No collections found matching criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Meal Category</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Items Snapshot</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCollections.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.student_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{c.student_phone}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                          {c.meal_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{c.collection_date}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(c.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate text-[11px]">
                        {c.food_items_snapshot ? c.food_items_snapshot.join(', ') : 'Standard Menu'}
                      </td>
                      <td className="py-3 px-4 text-center">
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
          )
        )}
      </div>
    </div>
  );
};
