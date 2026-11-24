import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ReceiptIndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Printer,
  Utensils,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles
} from 'lucide-react';
import { MonthlyBill, Payment, BillingSettings, FoodCollection, PaymentMethod } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useRealtime } from '../../context/RealtimeContext';

interface StudentBillProps {
  activeCollection?: FoodCollection | null;
  onClearActiveCollection?: () => void;
}

export const StudentBill: React.FC<StudentBillProps> = ({
  activeCollection: initialActiveCollection,
  onClearActiveCollection
}) => {
  const { student } = useAuth();
  const { success, error } = useToast();
  const { subscribe } = useRealtime();

  const [bill, setBill] = useState<(MonthlyBill & { payments: Payment[]; settings: BillingSettings }) | null>(null);
  const [collections, setCollections] = useState<FoodCollection[]>([]);
  const [currentCollection, setCurrentCollection] = useState<FoodCollection | null>(initialActiveCollection || null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('UPI');
  const [refId, setRefId] = useState<string>(
    () => `UPI-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [billData, myColls] = await Promise.all([
        api.getMyBill(month, year).catch(() => null),
        api.getMyCollections().catch(() => [])
      ]);
      setBill(billData);
      setCollections(myColls);

      // If no initial active collection was passed, find the most recent pending collection
      if (!initialActiveCollection) {
        const pendingColl = myColls.find(c => c.payment_status === 'PENDING');
        if (pendingColl) {
          setCurrentCollection(pendingColl);
        } else if (myColls.length > 0) {
          setCurrentCollection(myColls[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [month, year, initialActiveCollection]);

  useEffect(() => {
    fetchData();

    const unsub = subscribe(e => {
      if (e.type === 'BILL_UPDATED' || e.type === 'COLLECTION_MARKED' || e.type === 'PAYMENT_RECORDED') {
        fetchData();
      }
    });
    return () => unsub();
  }, [fetchData, subscribe]);

  useEffect(() => {
    if (initialActiveCollection) {
      setCurrentCollection(initialActiveCollection);
    }
  }, [initialActiveCollection]);

  const handlePayCurrentCollection = async () => {
    if (!currentCollection) return;

    setIsProcessingPayment(true);
    try {
      const res = await api.payCollection({
        collection_id: currentCollection.id,
        payment_method: selectedMethod,
        reference_id: refId.trim() || `REF-${Date.now().toString().slice(-6)}`
      });

      success(`Payment of ₹${res.payment.amount} successful!`);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Update current collection status to PAID
      setCurrentCollection(prev =>
        prev
          ? {
              ...prev,
              payment_status: 'PAID',
              payment_id: res.payment.id
            }
          : null
      );

      // Refresh bill and collections list
      await fetchData();
    } catch (err: any) {
      error(err.message || 'Payment settlement failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Paid In Full
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Partially Paid
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Payment Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Payment Pending
          </span>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Nice meal category label
  const formatMealCategory = (mealType?: string) => {
    if (!mealType) return 'Meal';
    if (mealType === 'SNACKS') return 'Evening Snacks';
    return mealType.charAt(0) + mealType.slice(1).toLowerCase();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Payment & Settlement</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Realtime food collection billing, per-meal settlement and official receipt records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          >
            {months.map((m, idx) => (
              <option key={m} value={idx + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488] font-mono"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 1. PROMINENT ACTIVE FOOD COLLECTION & PAYMENT SETTLEMENT CARD */}
      {currentCollection && (
        <div className="bg-white rounded-3xl border-2 border-teal-500/30 p-6 sm:p-7 shadow-lg shadow-teal-900/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-bl-full pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200 text-[#0D9488] flex items-center justify-center font-bold">
                <ReceiptIndianRupee className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider block">
                  Food Collection Settlement
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  {currentCollection.food_item_name || (currentCollection.food_items_snapshot && currentCollection.food_items_snapshot[0]) || formatMealCategory(currentCollection.meal_type)}
                </h2>
              </div>
            </div>

            <div>
              {currentCollection.payment_status === 'PAID' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  SUCCESSFUL
                </span>
              ) : currentCollection.payment_status === 'FAILED' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  FAILED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                  <Clock className="w-4 h-4 text-amber-600" />
                  PENDING PAYMENT
                </span>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Student</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                {currentCollection.student_name || student?.full_name}
              </p>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentCollection.student_phone || student?.phone_number}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Meal Category</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {formatMealCategory(currentCollection.meal_type)}
              </p>
              <span className="text-[10px] text-slate-400">Hostel Dining Counter</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Collected At</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5 font-mono">
                {new Date(currentCollection.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentCollection.collection_date}
              </span>
            </div>

            <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
              <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider block">Payable Amount</span>
              <p className="text-xl font-black text-emerald-700 mt-0.5 font-mono">
                ₹{currentCollection.amount || (bill?.settings ? (currentCollection.meal_type === 'BREAKFAST' ? bill.settings.breakfast_rate : currentCollection.meal_type === 'LUNCH' ? bill.settings.lunch_rate : currentCollection.meal_type === 'SNACKS' ? bill.settings.snacks_rate : bill.settings.dinner_rate) : 40)}
              </p>
            </div>
          </div>

          {/* Payment Method Selector & Confirmation */}
          {currentCollection.payment_status !== 'PAID' ? (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Payment Option:</span>
                  {(['UPI', 'CASH', 'CARD', 'BANK_TRANSFER'] as PaymentMethod[]).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSelectedMethod(method)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedMethod === method
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Ref / Transaction ID:</span>
                  <input
                    type="text"
                    value={refId}
                    onChange={e => setRefId(e.target.value)}
                    placeholder="e.g. UPI-928471"
                    className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white w-36 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={handlePayCurrentCollection}
                  disabled={isProcessingPayment}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md shadow-[#0D9488]/25 flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Recording Payment...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Confirm & Complete Payment (₹{currentCollection.amount || 40})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 font-bold" />
                <span>Payment recorded and credited to hostel billing.</span>
              </div>
              <span className="font-mono text-[11px] text-emerald-700 font-bold">
                Receipt ID: {currentCollection.payment_id || refId}
              </span>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading payment ledger...</div>
      ) : bill ? (
        <>
          {/* Main Financial Overview Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Statement Period</span>
                <h2 className="text-xl font-black text-slate-900">
                  {months[month - 1]} {year}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Billing Mode:{' '}
                  <strong className="text-teal-600">
                    Pay-Per-Meal (Actual Consumption)
                  </strong>
                </p>
              </div>

              <div>{getStatusBadge(bill.payment_status)}</div>
            </div>

            {/* Financial Figures */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Total Billed Meals</p>
                <p className="text-2xl font-black text-slate-900 mt-1 font-mono">₹{bill.total_amount.toFixed(2)}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {bill.total_meals} meals logged this month
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <p className="text-xs text-emerald-800 font-medium">Settled Amount</p>
                <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">₹{bill.paid_amount.toFixed(2)}</p>
                <p className="text-[11px] text-emerald-600 mt-1">Verified payments</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                <p className="text-xs text-amber-800 font-medium">Outstanding Balance</p>
                <p className="text-2xl font-black text-amber-700 mt-1 font-mono">₹{bill.balance_amount.toFixed(2)}</p>
                <p className="text-[11px] text-amber-600 mt-1">
                  {bill.balance_amount === 0 ? 'All meals settled' : 'Unsettled meals'}
                </p>
              </div>
            </div>

            {/* Meal Consumption Breakdown */}
            <div className="mt-6">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Itemized Consumption Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-4 rounded-l-xl">Meal Type</th>
                      <th className="py-2.5 px-4 text-center">Meals Collected</th>
                      <th className="py-2.5 px-4 text-center">Rate per Meal</th>
                      <th className="py-2.5 px-4 text-right rounded-r-xl">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-3 px-4 font-semibold">Breakfast</td>
                      <td className="py-3 px-4 text-center font-mono">{bill.breakfast_count}</td>
                      <td className="py-3 px-4 text-center font-mono">
                        ₹{bill.settings?.breakfast_rate || 45}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        ₹{(bill.breakfast_count * (bill.settings?.breakfast_rate || 45)).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold">Lunch</td>
                      <td className="py-3 px-4 text-center font-mono">{bill.lunch_count}</td>
                      <td className="py-3 px-4 text-center font-mono">
                        ₹{bill.settings?.lunch_rate || 85}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        ₹{(bill.lunch_count * (bill.settings?.lunch_rate || 85)).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold">Evening Snacks & Tea</td>
                      <td className="py-3 px-4 text-center font-mono">{bill.snacks_count}</td>
                      <td className="py-3 px-4 text-center font-mono">
                        ₹{bill.settings?.snacks_rate || 35}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        ₹{(bill.snacks_count * (bill.settings?.snacks_rate || 35)).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold">Dinner</td>
                      <td className="py-3 px-4 text-center font-mono">{bill.dinner_count}</td>
                      <td className="py-3 px-4 text-center font-mono">
                        ₹{bill.settings?.dinner_rate || 85}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        ₹{(bill.dinner_count * (bill.settings?.dinner_rate || 85)).toFixed(2)}
                      </td>
                    </tr>
                    {bill.late_fee > 0 && (
                      <tr className="text-amber-800 bg-amber-50/50">
                        <td className="py-3 px-4 font-semibold">Late Payment Fee</td>
                        <td className="py-3 px-4 text-center">-</td>
                        <td className="py-3 px-4 text-center">-</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">₹{bill.late_fee.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200 font-bold text-slate-900">
                    <tr>
                      <td className="py-3 px-4">Total Meals: {bill.total_meals}</td>
                      <td colSpan={2} className="py-3 px-4 text-right">Net Payable Amount:</td>
                      <td className="py-3 px-4 text-right font-mono text-sm text-teal-600">₹{bill.total_amount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Payment Receipts Ledger */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-600" />
              <span>Official Payment Receipts</span>
            </h3>

            {bill.payments && bill.payments.length > 0 ? (
              <div className="space-y-3">
                {bill.payments.map(payment => (
                  <div
                    key={payment.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 text-xs gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono text-sm">₹{payment.amount.toFixed(2)}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                          {payment.payment_method}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Ref: <span className="font-mono font-bold text-slate-700">{payment.reference_id || 'N/A'}</span> • {payment.notes || 'Meal collection settlement'}
                      </p>
                    </div>

                    <div className="text-slate-400 font-mono text-[11px] sm:text-right">
                      {new Date(payment.paid_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No payments recorded for this month yet.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="py-12 text-center text-slate-400 text-xs">No billing record found.</div>
      )}
    </div>
  );
};
