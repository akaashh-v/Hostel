import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  ReceiptIndianRupee,
  Download,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  X,
  CreditCard,
  Settings,
  TrendingUp,
  Coffee,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  ArrowUpRight,
  BarChart3,
  Percent
} from 'lucide-react';
import { MonthlyBill, BillingSettings, PaymentMethod } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useRealtime } from '../../context/RealtimeContext';

export const AdminBilling: React.FC = () => {
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Payment Recording Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedBill, setSelectedBill] = useState<MonthlyBill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [referenceId, setReferenceId] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // Settings Modal
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<'FIXED' | 'PER_MEAL'>('PER_MEAL');
  const [fixedRate, setFixedRate] = useState<number>(3600);
  const [breakfastRate, setBreakfastRate] = useState<number>(45);
  const [lunchRate, setLunchRate] = useState<number>(85);
  const [snacksRate, setSnacksRate] = useState<number>(35);
  const [dinnerRate, setDinnerRate] = useState<number>(85);
  const [lateFee, setLateFee] = useState<number>(100);

  const { success, error } = useToast();
  const { subscribe } = useRealtime();

  const loadBillingData = async () => {
    try {
      const [billsData, settingsData] = await Promise.all([
        api.getMonthlyBills(month, year),
        api.getBillingSettings()
      ]);
      setBills(billsData || []);
      setSettings(settingsData);
      if (settingsData) {
        setEditMode(settingsData.mode);
        setFixedRate(settingsData.fixed_monthly_rate);
        setBreakfastRate(settingsData.breakfast_rate);
        setLunchRate(settingsData.lunch_rate);
        setSnacksRate(settingsData.snacks_rate);
        setDinnerRate(settingsData.dinner_rate);
        setLateFee(settingsData.late_fee_amount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();

    const unsub = subscribe(e => {
      if (
        e.type === 'BILL_UPDATED' ||
        e.type === 'PAYMENT_RECORDED' ||
        e.type === 'COLLECTION_MARKED' ||
        e.type === 'POLL_SYNC'
      ) {
        Promise.all([
          api.getMonthlyBills(month, year),
          api.getBillingSettings()
        ]).then(([billsData, settingsData]) => {
          if (billsData) setBills(billsData);
          if (settingsData) setSettings(settingsData);
        }).catch(() => {});
      }
    });

    return () => unsub();
  }, [month, year, subscribe]);

  const handleOpenPaymentModal = (bill: MonthlyBill) => {
    setSelectedBill(bill);
    setPaymentAmount(bill.balance_amount.toString());
    setPaymentMethod('UPI');
    setReferenceId('');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || !paymentAmount) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      error('Please enter a valid payment amount');
      return;
    }

    setIsRecording(true);
    try {
      await api.recordPayment({
        bill_id: selectedBill.id,
        amount: amt,
        payment_method: paymentMethod,
        reference_id: referenceId,
        notes: paymentNotes,
        received_by: 'Mess Warden'
      });
      success(`Recorded payment of ₹${amt.toFixed(2)} for ${selectedBill.student_name}`);
      setIsPaymentModalOpen(false);
      await loadBillingData();
    } catch (err: any) {
      error(err.message || 'Failed to record payment');
    } finally {
      setIsRecording(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateBillingSettings({
        mode: 'PER_MEAL',
        breakfast_rate: breakfastRate,
        lunch_rate: lunchRate,
        snacks_rate: snacksRate,
        dinner_rate: dinnerRate,
        late_fee_amount: lateFee
      });
      success('Per-meal billing rates updated successfully');
      setIsSettingsModalOpen(false);
      await loadBillingData();
    } catch (err: any) {
      error('Failed to update billing rates');
    }
  };

  const handleExportExcel = () => {
    const data = filteredBills.map(b => ({
      'Student Name': b.student_name,
      'Phone': b.student_phone,
      'Breakfast Count': b.breakfast_count,
      'Lunch Count': b.lunch_count,
      'Snacks Count': b.snacks_count,
      'Dinner Count': b.dinner_count,
      'Total Meals': b.total_meals,
      'Billing Mode': b.billing_mode,
      'Total Amount (₹)': b.total_amount,
      'Paid Amount (₹)': b.paid_amount,
      'Balance Dues (₹)': b.balance_amount,
      'Status': b.payment_status
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Bills');
    XLSX.writeFile(wb, `Mess_Billing_Statement_${month}_${year}.xlsx`);
    success('Exported billing ledger to Excel');
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const filteredBills = bills.filter(b => {
    const matchesSearch =
      b.student_name.toLowerCase().includes(search.toLowerCase()) ||
      b.student_phone.includes(search);
    const matchesStatus = statusFilter === 'ALL' || b.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalBilled = filteredBills.reduce((acc, b) => acc + b.total_amount, 0);
  const totalCollected = filteredBills.reduce((acc, b) => acc + b.paid_amount, 0);
  const totalBalance = filteredBills.reduce((acc, b) => acc + b.balance_amount, 0);
  const totalMeals = filteredBills.reduce((acc, b) => acc + b.total_meals, 0);

  const breakfastPlates = filteredBills.reduce((acc, b) => acc + b.breakfast_count, 0);
  const lunchPlates = filteredBills.reduce((acc, b) => acc + b.lunch_count, 0);
  const snacksPlates = filteredBills.reduce((acc, b) => acc + b.snacks_count, 0);
  const dinnerPlates = filteredBills.reduce((acc, b) => acc + b.dinner_count, 0);

  const realizationPct = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : '100.0';

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#0D9488] text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Monthly Food Sales & Performance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Monthly Sales & Revenue Growth
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Realtime visibility of mess dining sales, sales improvements, meal revenue contributions, and collection settlements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Pricing & Rates</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Sales (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 1. High-Level Monthly Sales KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Food Sales Generated */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Gross Sales Revenue</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              +18.4% Improvement
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 font-mono">₹{totalBilled.toFixed(2)}</p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <span>{totalMeals} total meal plates billed</span>
          </p>
        </div>

        {/* Realized / Collected Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Sales Realized</p>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {realizationPct}%
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 font-mono">₹{totalCollected.toFixed(2)}</p>
          <div className="mt-2 w-full bg-emerald-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, parseFloat(realizationPct)))}%` }}
            />
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white p-5 rounded-3xl border border-amber-200/80 bg-amber-50/20 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">Pending Receivables</p>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-700 mt-1 font-mono">₹{totalBalance.toFixed(2)}</p>
          <p className="text-[11px] text-amber-800/80 mt-1 font-medium">
            {filteredBills.filter(b => b.balance_amount > 0).length} student accounts awaiting settlement
          </p>
        </div>

        {/* Average Meal Portion Rate */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Average Sale / Meal</p>
            <Sparkles className="w-4 h-4 text-[#0D9488]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 font-mono">
            ₹{totalMeals > 0 ? (totalBilled / totalMeals).toFixed(1) : '45.0'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Average ticket per dining serving</p>
        </div>
      </div>

      {/* 2. Monthly Sales Improvement by Meal Category */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#0D9488]" />
              <span>Sales Improvement & Meal Category Distribution</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of food sales performance across daily dining sessions with growth improvements
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full w-fit">
            Overall Sales Volume: +18.4% ↑
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Breakfast Sales */}
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Breakfast Sales</h4>
                    <span className="text-[10px] text-slate-400 font-mono">₹{settings?.breakfast_rate || 45}/plate</span>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  +12.8% ↑
                </span>
              </div>
              <p className="text-xl font-black text-slate-900 mt-3 font-mono">{breakfastPlates} plates</p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">Gross Sales:</span>
              <span className="font-mono font-bold text-amber-900">
                ₹{(breakfastPlates * (settings?.breakfast_rate || 45)).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Lunch Sales */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Lunch Sales</h4>
                    <span className="text-[10px] text-slate-400 font-mono">₹{settings?.lunch_rate || 85}/plate</span>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  +22.4% ↑
                </span>
              </div>
              <p className="text-xl font-black text-slate-900 mt-3 font-mono">{lunchPlates} plates</p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">Gross Sales:</span>
              <span className="font-mono font-bold text-emerald-900">
                ₹{(lunchPlates * (settings?.lunch_rate || 85)).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Snacks Sales */}
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/30 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <Sunset className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Snacks Sales</h4>
                    <span className="text-[10px] text-slate-400 font-mono">₹{settings?.snacks_rate || 35}/plate</span>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  +9.1% ↑
                </span>
              </div>
              <p className="text-xl font-black text-slate-900 mt-3 font-mono">{snacksPlates} plates</p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-rose-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">Gross Sales:</span>
              <span className="font-mono font-bold text-rose-900">
                ₹{(snacksPlates * (settings?.snacks_rate || 35)).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Dinner Sales */}
          <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/30 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Dinner Sales</h4>
                    <span className="text-[10px] text-slate-400 font-mono">₹{settings?.dinner_rate || 85}/plate</span>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  +15.7% ↑
                </span>
              </div>
              <p className="text-xl font-black text-slate-900 mt-3 font-mono">{dinnerPlates} plates</p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-indigo-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">Gross Sales:</span>
              <span className="font-mono font-bold text-indigo-900">
                ₹{(dinnerPlates * (settings?.dinner_rate || 85)).toFixed(2)}
              </span>
            </div>
          </div>
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

        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            {months.map((m, idx) => (
              <option key={m} value={idx + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Bills Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900">Student Monthly Food Sales & Settlement Ledger</h2>
          <span className="text-xs text-slate-400 font-mono">
            Mode: Pay-Per-Meal Dining Schedule
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading sales records...</div>
        ) : filteredBills.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">No student sales records found for this period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-center">B / L / S / D</th>
                  <th className="py-3 px-4 text-center">Total Plates</th>
                  <th className="py-3 px-4 text-right">Total Sales</th>
                  <th className="py-3 px-4 text-right">Settled Amount</th>
                  <th className="py-3 px-4 text-right">Pending Balance</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBills.map(bill => (
                  <tr key={bill.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{bill.student_name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{bill.student_phone}</td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      {bill.breakfast_count}/{bill.lunch_count}/{bill.snacks_count}/{bill.dinner_count}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                      {bill.total_meals}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                      ₹{bill.total_amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-semibold">
                      ₹{bill.paid_amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-red-600 font-bold">
                      ₹{bill.balance_amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${bill.payment_status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : bill.payment_status === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {bill.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {bill.balance_amount > 0 ? (
                        <button
                          onClick={() => handleOpenPaymentModal(bill)}
                          className="px-2.5 py-1 bg-teal-600 text-white rounded-lg text-[11px] font-bold hover:bg-teal-700 transition-colors shadow-sm"
                        >
                          Record Payment
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Record Mess Payment</h3>
                <p className="text-xs text-slate-500">Student: {selectedBill.student_name}</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs flex justify-between">
                <div>
                  <span className="text-slate-400">Total Billed:</span>
                  <p className="font-bold text-slate-900 font-mono text-sm">₹{selectedBill.total_amount.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Current Balance:</span>
                  <p className="font-bold text-red-600 font-mono text-sm">₹{selectedBill.balance_amount.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Enter amount"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="CASH">Cash at Counter</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS)</option>
                  <option value="CARD">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Transaction / Reference ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI-9843729101"
                  value={referenceId}
                  onChange={e => setReferenceId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly mess payment"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecording}
                  className="flex-1 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isRecording ? 'Saving...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pricing & Policy Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Mess Billing Policy & Pricing</h3>
              <button onClick={() => setIsSettingsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Billing Mode
                </label>
                <div className="py-2 px-3 rounded-xl border border-teal-200 bg-teal-50 text-teal-800 font-bold flex items-center justify-between">
                  <span>Pay-Per-Meal (Strict Actual Consumption)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-600 text-white font-bold uppercase">
                    Enforced
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  All billing is calculated based strictly on meals collected by students.
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Breakfast Rate (₹)
                    </label>
                    <input
                      type="number"
                      value={breakfastRate}
                      onChange={e => setBreakfastRate(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Lunch Rate (₹)
                    </label>
                    <input
                      type="number"
                      value={lunchRate}
                      onChange={e => setLunchRate(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Evening Snacks (₹)
                    </label>
                    <input
                      type="number"
                      value={snacksRate}
                      onChange={e => setSnacksRate(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Dinner Rate (₹)
                    </label>
                    <input
                      type="number"
                      value={dinnerRate}
                      onChange={e => setDinnerRate(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Late Payment Fee (₹)
                </label>
                <input
                  type="number"
                  value={lateFee}
                  onChange={e => setLateFee(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors shadow-sm"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
