import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Banknote, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, X,
  TrendingUp, Utensils, Wallet, SlidersHorizontal, Plus, Minus, PiggyBank,
  Mail, Send, Sparkles, Calendar, Archive,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MONTHS_BN = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];

function MealAdjustmentModal({ members, month, year, onClose, onSaved }) {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || amount === '') return;
    setLoading(true);
    setError('');
    try {
      await api.post('/meal-adjustments', { userId, month, year, amount: parseFloat(amount), reason });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'ত্রুটি হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-modal w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 sm:p-7">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">মিল সমন্বয়</h2>
            <p className="text-xs text-gray-400 mt-0.5">{MONTHS_BN[month - 1]} {year}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">সদস্য</label>
            <select value={userId} onChange={e => setUserId(e.target.value)} className="form-input" required>
              <option value="">-- সদস্য বেছে নিন --</option>
              {members.map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">মিলের পরিমাণ</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setAmount(v => v === '' ? '-1' : String(parseFloat(v) - 1))}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 font-bold text-lg transition-all">
                <Minus size={16} />
              </button>
              <input type="number" step="0.5" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="যেমন: +2 বা -1" className="form-input flex-1 text-center" required />
              <button type="button" onClick={() => setAmount(v => v === '' ? '1' : String(parseFloat(v) + 1))}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl border border-emerald-200 font-bold transition-all">
                <Plus size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">ধনাত্মক = যোগ করুন, ঋণাত্মক = বিয়োগ করুন</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">কারণ (ঐচ্ছিক)</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)}
              placeholder="মিল সমন্বয়ের কারণ" className="form-input" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">বাতিল</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all text-sm shadow-md shadow-brand-500/20">
              {loading ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PayFromFundModal({ bill, onClose, onPay, totalAdvanceFund }) {
  const maxPayable = Math.min(bill.netBalance, bill.advance, totalAdvanceFund);
  const [paidAmount, setPaidAmount] = useState(maxPayable > 0 ? maxPayable.toFixed(2) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paidAmount || parseFloat(paidAmount) <= 0) {
      setError('সঠিক পরিমাণ দিন');
      return;
    }
    if (parseFloat(paidAmount) > totalAdvanceFund) {
      setError(`অগ্রিম তহবিলে পর্যাপ্ত নেই। সর্বোচ্চ ৳ ${totalAdvanceFund.toFixed(2)}`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onPay(bill.user._id, parseFloat(paidAmount), true);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-modal w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 sm:p-7">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">অগ্রিম তহবিল থেকে পরিশোধ</h2>
            <p className="text-xs text-gray-400 mt-0.5">{bill.user.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 p-4 rounded-xl space-y-2.5 text-sm"
          style={{ background: '#fefce8', border: '1.5px solid #fde047' }}>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">সদস্য</span>
            <span className="text-gray-900 font-semibold">{bill.user.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">পাবেন</span>
            <span className="text-emerald-600 font-bold">৳ {bill.netBalance?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">অগ্রিম জমা</span>
            <span className="text-blue-600 font-semibold">৳ {bill.advance?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <span className="text-amber-600 font-medium">তহবিলে আছে</span>
            <span className="text-amber-700 font-bold">৳ {totalAdvanceFund.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-sm">
            <span className="text-gray-500 font-medium">সর্বোচ্চ দেওয়া যাবে</span>
            <span className="text-amber-700 font-bold text-base">৳ {maxPayable.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">প্রদত্ত পরিমাণ (৳)</label>
            <input type="number" step="0.01" min="0.01" max={maxPayable} value={paidAmount}
              onChange={(e) => { setPaidAmount(e.target.value); setError(''); }}
              placeholder="0.00"
              className="form-input" required />
            <p className="text-xs text-gray-400 mt-1">অগ্রিম তহবিল থেকে সর্বোচ্চ ৳ {maxPayable.toFixed(2)}</p>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">বাতিল</button>
            <button type="submit" disabled={loading || maxPayable <= 0}
              className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all text-sm shadow-md shadow-amber-500/20">
              {loading ? 'সংরক্ষণ...' : 'পরিশোধ দিন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentModal({ bill, onClose, onPay, totalAdvanceFund }) {
  const isMessOwesMember = bill.netBalance >= 0;
  const maxPayable = isMessOwesMember ? Math.min(bill.netBalance, bill.advance, totalAdvanceFund) : bill.foodCost;
  const [paidAmount, setPaidAmount] = useState(maxPayable > 0 ? maxPayable.toFixed(2) : '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onPay(bill.user._id, parseFloat(paidAmount), isMessOwesMember);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-modal w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 sm:p-7">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isMessOwesMember ? 'মেস থেকে পেমেন্ট দিন' : 'পেমেন্ট রেকর্ড'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{bill.user.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 p-4 rounded-xl space-y-2.5 text-sm"
          style={{ background: '#faf9ff', border: '1.5px solid #e8e4f8' }}>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">সদস্য</span>
            <span className="text-gray-900 font-semibold">{bill.user.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">মোট মিল</span>
            <span className="text-gray-700">{bill.totalMeals} টি</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">মিল রেট</span>
            <span className="text-gray-700">৳ {bill.mealRate?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 font-bold">
            <span className="text-gray-600">খাদ্য বিল</span>
            <span className="text-brand-600 text-base">৳ {bill.foodCost?.toFixed(2)}</span>
          </div>
          {(bill.expensePaid > 0) && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">বাজার পরিশোধ করেছেন</span>
              <span className="text-emerald-600 font-semibold">- ৳ {bill.expensePaid?.toFixed(2)}</span>
            </div>
          )}
          {(bill.advance > 0) && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">অগ্রিম জমা</span>
              <span className="text-blue-600 font-semibold">- ৳ {bill.advance?.toFixed(2)}</span>
            </div>
          )}
          <div className={`flex justify-between items-center pt-2 border-t border-gray-100 font-bold text-base ${bill.netBalance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            <span>নেট ব্যালেন্স</span>
            <span>{bill.netBalance >= 0 ? `পাবেন ৳ ${bill.netBalance?.toFixed(2)}` : `দেবেন ৳ ${Math.abs(bill.netBalance)?.toFixed(2)}`}</span>
          </div>
          {isMessOwesMember && bill.advance > 0 && (
            <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-sm">
              <span className="text-amber-600 font-medium">তহবিলে আছে</span>
              <span className="text-amber-700 font-bold">৳ {totalAdvanceFund.toFixed(2)}</span>
            </div>
          )}
          {isMessOwesMember && bill.advance > 0 && (
            <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-sm">
              <span className="text-gray-500 font-medium">সর্বোচ্চ প্রদানযোগ্য</span>
              <span className="text-amber-700 font-bold">৳ {maxPayable.toFixed(2)}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              {isMessOwesMember ? 'প্রদত্ত পরিমাণ (মেস থেকে) (৳)' : 'প্রদত্ত পরিমাণ (৳)'}
            </label>
            <input type="number" step="0.01" min="0" max={isMessOwesMember ? maxPayable : undefined} value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="form-input" required />
            {isMessOwesMember && bill.advance > 0 && (
              <p className="text-xs text-gray-400 mt-1">অগ্রিম তহবিল থেকে সর্বোচ্চ ৳ {maxPayable.toFixed(2)} (তহবিলে: ৳ {totalAdvanceFund.toFixed(2)})</p>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">বাতিল</button>
            <button type="submit" disabled={loading}
              className={`flex-1 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all text-sm shadow-md ${
                isMessOwesMember
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
              }`}>
              {loading ? 'সংরক্ষণ...' : 'নিশ্চিত করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Billing() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(null);
  const [fundPayModal, setFundPayModal] = useState(null);
  const [adjModal, setAdjModal] = useState(false);
  const [totalAdvanceFund, setTotalAdvanceFund] = useState(0);
  const [emailStatus, setEmailStatus] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailToast, setEmailToast] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  const fetchBills = async () => {
    setLoading(true);
    try {
      const [billsRes, advRes] = await Promise.all([
        api.get(`/reports/all-bills?month=${month}&year=${year}`),
        api.get(`/advance-payments?month=${month}&year=${year}`),
      ]);
      setData(billsRes.data.data);
      const totalAdv = advRes.data.data.reduce((sum, a) => sum + a.amount, 0);
      setTotalAdvanceFund(totalAdv);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailStatus = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get(`/reports/billing-email-status?month=${month}&year=${year}`);
      setEmailStatus(res.data.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchBills(); fetchEmailStatus(); }, [month, year]);


  const handlePay = async (userId, paidAmount, isMessOwesMember) => {
    const bill = data.bills.find((b) => b.user._id === userId);
    await api.post('/payments', { userId, month, year, totalBill: bill.foodCost, paidAmount, isMessOwesMember });
    fetchBills();
  };

  const handleSendBills = async (force = false) => {
    setSendingEmail(true);
    setEmailToast('');
    try {
      const res = await api.post('/reports/send-monthly-bills', { month, year, force });
      if (res.data.skipped && res.data.reason === 'already-sent') {
        setEmailToast(`এই মাসের বিল আগেই পাঠানো হয়েছে (${new Date(res.data.sentAt).toLocaleString('bn-BD')})`);
      } else {
        const sent = res.data.sent || 0;
        const skipped = res.data.skipped || 0;
        setEmailToast(`✓ ${sent} জন সদস্যকে বিল ইমেইল পাঠানো হয়েছে${skipped ? ` · ${skipped} জন বাদ পড়েছে (ইমেইল নেই বা মিল নেই)` : ''}`);
      }
      fetchEmailStatus();
      setTimeout(() => setEmailToast(''), 6000);
    } catch (err) {
      setEmailToast(err.response?.data?.error || 'ইমেইল পাঠানো ব্যর্থ হয়েছে');
      setTimeout(() => setEmailToast(''), 6000);
    } finally {
      setSendingEmail(false);
    }
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const paidCount = data?.bills?.filter((b) => b.payment?.status === 'পরিশোধিত').length || 0;
  const dueCount  = (data?.bills?.length || 0) - paidCount;
  const archivedInBills = data?.bills?.filter((b) => b.user?.isArchived).length || 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {payModal && <PaymentModal bill={payModal} onClose={() => setPayModal(null)} onPay={handlePay} totalAdvanceFund={totalAdvanceFund} />}
      {fundPayModal && <PayFromFundModal bill={fundPayModal} onClose={() => setFundPayModal(null)} onPay={handlePay} totalAdvanceFund={totalAdvanceFund} />}
      {adjModal && (
        <MealAdjustmentModal
          members={data?.bills?.map(b => b.user) || []}
          month={month} year={year}
          onClose={() => setAdjModal(false)}
          onSaved={fetchBills}
        />
      )}

      {/* ── Hero Header ── */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #ecfeff 0%, #f5f3ff 50%, #fef3c7 100%)', border: '1.5px solid #ddd6fe' }}>
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }} />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}>
                <Banknote size={14} className="text-white" />
              </div>
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em]">মাসিক হিসাব</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{t('sidebar.billing')}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <CheckCircle size={10} /> {paidCount} পরিশোধিত
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 border border-red-200 text-red-600 text-xs font-bold">
                <AlertCircle size={10} /> {dueCount} বাকি
              </span>
              {archivedInBills > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold">
                  <Archive size={10} /> {archivedInBills} আর্কাইভড
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start lg:self-end">
            {isAdmin && (
              <button onClick={() => setAdjModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/70 backdrop-blur hover:bg-white text-violet-700 border border-violet-200 rounded-xl text-sm font-semibold transition-all shadow-sm">
                <SlidersHorizontal size={15} />
                মিল সমন্বয়
              </button>
            )}
            <div className="flex items-center gap-1 bg-white/80 backdrop-blur rounded-xl px-1 border border-white shadow-sm">
              <button onClick={prevMonth} className="p-2 hover:bg-brand-50 rounded-xl text-gray-400 hover:text-brand-600 transition-all">
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1.5 px-2">
                <Calendar size={12} className="text-brand-500" />
                <span className="text-gray-700 font-bold w-28 sm:w-32 text-center text-sm">{MONTHS_BN[month - 1]} {year}</span>
              </div>
              <button onClick={nextMonth} className="p-2 hover:bg-brand-50 rounded-xl text-gray-400 hover:text-brand-600 transition-all">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {data?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="glass-panel stat-rose p-5 rounded-2xl flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#fee2e2' }}>
              <Wallet size={20} style={{ color: '#e11d48' }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('billing.total_expense')}</p>
              <p className="text-gray-900 text-xl font-bold mt-0.5">৳ {data.summary.totalCost.toLocaleString()}</p>
            </div>
          </div>
          <div className="glass-panel stat-emerald p-5 rounded-2xl flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#dcfce7' }}>
              <Utensils size={20} style={{ color: '#059669' }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('billing.total_meals')}</p>
              <p className="text-gray-900 text-xl font-bold mt-0.5">{data.summary.totalMealsCount} টি</p>
            </div>
          </div>
          <div className="glass-panel stat-violet p-5 rounded-2xl flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#ede9fe' }}>
              <TrendingUp size={20} style={{ color: '#7c3aed' }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('billing.meal_rate')}</p>
              <p className="text-brand-700 text-xl font-bold mt-0.5">৳ {data.summary.mealRate.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Advance Fund + Email panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="glass-card lg:col-span-2 rounded-2xl p-5 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, #fefce8, #fef08a)', border: '1.5px solid #fde047' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#fef9c3' }}>
            <PiggyBank size={22} style={{ color: '#ca8a04' }} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">অগ্রিম তহবিল</p>
            <p className="text-amber-800 text-2xl font-bold mt-0.5">৳ {totalAdvanceFund.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-amber-600 mt-0.5">{MONTHS_BN[month - 1]} {year} মাসের মোট অগ্রিম</p>
          </div>
        </div>

        {isAdmin && (
          <div className="glass-card lg:col-span-3 rounded-2xl p-5 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe,#dbeafe)', border: '1.5px solid #ddd6fe' }}>
            <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)', boxShadow: '0 8px 20px rgba(124,58,237,0.3)' }}>
                <Mail size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-gray-900">মাসিক বিল ইমেইল</p>
                  {emailStatus?.sent ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      <CheckCircle size={9} /> পাঠানো হয়েছে
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold">
                      <Sparkles size={9} /> এখনো পাঠানো হয়নি
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {emailStatus?.sent
                    ? `${emailStatus.sentCount} জনের কাছে পাঠানো হয়েছে · ${new Date(emailStatus.sentAt).toLocaleString('bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                    : `${emailStatus?.membersWithEmail ?? 0}/${emailStatus?.totalActiveMembers ?? 0} সদস্যের ইমেইল আছে · মাসের শেষে স্বয়ংক্রিয় পাঠানো হবে`}
                </p>
              </div>
              <button onClick={() => handleSendBills(emailStatus?.sent === true)} disabled={sendingEmail || (emailStatus?.membersWithEmail ?? 0) === 0}
                className="btn-primary flex items-center justify-center gap-2 text-sm shrink-0 disabled:opacity-50">
                {sendingEmail ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {sendingEmail
                  ? 'পাঠানো হচ্ছে...'
                  : emailStatus?.sent
                  ? 'আবার পাঠান'
                  : 'এখনই পাঠান'}
              </button>
            </div>
            {emailToast && (
              <div className="relative mt-3 px-3 py-2 rounded-xl bg-white/80 backdrop-blur border border-white text-xs text-gray-700">
                {emailToast}
              </div>
            )}
            {(emailStatus?.membersWithEmail ?? 0) === 0 && (
              <div className="relative mt-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-center gap-2">
                <AlertCircle size={12} />
                সদস্যদের প্রোফাইলে ইমেইল ঠিকানা যোগ করুন (Members পেজ থেকে) — তখন বিল ইমেইল করা যাবে।
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-14 text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">লোড হচ্ছে...</p>
        </div>
      ) : !data?.bills?.length ? (
        <div className="glass-panel rounded-2xl p-14 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Banknote size={32} className="text-brand-400" />
          </div>
          <p className="text-gray-500 font-medium">এই মাসে কোনো ডেটা নেই</p>
        </div>
      ) : (
        <>
          {/* ── Mobile cards ─── */}
          <div className="lg:hidden space-y-3">
            {data.bills.map((bill) => {
              const isPaid = bill.payment?.status === 'পরিশোধিত';
              const isArchivedUser = bill.user?.isArchived;
              return (
                <div key={bill.user._id} className={`glass-panel rounded-2xl p-4 ${isArchivedUser ? 'bg-amber-50/40' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${isArchivedUser ? 'opacity-60' : ''}`}
                        style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8)' }}>
                        {bill.user.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`font-semibold text-sm truncate ${isArchivedUser ? 'text-gray-500' : 'text-gray-900'}`}>{bill.user.name}</p>
                          {isArchivedUser && <span className="badge badge-amber"><Archive size={8} /> আর্কাইভড</span>}
                        </div>
                        <p className="text-xs text-gray-400">{bill.user.phone}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-gray-900 font-bold">৳ {bill.foodCost.toFixed(2)}</p>
                      <div className="mt-1">
                        {isPaid
                          ? <span className="badge badge-green"><CheckCircle size={9} /> পরিশোধিত</span>
                          : <span className="badge badge-red"><AlertCircle size={9} /> বাকি</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">মিল:</span>
                      <span className="text-gray-700 font-medium">{bill.totalMeals} টি</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">রেট:</span>
                      <span className="text-gray-700 font-medium">৳ {bill.mealRate.toFixed(2)}</span>
                    </div>
                    {bill.expensePaid > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">বাজার:</span>
                        <span className="text-emerald-600 font-medium">৳ {bill.expensePaid.toFixed(2)}</span>
                      </div>
                    )}
                    {bill.advance > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">অগ্রিম:</span>
                        <span className="text-blue-600 font-medium">৳ {bill.advance.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 col-span-2">
                      <span className="text-gray-400">নেট:</span>
                      <span className={`font-semibold ${bill.netBalance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {bill.netBalance >= 0 ? `পাবেন ৳${bill.netBalance.toFixed(2)}` : `দেবেন ৳${Math.abs(bill.netBalance).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                  {isAdmin && !isPaid && (
                    <div className="mt-3 flex gap-2">
                      {bill.netBalance >= 0 && bill.advance > 0 && totalAdvanceFund > 0 ? (
                        <button onClick={() => setFundPayModal(bill)}
                          className="flex-1 py-2 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-all border border-amber-200">
                          তহবিল থেকে দিন
                        </button>
                      ) : null}
                      {bill.netBalance < 0 && (
                        <button onClick={() => setPayModal(bill)}
                          className="flex-1 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all border border-emerald-200">
                          পরিশোধ নিন
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Desktop table ─── */}
          <div className="hidden lg:block glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">সদস্য</th>
                    <th className="text-center px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('billing.total_meals')}</th>
                    <th className="text-center px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('billing.meal_rate')}</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">খাদ্য বিল</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">বাজার দিয়েছেন</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">অগ্রিম</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">নেট ব্যালেন্স</th>
                    <th className="text-center px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('billing.payment_status')}</th>
                    {isAdmin && <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">কার্যক্রম</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.bills.map((bill) => {
                    const isPaid = bill.payment?.status === 'পরিশোধিত';
                    const isArchivedUser = bill.user?.isArchived;
                    return (
                      <tr key={bill.user._id} className={`table-row-hover transition-colors ${isArchivedUser ? 'bg-amber-50/40' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${isArchivedUser ? 'opacity-60' : ''}`}
                              style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8)' }}>
                              {bill.user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className={`font-semibold text-sm ${isArchivedUser ? 'text-gray-500' : 'text-gray-900'}`}>{bill.user.name}</p>
                                {isArchivedUser && <span className="badge badge-amber"><Archive size={9} /> আর্কাইভড</span>}
                              </div>
                              <p className="text-xs text-gray-400">{bill.user.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center text-gray-600 font-medium">{bill.totalMeals}</td>
                        <td className="px-4 py-4 text-center text-gray-600">৳ {bill.mealRate.toFixed(2)}</td>
                        <td className="px-4 py-4 text-right text-gray-900 font-bold">৳ {bill.foodCost.toFixed(2)}</td>
                        <td className="px-4 py-4 text-right text-emerald-600 font-medium">
                          {bill.expensePaid > 0 ? `৳ ${bill.expensePaid.toFixed(2)}` : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-4 text-right text-blue-600 font-medium">
                          {bill.advance > 0 ? `৳ ${bill.advance.toFixed(2)}` : <span className="text-gray-300">—</span>}
                        </td>
                        <td className={`px-4 py-4 text-right font-bold ${bill.netBalance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {bill.netBalance >= 0
                            ? `পাবেন ৳${bill.netBalance.toFixed(2)}`
                            : `দেবেন ৳${Math.abs(bill.netBalance).toFixed(2)}`}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {isPaid
                            ? <span className="badge badge-green"><CheckCircle size={10} /> {t('billing.paid')}</span>
                            : <span className="badge badge-red"><AlertCircle size={10} /> {t('billing.due')}</span>}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-right">
                            {!isPaid ? (
                              <div className="flex gap-2 justify-end">
                                {bill.netBalance >= 0 && bill.advance > 0 && totalAdvanceFund > 0 ? (
                                  <button onClick={() => setFundPayModal(bill)}
                                    className="px-4 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-all border border-amber-200">
                                    তহবিল থেকে দিন
                                  </button>
                                ) : null}
                                {bill.netBalance < 0 && (
                                  <button onClick={() => setPayModal(bill)}
                                    className="px-4 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-all border border-emerald-200">
                                    পরিশোধ নিন
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300">
                                {bill.payment?.paymentDate ? new Date(bill.payment.paymentDate).toLocaleDateString('bn-BD') : ''}
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
