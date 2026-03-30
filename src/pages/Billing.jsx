import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, X, TrendingUp, Utensils, Wallet, ShoppingCart } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MONTHS_BN = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];

function PaymentModal({ bill, onClose, onPay }) {
  const [paidAmount, setPaidAmount] = useState(bill.foodCost?.toFixed(2) || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onPay(bill.user._id, parseFloat(paidAmount));
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
            <h2 className="text-lg font-bold text-gray-900">পেমেন্ট রেকর্ড</h2>
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
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">প্রদত্ত পরিমাণ (৳)</label>
            <input type="number" step="0.01" min="0" value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="form-input" required />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">বাতিল</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all text-sm shadow-md shadow-emerald-500/20">
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

  const isAdmin = currentUser?.role === 'admin';

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/all-bills?month=${month}&year=${year}`);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBills(); }, [month, year]);

  const handlePay = async (userId, paidAmount) => {
    const bill = data.bills.find((b) => b.user._id === userId);
    await api.post('/payments', { userId, month, year, totalBill: bill.foodCost, paidAmount });
    fetchBills();
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const paidCount = data?.bills?.filter((b) => b.payment?.status === 'পরিশোধিত').length || 0;
  const dueCount  = (data?.bills?.length || 0) - paidCount;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {payModal && <PaymentModal bill={payModal} onClose={() => setPayModal(null)} onPay={handlePay} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">{t('sidebar.billing')}</h1>
          <p className="text-gray-400 mt-1 text-sm">
            <span className="text-emerald-600 font-semibold">{paidCount} পরিশোধিত</span>
            <span className="mx-2 text-gray-300">·</span>
            <span className="text-red-500 font-semibold">{dueCount} বাকি</span>
          </p>
        </div>
        <div className="flex items-center gap-1 glass-panel rounded-xl px-1 self-start sm:self-auto">
          <button onClick={prevMonth} className="p-2 hover:bg-brand-50 rounded-xl text-gray-400 hover:text-brand-600 transition-all">
            <ChevronLeft size={18} />
          </button>
          <span className="text-gray-700 font-semibold w-28 sm:w-32 text-center text-sm">{MONTHS_BN[month - 1]} {year}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-brand-50 rounded-xl text-gray-400 hover:text-brand-600 transition-all">
            <ChevronRight size={18} />
          </button>
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
              return (
                <div key={bill.user._id} className="glass-panel rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8)' }}>
                        {bill.user.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-gray-900 font-semibold text-sm truncate">{bill.user.name}</p>
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
                    <button onClick={() => setPayModal(bill)}
                      className="mt-3 w-full py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all border border-emerald-200">
                      পরিশোধ নিন
                    </button>
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
                    return (
                      <tr key={bill.user._id} className="table-row-hover transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                              style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8)' }}>
                              {bill.user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-gray-900 font-semibold text-sm">{bill.user.name}</p>
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
                              <button onClick={() => setPayModal(bill)}
                                className="px-4 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-all border border-emerald-200">
                                পরিশোধ নিন
                              </button>
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
