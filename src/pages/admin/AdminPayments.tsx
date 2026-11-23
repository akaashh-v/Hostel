import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  CreditCard,
  Plus,
  Search,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  User,
  Shield,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { MonthlyBill, Payment, PaymentMethod } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminPayments: React.FC = () => {
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [search, setSearch] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Payment Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [referenceId, setReferenceId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [receivedBy, setReceivedBy] = useState<string>('Mess Warden');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const { success, error } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [billsData, studentsData] = await Promise.all([
        api.getMonthlyBills(month, year),
        api.getStudents()
      ]);
      setBills(billsData || []);
      setStudents(studentsData || []);

      // Flatten payments across bills
      const allPayments: Payment[] = (billsData || []).flatMap((b: any) =>
        (b.payments || []).map((p: any) => ({
          ...p,
          student_name: b.student_name,
          student_phone: b.student_phone,
          month: b.month,
          year: b.year
        }))
      );
      setPayments(allPayments);
    } catch (err: any) {
      console.error(err);
      error('Failed to load payment records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [month, year]);

  const handleOpenRecordPayment = (bill?: MonthlyBill) => {
    if (bill) {
      setSelectedBillId(bill.id);
      setPaymentAmount(bill.balance_amount > 0 ? bill.balance_amount.toString() : '');
    } else {
      setSelectedBillId(bills[0]?.id || '');
      setPaymentAmount('');
    }
    setPaymentMethod('UPI');
    setReferenceId('');
    setNotes('');
    setReceivedBy('Mess Warden');
    setIsModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillId) {
      error('Please select a student billing statement');
      return;
    }

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      error('Please enter a valid positive payment amount');
      return;
    }

    setIsSaving(true);
    try {
      await api.recordPayment({
        bill_id: selectedBillId,
        amount: amt,
        payment_method: paymentMethod,
        reference_id: referenceId,
        notes: notes,
        received_by: receivedBy
      });
      success(`Recorded payment receipt of ₹${amt.toFixed(2)}`);
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      error(err.message || 'Failed to record payment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportExcel = () => {
    const data = filteredPayments.map(p => ({
      'Receipt ID': p.id,
      'Student Name': (p as any).student_name || 'N/A',
      'Phone': (p as any).student_phone || 'N/A',
      'Amount (₹)': p.amount,
      'Payment Method': p.payment_method,
      'Reference / UTR ID': p.reference_id || 'N/A',
      'Received By': p.received_by || 'Mess Warden',
      'Date & Time': new Date(p.paid_at || new Date().toISOString()).toLocaleString(),
      'Notes': p.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
    XLSX.writeFile(wb, `HOSTEL_MESS_Payments_${month}_${year}.xlsx`);
    success('Exported payments ledger to Excel');
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch =
      ((p as any).student_name && (p as any).student_name.toLowerCase().includes(search.toLowerCase())) ||
      ((p as any).student_phone && (p as any).student_phone.includes(search)) ||
      (p.reference_id && p.reference_id.toLowerCase().includes(search.toLowerCase()));

    const matchesMethod = selectedMethod === 'ALL' || p.payment_method === selectedMethod;
    return matchesSearch && matchesMethod;
  });

  const totalCollectedInMonth = filteredPayments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log student dining payments, issue official receipts, and audit transaction records
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => handleOpenRecordPayment()}
            style={{ backgroundColor: '#0D9488', color: '#FFFFFF' }}
            className="px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-md shadow-[#0D9488]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Received (This Month)</p>
          <p className="text-2xl font-black text-[#0D9488] mt-1 font-mono">₹{totalCollectedInMonth.toFixed(2)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{filteredPayments.length} verified receipts</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Channel</p>
          <p className="text-2xl font-black text-slate-800 mt-1">UPI / Digital</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Instant ledger reconciliation</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Audit Security</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">Immutable Log</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Changes logged to audit trail</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student, phone, or UTR..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488] bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          >
            {[
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ].map((m, idx) => (
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
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <select
            value={selectedMethod}
            onChange={e => setSelectedMethod(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CARD">Card</option>
          </select>
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900">
            Recorded Transactions ({filteredPayments.length})
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            HOSTEL MESS Finance Register
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading payment ledger...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-20 text-center">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No payment records found</p>
            <p className="text-xs text-slate-400 mt-1">Click "Record Payment" to record a student payment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference / UTR ID</th>
                  <th className="py-3 px-4">Received By</th>
                  <th className="py-3 px-4 font-mono">Date & Time</th>
                  <th className="py-3 px-4 text-center">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{(p as any).student_name || 'Student'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{(p as any).student_phone || 'N/A'}</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700 font-mono text-sm">
                      ₹{p.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {p.reference_id || 'Cash Entry'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.received_by || 'Mess Warden'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {new Date(p.paid_at || new Date().toISOString()).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        SETTLED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#0D9488] flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record Student Payment</h3>
                  <p className="text-[11px] text-slate-500">Official receipt generation & bill reconciliation</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select Student Bill Statement
                </label>
                <select
                  required
                  value={selectedBillId}
                  onChange={e => {
                    setSelectedBillId(e.target.value);
                    const b = bills.find(x => x.id === e.target.value);
                    if (b) setPaymentAmount(b.balance_amount.toString());
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488] bg-slate-50"
                >
                  <option value="">-- Choose student statement --</option>
                  {bills.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.student_name} ({b.student_phone}) • Due: ₹{b.balance_amount.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 1500"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488] font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488] bg-slate-50"
                >
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                  <option value="CASH">Cash Counter Payment</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer / NEFT</option>
                  <option value="CARD">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Reference / UTR Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI-92839281920 or Receipt #104"
                  value={referenceId}
                  onChange={e => setReferenceId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Received By / Officer
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={e => setReceivedBy(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Partial advance for hostel semester"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{ backgroundColor: '#0D9488', color: '#FFFFFF' }}
                  className="flex-1 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition-colors shadow-md disabled:opacity-50"
                >
                  {isSaving ? 'Recording...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
