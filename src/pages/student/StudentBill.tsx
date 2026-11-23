import React, { useState, useEffect } from 'react';
import {
  ReceiptIndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  FileText,
  Printer
} from 'lucide-react';
import { MonthlyBill, Payment, BillingSettings } from '../../types';
import { api } from '../../services/api';

export const StudentBill: React.FC = () => {
  const [bill, setBill] = useState<(MonthlyBill & { payments: Payment[]; settings: BillingSettings }) | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchBill = async () => {
      setIsLoading(true);
      try {
        const data = await api.getMyBill(month, year);
        setBill(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBill();
  }, [month, year]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Paid In Full
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            Partially Paid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <AlertCircle className="w-3.5 h-3.5" />
            Payment Pending
          </span>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Monthly Mess Statement</h1>
          <p className="text-xs text-slate-500 mt-0.5">Itemized food collection billing and payment status</p>
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
          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading monthly statement...</div>
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
                    {bill.billing_mode === 'FIXED' ? 'Fixed Monthly Package' : 'Pay-Per-Meal (Actual Consumption)'}
                  </strong>
                </p>
              </div>

              <div>{getStatusBadge(bill.payment_status)}</div>
            </div>

            {/* Financial Figures */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Total Billed Amount</p>
                <p className="text-2xl font-black text-slate-900 mt-1 font-mono">₹{bill.total_amount.toFixed(2)}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {bill.total_meals} meals logged this month
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <p className="text-xs text-emerald-800 font-medium">Paid Amount</p>
                <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">₹{bill.paid_amount.toFixed(2)}</p>
                <p className="text-[11px] text-emerald-600 mt-1">Verified transactions</p>
              </div>

              <div className="p-4 rounded-2xl bg-red-50/60 border border-red-100">
                <p className="text-xs text-red-800 font-medium">Outstanding Balance</p>
                <p className="text-2xl font-black text-red-600 mt-1 font-mono">₹{bill.balance_amount.toFixed(2)}</p>
                <p className="text-[11px] text-red-500 mt-1">
                  {bill.balance_amount === 0 ? 'No dues pending' : 'Pay at the mess office'}
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
              <span>Payment Receipts & Receipts</span>
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
                        Ref: <span className="font-mono">{payment.reference_id || 'N/A'}</span> • Received by: {payment.received_by}
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
                No payments have been recorded for this month yet.
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
