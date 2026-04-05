import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Receipt, Plus, Trash2, X, ChevronLeft, ChevronRight, PackagePlus, Pencil } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MONTHS_BN = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
const CATEGORIES = ['বাজার', 'গ্যাস', 'বেতন', 'অন্যান্য'];
const CAT_CLASS  = { 'বাজার': 'cat-market', 'গ্যাস': 'cat-gas', 'বেতন': 'cat-salary', 'অন্যান্য': 'cat-other' };
const CAT_BG     = { 'বাজার': '#dcfce7', 'গ্যাস': '#fef3c7', 'বেতন': '#ede9fe', 'অন্যান্য': '#f1f5f9' };
const CAT_ICON   = { 'বাজার': '🛒', 'গ্যাস': '🔥', 'বেতন': '💼', 'অন্যান্য': '📦' };

const emptyItem = () => ({ name: '', quantity: '', price: '' });

function AddExpenseModal({ onClose, onSave, month, year, editExpense }) {
  const today = new Date();
  const { user: currentUser } = useAuth();
  const isEdit = !!editExpense;
  const [members, setMembers] = useState([]);

  useEffect(() => {
    api.get('/users').then(r => setMembers(r.data.data || r.data)).catch(() => {});
  }, []);

  const [form, setForm] = useState(() => {
    if (isEdit) {
      const d = new Date(editExpense.date);
      return {
        category:       editExpense.category,
        description:    editExpense.description || '',
        addedByName:    editExpense.addedByName || editExpense.addedBy?.name || '',
        addedById:      editExpense.addedBy?._id || editExpense.addedBy || '',
        paidFromPocket: editExpense.paidBy != null,
        date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
      };
    }
    return {
      category:       'বাজার',
      description:    '',
      addedByName:    currentUser?.name || '',
      addedById:      currentUser?._id || '',
      paidFromPocket: true,
      date: `${year}-${String(month).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
    };
  });
  const [items, setItems] = useState(() =>
    isEdit && editExpense.items?.length
      ? editExpense.items.map(it => ({ name: it.name, quantity: it.quantity ?? '', price: it.price }))
      : [emptyItem()]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const addItem    = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const itemTotal = (item) => {
    const price = parseFloat(item.price) || 0;
    const qty   = parseFloat(item.quantity) || 1;
    return price * (item.quantity ? qty : 1);
  };
  const grandTotal = items.reduce((sum, it) => sum + itemTotal(it), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate: every item needs name + price
    for (const it of items) {
      if (!it.name.trim())           { setError('প্রতিটি আইটেমের নাম দিন'); return; }
      if (!it.price || parseFloat(it.price) <= 0) { setError('প্রতিটি আইটেমের মূল্য দিন'); return; }
    }
    if (!form.addedById) { setError('যোগকারী সদস্য বেছে নিন'); return; }
    setError('');
    setLoading(true);
    try {
      const payload = {
        date:        form.date,
        category:    form.category,
        description: form.description,
        addedByName: form.addedByName,
        paidBy:      form.paidFromPocket && form.addedById ? form.addedById : undefined,
        items: items.map(it => ({
          name:     it.name.trim(),
          quantity: it.quantity ? parseFloat(it.quantity) : null,
          price:    parseFloat(it.price),
        })),
      };
      await onSave(payload, isEdit ? editExpense._id : null);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-modal w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex justify-between items-center px-7 pt-7 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'খরচ সম্পাদনা' : 'খরচ যোগ করুন'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{MONTHS_BN[month - 1]} {year}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-7 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-sm">
              {error}
            </div>
          )}

          {/* Date & Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">তারিখ</label>
              <input type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="form-input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">ক্যাটাগরি</label>
              <select value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="form-input text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_ICON[c]} {c}</option>)}
              </select>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">আইটেম সমূহ</label>
              <span className="text-xs text-gray-400">{items.length} টি আইটেম</span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-12 gap-2 mb-1.5 px-1">
              <span className="col-span-5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">নাম *</span>
              <span className="col-span-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">পরিমাণ</span>
              <span className="col-span-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">দাম (৳) *</span>
              <span className="col-span-1" />
            </div>

            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl bg-gray-50 border border-gray-100 group hover:border-brand-200 transition-colors">
                  {/* Name */}
                  <input
                    className="col-span-5 text-sm px-2.5 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 text-gray-900 placeholder:text-gray-300"
                    placeholder="যেমন: চাল"
                    value={item.name}
                    onChange={(e) => updateItem(i, 'name', e.target.value)}
                  />
                  {/* Quantity (optional) */}
                  <input
                    type="number" min="0" step="any"
                    className="col-span-3 text-sm px-2.5 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 text-gray-900 placeholder:text-gray-300"
                    placeholder="ঐচ্ছিক"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                  />
                  {/* Price */}
                  <input
                    type="number" min="0.01" step="0.01"
                    className="col-span-3 text-sm px-2.5 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 text-gray-900 placeholder:text-gray-300"
                    placeholder="0.00"
                    value={item.price}
                    onChange={(e) => updateItem(i, 'price', e.target.value)}
                  />
                  {/* Remove */}
                  <button type="button" onClick={() => items.length > 1 && removeItem(i)}
                    className={`col-span-1 flex items-center justify-center h-8 w-8 rounded-lg transition-all ${items.length > 1 ? 'text-gray-300 hover:text-red-500 hover:bg-red-50' : 'text-gray-200 cursor-not-allowed'}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add item */}
            <button type="button" onClick={addItem}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-brand-200 text-brand-500 hover:border-brand-400 hover:bg-brand-50 transition-all text-sm font-medium">
              <PackagePlus size={16} />
              আইটেম যোগ করুন
            </button>
          </div>

          {/* Added by — member dropdown */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">যোগকারী *</label>
            <select
              value={form.addedById}
              onChange={(e) => {
                const member = members.find(m => m._id === e.target.value);
                setForm({ ...form, addedById: e.target.value, addedByName: member?.name || '' });
              }}
              className="form-input text-sm"
              required
            >
              <option value="">-- সদস্য বেছে নিন --</option>
              {members.map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Payment source toggle */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">বাজারের টাকার উৎস</p>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button type="button"
                onClick={() => setForm({ ...form, paidFromPocket: true })}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${form.paidFromPocket ? 'bg-brand-500 text-white border-brand-500 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-brand-300'}`}>
                💵 নিজের পকেট থেকে
              </button>
              <button type="button"
                onClick={() => setForm({ ...form, paidFromPocket: false })}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${!form.paidFromPocket ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300'}`}>
                🏦 মেস ফান্ড থেকে
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {form.paidFromPocket
                ? `${form.addedByName || 'যোগকারী'} নিজের টাকা দিয়েছেন — হিসাবে তার পাওনা হিসেবে যোগ হবে`
                : 'মেস ফান্ড বা অগ্রিম থেকে পরিশোধ হয়েছে'}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">নোট</label>
            <input value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="form-input text-sm" placeholder="ঐচ্ছিক" />
          </div>
        </div>

        {/* Footer — sticky total + actions */}
        <div className="px-7 py-5 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500">মোট</span>
            <span className="text-xl font-black text-gray-900">৳ {grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">বাতিল</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
              {loading ? 'সংরক্ষণ হচ্ছে...' : isEdit ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Expenses() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState(null);

  const isAdmin = currentUser?.role === 'admin';

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/expenses?month=${month}&year=${year}`);
      setExpenses(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, [month, year]);

  const handleSave = async (data, id) => {
    if (id) {
      await api.put(`/expenses/${id}`, data);
    } else {
      await api.post('/expenses', data);
    }
    await fetchExpenses();
  };

  const handleDelete = async (id) => {
    if (!confirm('এই খরচটি মুছে ফেলবেন?')) return;
    await api.delete(`/expenses/${id}`);
    fetchExpenses();
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory   = CATEGORIES.map((cat) => ({
    cat,
    total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {(showModal || editExpense) && (
        <AddExpenseModal
          editExpense={editExpense}
          onClose={() => { setShowModal(false); setEditExpense(null); }}
          onSave={handleSave}
          month={month}
          year={year}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">{t('sidebar.expenses')}</h1>
          <p className="text-gray-400 mt-1 text-sm">
            মোট খরচ: <span className="font-semibold text-gray-700">৳ {totalExpense.toLocaleString()}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 glass-panel rounded-xl px-1">
            <button onClick={prevMonth} className="p-2 hover:bg-brand-50 rounded-xl text-gray-400 hover:text-brand-600 transition-all">
              <ChevronLeft size={18} />
            </button>
            <span className="text-gray-700 font-semibold w-28 sm:w-32 text-center text-sm">
              {MONTHS_BN[month - 1]} {year}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-brand-50 rounded-xl text-gray-400 hover:text-brand-600 transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={17} /> যোগ করুন
          </button>
        </div>
      </div>

      {/* Category cards */}
      {byCategory.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {byCategory.map(({ cat, total }) => (
            <div key={cat} className="glass-panel p-3 sm:p-4 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-base sm:text-lg shrink-0"
                style={{ background: CAT_BG[cat] }}>
                {CAT_ICON[cat]}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-medium truncate">{cat}</p>
                <p className="text-gray-900 font-bold text-sm sm:text-base">৳ {total.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-14 text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">লোড হচ্ছে...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="glass-panel rounded-2xl p-14 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Receipt size={32} className="text-brand-400" />
          </div>
          <p className="text-gray-500 font-medium">এই মাসে কোনো খরচ নেই</p>
          <button onClick={() => setShowModal(true)} className="mt-4 btn-primary text-sm px-6 py-2.5">
            <Plus size={16} className="inline mr-1" /> প্রথম খরচ যোগ করুন
          </button>
        </div>
      ) : (
        <>
          {/* ── Mobile cards ─────────────────────── */}
          <div className="lg:hidden space-y-3">
            {expenses.map((expense) => (
              <div key={expense._id} className="glass-panel rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{ background: CAT_BG[expense.category] }}>
                      {CAT_ICON[expense.category]}
                    </div>
                    <div className="min-w-0">
                      <span className={`badge ${CAT_CLASS[expense.category]}`}>{expense.category}</span>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(expense.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' })}
                        {(expense.addedByName || expense.addedBy?.name) && ` · ${expense.addedByName || expense.addedBy?.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-gray-900 font-bold text-base">৳ {expense.amount.toLocaleString()}</span>
                    {isAdmin && (
                      <>
                        <button onClick={() => setEditExpense(expense)}
                          className="p-2 hover:bg-brand-50 rounded-lg text-gray-300 hover:text-brand-500 transition-all ml-1">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(expense._id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 transition-all">
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {expense.items?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                    {expense.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 font-medium">
                          {it.name}{it.quantity ? ` ×${it.quantity}` : ''}
                        </span>
                        <span className="text-gray-500">৳ {it.price}</span>
                      </div>
                    ))}
                  </div>
                )}
                {expense.description && (
                  <p className="text-xs text-gray-400 mt-2">{expense.description}</p>
                )}
              </div>
            ))}
          </div>

          {/* ── Desktop table ─────────────────────── */}
          <div className="hidden lg:block glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">তারিখ</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ক্যাটাগরি</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">আইটেম / বিবরণ</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">পরিমাণ</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">যোগকারী</th>
                    {isAdmin && <th className="px-6 py-4" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((expense) => (
                    <tr key={expense._id} className="table-row-hover transition-colors">
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(expense.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${CAT_CLASS[expense.category]}`}>
                          {CAT_ICON[expense.category]} {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {expense.items?.length > 0 ? (
                          <div className="space-y-0.5">
                            {expense.items.map((it, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-gray-600">
                                <span className="font-medium text-gray-800">{it.name}</span>
                                {it.quantity && <span className="text-gray-400">×{it.quantity}</span>}
                                <span className="text-gray-400">— ৳{it.price}</span>
                              </div>
                            ))}
                            {expense.description && <p className="text-gray-400 text-xs mt-1">{expense.description}</p>}
                          </div>
                        ) : (
                          <span className="text-gray-500">{expense.description || '—'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900 font-bold">৳ {expense.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{expense.addedByName || expense.addedBy?.name || '—'}</td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setEditExpense(expense)}
                              className="p-2 hover:bg-brand-50 rounded-lg text-gray-300 hover:text-brand-500 transition-all">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => handleDelete(expense._id)}
                              className="p-2 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 transition-all">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-100">
                    <td colSpan={3} className="px-6 py-4 text-gray-500 font-semibold text-sm">মোট</td>
                    <td className="px-6 py-4 text-right text-gray-900 font-bold text-lg">৳ {totalExpense.toLocaleString()}</td>
                    <td colSpan={isAdmin ? 2 : 1} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
