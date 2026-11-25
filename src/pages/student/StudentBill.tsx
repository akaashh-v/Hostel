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
  Sparkles,
  Copy,
  ExternalLink,
  QrCode
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
  const [copied, setCopied] = useState<boolean>(false);

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

      {/* Quick Collection Selector if multiple pending exist */}
      {collections.filter(c => c.payment_status === 'PENDING').length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Pending Collections:</span>
          {collections.filter(c => c.payment_status === 'PENDING').map(col => (
            <button
              key={col.id}
              onClick={() => setCurrentCollection(col)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentCollection?.id === col.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {col.food_item_name || col.meal_type} (₹{col.amount || 40})
            </button>
          ))}
        </div>
      )}

      {/* 1. PROMINENT ACTIVE FOOD COLLECTION & PAYMENT SETTLEMENT CARD */}
      {currentCollection && (() => {
        const payableAmount = currentCollection.amount || (bill?.settings ? (
          currentCollection.meal_type === 'BREAKFAST' ? bill.settings.breakfast_rate :
          currentCollection.meal_type === 'LUNCH' ? bill.settings.lunch_rate :
          currentCollection.meal_type === 'SNACKS' ? bill.settings.snacks_rate :
          bill.settings.dinner_rate
        ) : 40);

        return (
          <div className="bg-white rounded-3xl border-2 border-teal-500/30 p-6 sm:p-8 shadow-xl shadow-teal-900/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-teal-500/10 via-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-[#0D9488] flex items-center justify-center font-bold shadow-xs">
                  <ReceiptIndianRupee className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-[#0D9488] uppercase tracking-wider block">
                    Food Collection Settlement
                  </span>
                  <h2 className="text-xl font-black text-slate-900">
                    {currentCollection.food_item_name || (currentCollection.food_items_snapshot && currentCollection.food_items_snapshot[0]) || formatMealCategory(currentCollection.meal_type)}
                  </h2>
                </div>
              </div>

              <div>
                {currentCollection.payment_status === 'PAID' ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    PAYMENT SUCCESSFUL
                  </span>
                ) : currentCollection.payment_status === 'FAILED' ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    PAYMENT FAILED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-xs animate-pulse">
                    <Clock className="w-4 h-4 text-amber-600" />
                    PAYMENT PENDING
                  </span>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Student</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                  {currentCollection.student_name || student?.full_name}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentCollection.student_phone || student?.phone_number}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Meal Category</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {formatMealCategory(currentCollection.meal_type)}
                </p>
                <span className="text-[10px] text-slate-400">Tastebox Dining Counter</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Collected At</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5 font-mono">
                  {new Date(currentCollection.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentCollection.collection_date}
                </span>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider block">Payable Amount</span>
                <p className="text-2xl font-black text-emerald-700 mt-0.5 font-mono">
                  ₹{payableAmount}
                </p>
              </div>
            </div>

            {/* GOOGLE PAY & UPI SECTION */}
            {currentCollection.payment_status !== 'PAID' ? (
              <div className="space-y-6 pt-2 border-t border-slate-100">
                {/* Google Pay / UPI Card Layout */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
                  <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                    {/* Google Pay Official QR Image */}
                    <div className="shrink-0 flex flex-col items-center">
                      <div className="p-2.5 bg-white rounded-2xl shadow-xl border-2 border-white/20">
                        <img
                          src="/payment-qr.jpg"
                          alt="Google Pay UPI QR Code"
                          className="w-48 sm:w-56 h-auto rounded-xl object-contain bg-white"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-300 mt-2 flex items-center gap-1">
                        <QrCode className="w-3.5 h-3.5 text-teal-400" />
                        Scan with Google Pay or any UPI app
                      </span>
                    </div>

                    {/* UPI Details & GPay Direct Action */}
                    <div className="flex-1 space-y-4 w-full">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-teal-300 text-[11px] font-bold border border-white/10 mb-2">
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>Google Pay & Instant UPI Settlement</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-white">
                          Pay ₹{payableAmount} for {currentCollection.food_item_name || 'Food Collection'}
                        </h3>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Scan the QR code above or tap the button below to launch Google Pay directly on your device.
                        </p>
                      </div>

                      {/* Payee Info & Copy UPI ID */}
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 text-[11px] font-medium">Payee Name:</span>
                          <span className="font-extrabold text-white">Sinsiya Nihala</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                          <div>
                            <span className="text-[10px] text-teal-300 font-bold uppercase tracking-wider block">UPI ID</span>
                            <span className="font-mono font-black text-sm text-white select-all">ismailpk153@okicici</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('ismailpk153@okicici');
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            {copied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-300">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-200" />
                                <span>Copy UPI</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Direct Launch Google Pay Button (iOS & Android optimized) */}
                      <button
                        type="button"
                        onClick={() => {
                          const isIOSDevice = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
                          const upiQuery = `pa=ismailpk153@okicici&pn=Sinsiya%20Nihala&am=${payableAmount}&cu=INR&tn=Tastebox%20Food%20Collection`;
                          
                          if (isIOSDevice) {
                            // On iOS: trigger gpay:// so iOS opens Google Pay directly instead of WhatsApp!
                            window.location.href = `gpay://upi/pay?${upiQuery}`;
                            // Fallback to tez:// in case older Google Pay Tez is installed
                            setTimeout(() => {
                              window.location.href = `tez://upi/pay?${upiQuery}`;
                            }, 600);
                          } else {
                            // On Android / desktop: standard upi:// triggers Google Pay intent
                            window.location.href = `upi://pay?${upiQuery}`;
                          }
                        }}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-sm shadow-xl active:scale-95 transition-all text-center cursor-pointer"
                      >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                        </svg>
                        <span>Pay ₹{payableAmount} via Google Pay</span>
                        <ExternalLink className="w-4 h-4 text-slate-500" />
                      </button>

                      {/* Additional UPI Apps options */}
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-bold text-slate-300">
                        <span>Or pay with:</span>
                        <a
                          href={`phonepe://pay?pa=ismailpk153@okicici&pn=Sinsiya%20Nihala&am=${payableAmount}&cu=INR&tn=Tastebox`}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                          PhonePe
                        </a>
                        <a
                          href={`paytmmp://pay?pa=ismailpk153@okicici&pn=Sinsiya%20Nihala&am=${payableAmount}&cu=INR&tn=Tastebox`}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                          Paytm
                        </a>
                        <a
                          href={`upi://pay?pa=ismailpk153@okicici&pn=Sinsiya%20Nihala&am=${payableAmount}&cu=INR&tn=Tastebox`}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                          Universal UPI
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirmation and Reference Number Form */}
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-800 block">
                      Step 2: Confirm Payment Once Completed in Google Pay
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-medium">UPI / Transaction Ref ID:</span>
                      <input
                        type="text"
                        value={refId}
                        onChange={e => setRefId(e.target.value)}
                        placeholder="e.g. UPI-928471"
                        className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white w-40 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePayCurrentCollection}
                    disabled={isProcessingPayment}
                    className="px-6 py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md shadow-[#0D9488]/25 flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Recording Payment...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Confirm & Mark as Paid (₹{payableAmount})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-5 bg-emerald-50 rounded-2xl border-2 border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-emerald-900">Payment Successful & Recorded!</p>
                    <p className="text-emerald-700 text-[11px] mt-0.5">
                      Settled ₹{payableAmount} via Google Pay (UPI: ismailpk153@okicici). Official hostel mess credit updated.
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono text-[11px] text-emerald-800 bg-white/70 px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
                  <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">Transaction Ref</span>
                  <span className="font-bold">{currentCollection.payment_id || refId}</span>
                </div>
              </div>
            )}
          </div>
        );
      })()}

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
