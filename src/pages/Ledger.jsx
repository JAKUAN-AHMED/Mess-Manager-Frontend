import { useState, useEffect, useCallback } from 'react';
import {
  ArrowUpRight, ArrowDownLeft, Plus, Trash2, X, ChevronRight,
  Users, Wallet, TrendingUp, TrendingDown, Edit2, Check, Phone,
  ArrowLeft, Calendar, FileText, Handshake, RefreshCw,
} from 'lucide-react';
import api from '../services/api';

const fmt = (n) => parseFloat(Math.abs(n).toFixed(2)).toLocaleString('en-IN', { minimumFractionDigits: 2 });

// Types that are "positive" (they owe me more / I owe less)
const POSITIVE_TYPES = ['lent', 'paid_back', 'gave'];

const TXN_META = {
  lent:          { label: 'ধার দিয়েছি',   sublabel: 'তারা আমার কাছে পাবেন',   color: 'rose',    icon: ArrowUpRight,  sign: '−' },
  borrowed:      { label: 'ধার নিয়েছি',   sublabel: 'আমি তাদের কাছে পাবো',    color: 'violet',  icon: ArrowDownLeft, sign: '+' },
  received_back: { label: 'ফেরত পেয়েছি',  sublabel: 'পাওনা কমেছে',            color: 'emerald', icon: RefreshCw,     sign: '+' },
  paid_back:     { label: 'ফেরত দিয়েছি',  sublabel: 'দেনা কমেছে',             color: 'blue',    icon: Handshake,     sign: '−' },
  // legacy
  gave:          { label: 'দিয়েছি',        sublabel: 'তারা পাবেন',              color: 'rose',    icon: ArrowUpRight,  sign: '−' },
  received:      { label: 'নিয়েছি',        sublabel: 'আমি পাবো',               color: 'emerald', icon: ArrowDownLeft, sign: '+' },
};

const COLOR_CLASS = {
  rose:    { bg: 'bg-rose-500',    border: 'border-rose-500',    light: 'bg-rose-50 border-rose-200 text-rose-600',    icon: 'bg-rose-100 text-rose-500' },
  violet:  { bg: 'bg-violet-500',  border: 'border-violet-500',  light: 'bg-violet-50 border-violet-200 text-violet-600', icon: 'bg-violet-100 text-violet-500' },
  emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500', light: 'bg-emerald-50 border-emerald-200 text-emerald-600', icon: 'bg-emerald-100 text-emerald-500' },
  blue:    { bg: 'bg-blue-500',    border: 'border-blue-500',    light: 'bg-blue-50 border-blue-200 text-blue-600',    icon: 'bg-blue-100 text-blue-500' },
};

/* ── Contact Modal ───────────────────────────────────── */
function ContactModal({ contact, onClose, onSave }) {
  const [form, setForm]       = useState({ name: contact?.name || '', phone: contact?.phone || '', note: contact?.note || '' });
  const [opening, setOpening] = useState({ enabled: false, type: 'lent', amount: '' });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/users').then(r => setMembers(r.data.data || r.data)).catch(() => {});
  }, []);

  const pickMember = (m) => {
    setForm(f => ({ ...f, name: m.name, phone: m.phone || f.phone }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('নাম দিন'); return; }
    if (opening.enabled && (!opening.amount || parseFloat(opening.amount) <= 0)) {
      setError('প্রারম্ভিক পরিমাণ দিন'); return;
    }
    setLoading(true);
    try {
      await onSave(form, opening.enabled ? { type: opening.type, amount: parseFloat(opening.amount) } : null);
      onClose();
    } catch (err) { setError(err.response?.data?.error || 'সংরক্ষণ ব্যর্থ'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-modal w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">{contact ? 'সম্পাদনা' : 'নতুন ব্যক্তি'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">হিসাবের তালিকায় যোগ করুন</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Member quick-pick chips */}
          {!contact && members.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">সদস্য থেকে বেছে নিন</label>
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-50 rounded-xl border border-gray-100 max-h-28 overflow-y-auto">
                {members.map(m => {
                  const active = form.name === m.name;
                  return (
                    <button key={m._id} type="button" onClick={() => pickMember(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        active
                          ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-600'
                      }`}>
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">নাম *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="form-input" placeholder="যেমন: রাহাত ভাই" required />
            {!contact && <p className="text-[11px] text-gray-400 mt-1">উপরে সদস্য বাছলে নাম পরিবর্তন করা যাবে</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">ফোন</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="form-input" placeholder="ঐচ্ছিক" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">নোট</label>
            <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="form-input" placeholder="ঐচ্ছিক" />
          </div>

          {/* Opening balance — only on add */}
          {!contact && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <button type="button"
                onClick={() => setOpening(o => ({ ...o, enabled: !o.enabled }))}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-all ${
                  opening.enabled ? 'bg-brand-50 text-brand-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}>
                <span>প্রারম্ভিক ব্যালেন্স আছে?</span>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${opening.enabled ? 'bg-brand-500 border-brand-500' : 'border-gray-300'}`}>
                  {opening.enabled && <Check size={11} className="text-white" />}
                </span>
              </button>
              {opening.enabled && (
                <div className="px-4 pb-4 pt-3 space-y-3 bg-white">
                  <p className="text-xs text-gray-400">এই ব্যক্তির সাথে আগে থেকে কোনো হিসাব থাকলে এখানে যোগ করুন</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button"
                      onClick={() => setOpening(o => ({ ...o, type: 'lent' }))}
                      className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all flex items-center justify-center gap-1.5 ${
                        opening.type === 'lent'
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-rose-300'
                      }`}>
                      <ArrowUpRight size={13} /> ধার দিয়েছিলাম
                    </button>
                    <button type="button"
                      onClick={() => setOpening(o => ({ ...o, type: 'borrowed' }))}
                      className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all flex items-center justify-center gap-1.5 ${
                        opening.type === 'borrowed'
                          ? 'bg-violet-500 text-white border-violet-500'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-violet-300'
                      }`}>
                      <ArrowDownLeft size={13} /> ধার নিয়েছিলাম
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">পরিমাণ (৳) *</label>
                    <input type="number" min="0.01" step="0.01"
                      value={opening.amount}
                      onChange={e => setOpening(o => ({ ...o, amount: e.target.value }))}
                      className="form-input text-base font-bold" placeholder="0.00" />
                  </div>
                  {opening.amount && (
                    <div className={`rounded-xl px-3 py-2.5 text-xs font-semibold flex items-center gap-1.5 ${
                      opening.type === 'lent' ? 'bg-rose-50 text-rose-600' : 'bg-violet-50 text-violet-600'
                    }`}>
                      {opening.type === 'lent'
                        ? <><ArrowUpRight size={13} /> {form.name || 'সে'} আমার কাছে ৳{parseFloat(opening.amount || 0).toFixed(2)} পাবেন</>
                        : <><ArrowDownLeft size={13} /> আমি {form.name || 'তার'} কাছে ৳{parseFloat(opening.amount || 0).toFixed(2)} পাবো</>
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 py-3">বাতিল</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">{loading ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Add Transaction Modal ───────────────────────────── */
const TXN_BUTTONS = [
  { type: 'lent',          label: 'ধার দিয়েছি',   desc: 'তাকে টাকা ধার দিয়েছি',       color: 'rose',    Icon: ArrowUpRight  },
  { type: 'borrowed',      label: 'ধার নিয়েছি',   desc: 'তার কাছ থেকে ধার নিয়েছি',    color: 'violet',  Icon: ArrowDownLeft },
  { type: 'received_back', label: 'ফেরত পেয়েছি',  desc: 'সে আমার পাওনা ফেরত দিয়েছে',  color: 'emerald', Icon: RefreshCw     },
  { type: 'paid_back',     label: 'ফেরত দিয়েছি',  desc: 'তার দেনা আমি পরিশোধ করেছি',  color: 'blue',    Icon: Handshake     },
];

const PREVIEW_TEXT = {
  lent:          (name, amt) => `${name} আমার কাছে ৳${amt} পাবেন`,
  borrowed:      (name, amt) => `আমি ${name}-এর কাছে ৳${amt} পাবো`,
  received_back: (name, amt) => `${name} ৳${amt} ফেরত দিয়েছেন — পাওনা কমেছে`,
  paid_back:     (name, amt) => `আমি ৳${amt} ফেরত দিয়েছি — দেনা কমেছে`,
};

function AddTransactionModal({ contact, onClose, onSave }) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const [mode, setMode]   = useState('direct'); // 'direct' | 'split'
  const [form, setForm]   = useState({ type: 'lent', amount: '', note: '', date: todayStr });
  const [split, setSplit] = useState({ total: '', people: 2, paidBy: 'me' }); // paidBy: 'me' | 'them'
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Calculated split amount
  const splitTotal   = parseFloat(split.total) || 0;
  const splitPeople  = Math.max(2, parseInt(split.people) || 2);
  const eachShare    = splitTotal > 0 ? parseFloat((splitTotal / splitPeople).toFixed(2)) : 0;
  // If I paid: he owes me his share → lent
  // If he paid: I owe him my share → borrowed
  const splitType    = split.paidBy === 'me' ? 'lent' : 'borrowed';
  const splitAmount  = eachShare;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'direct') {
      if (!form.amount || parseFloat(form.amount) <= 0) { setError('পরিমাণ দিন'); return; }
      setLoading(true);
      try { await onSave({ ...form, amount: parseFloat(form.amount), contactId: contact._id }); onClose(); }
      catch (err) { setError(err.response?.data?.error || 'সংরক্ষণ ব্যর্থ'); }
      finally { setLoading(false); }
    } else {
      if (!splitTotal || splitAmount <= 0) { setError('মোট খরচ দিন'); return; }
      setLoading(true);
      try {
        await onSave({
          type:      splitType,
          amount:    splitAmount,
          note:      form.note || `ভাগের খরচ — মোট ৳${splitTotal} (${splitPeople} জন)`,
          date:      form.date,
          contactId: contact._id,
        });
        onClose();
      }
      catch (err) { setError(err.response?.data?.error || 'সংরক্ষণ ব্যর্থ'); }
      finally { setLoading(false); }
    }
  };

  const meta = TXN_META[mode === 'split' ? splitType : form.type];
  const cc   = COLOR_CLASS[meta.color];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-modal w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">লেনদেন যোগ করুন</h2>
            <p className="text-xs text-gray-400 mt-0.5">{contact.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
        </div>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl mb-5">
          <button type="button" onClick={() => setMode('direct')}
            className={`py-2 rounded-lg text-xs font-semibold transition-all ${mode === 'direct' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
            সরাসরি লেনদেন
          </button>
          <button type="button" onClick={() => setMode('split')}
            className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${mode === 'split' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
            ✂️ ভাগ করা খরচ
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">

          {mode === 'direct' ? (
            <>
              {/* 4-type selector */}
              <div className="grid grid-cols-2 gap-2">
                {TXN_BUTTONS.map(({ type, label, desc, color, Icon }) => {
                  const active = form.type === type;
                  const c = COLOR_CLASS[color];
                  return (
                    <button key={type} type="button"
                      onClick={() => setForm(f => ({ ...f, type }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        active ? `${c.bg} text-white ${c.border} shadow-md` : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon size={14} className={active ? 'text-white' : 'text-gray-400'} />
                        <span className={`font-bold text-sm ${active ? 'text-white' : 'text-gray-700'}`}>{label}</span>
                      </div>
                      <p className={`text-[10px] leading-tight ${active ? 'text-white/80' : 'text-gray-400'}`}>{desc}</p>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">পরিমাণ (৳) *</label>
                  <input type="number" min="0.01" step="0.01" value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="form-input text-lg font-bold" placeholder="0.00" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">তারিখ</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="form-input" />
                </div>
              </div>

              {form.amount && parseFloat(form.amount) > 0 && (
                <div className={`rounded-xl p-3.5 text-sm font-semibold flex items-center gap-2 border ${cc.light}`}>
                  <meta.icon size={15} />
                  {PREVIEW_TEXT[form.type]?.(contact.name, parseFloat(form.amount).toFixed(2))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Split mode */}
              <div className="rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 p-4 space-y-4">

                {/* Total expense */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">মোট খরচ (৳) *</label>
                  <input type="number" min="0.01" step="0.01"
                    value={split.total}
                    onChange={e => setSplit(s => ({ ...s, total: e.target.value }))}
                    className="form-input text-xl font-black" placeholder="0.00" autoFocus />
                </div>

                {/* People count */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">কত জনে ভাগ</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setSplit(s => ({ ...s, people: Math.max(2, s.people - 1) }))}
                      className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold text-lg hover:border-brand-400 transition-all flex items-center justify-center">−</button>
                    <span className="text-2xl font-black text-gray-900 w-8 text-center">{split.people}</span>
                    <button type="button" onClick={() => setSplit(s => ({ ...s, people: s.people + 1 }))}
                      className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold text-lg hover:border-brand-400 transition-all flex items-center justify-center">+</button>
                    <span className="text-sm text-gray-400 font-medium">জন</span>
                  </div>
                </div>

                {/* Who paid */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">কে পরিশোধ করেছে?</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setSplit(s => ({ ...s, paidBy: 'me' }))}
                      className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                        split.paidBy === 'me'
                          ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-rose-300'
                      }`}>
                      💳 আমি দিয়েছি
                    </button>
                    <button type="button" onClick={() => setSplit(s => ({ ...s, paidBy: 'them' }))}
                      className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                        split.paidBy === 'them'
                          ? 'bg-violet-500 text-white border-violet-500 shadow-sm'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-violet-300'
                      }`}>
                      💳 {contact.name} দিয়েছে
                    </button>
                  </div>
                </div>

                {/* Live calculation result */}
                {splitTotal > 0 && (
                  <div className={`rounded-xl p-4 border-2 ${split.paidBy === 'me' ? 'bg-rose-50 border-rose-200' : 'bg-violet-50 border-violet-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 font-semibold">মোট খরচ</span>
                      <span className="font-bold text-gray-800">৳ {splitTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 font-semibold">প্রতিজনের ভাগ ({splitPeople} জন)</span>
                      <span className="font-bold text-gray-800">৳ {eachShare.toFixed(2)}</span>
                    </div>
                    <div className={`flex items-center justify-between pt-2 border-t ${split.paidBy === 'me' ? 'border-rose-200' : 'border-violet-200'}`}>
                      <span className={`text-sm font-bold ${split.paidBy === 'me' ? 'text-rose-600' : 'text-violet-600'}`}>
                        {split.paidBy === 'me' ? `${contact.name} আমাকে দেবে` : `আমি ${contact.name}-কে দেবো`}
                      </span>
                      <span className={`text-xl font-black ${split.paidBy === 'me' ? 'text-rose-600' : 'text-violet-600'}`}>
                        ৳ {eachShare.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">তারিখ</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">নোট</label>
                  <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="form-input" placeholder="যেমন: রেস্তোরাঁ" />
                </div>
              </div>
            </>
          )}

          {mode === 'direct' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">নোট</label>
              <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                className="form-input" placeholder="কারণ বা বিবরণ (ঐচ্ছিক)" />
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 py-3">বাতিল</button>
            <button type="submit" disabled={loading || (mode === 'split' && splitAmount <= 0)}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all ${cc.bg} hover:opacity-90 disabled:opacity-40`}>
              {loading ? 'সংরক্ষণ...' : mode === 'split' && splitAmount > 0 ? `৳${eachShare.toFixed(2)} সংরক্ষণ করুন` : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Edit Transaction Modal ──────────────────────────── */
function EditTransactionModal({ txn, contact, onClose, onSave }) {
  const [form, setForm] = useState({
    type:   txn.type,
    amount: txn.amount,
    note:   txn.note || '',
    date:   new Date(txn.date).toISOString().slice(0,10),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('পরিমাণ দিন'); return; }
    setLoading(true);
    try { await onSave({ ...form, amount: parseFloat(form.amount) }); onClose(); }
    catch (err) { setError(err.response?.data?.error || 'আপডেট ব্যর্থ'); }
    finally { setLoading(false); }
  };

  const meta = TXN_META[form.type] || TXN_META['gave'];
  const cc   = COLOR_CLASS[meta.color];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-modal w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">লেনদেন সম্পাদনা</h2>
            <p className="text-xs text-gray-400 mt-0.5">{contact.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 mb-4 text-sm">{error}</div>}

        <div className="grid grid-cols-2 gap-2 mb-4">
          {TXN_BUTTONS.map(({ type, label, color, Icon }) => {
            const active = form.type === type;
            const c = COLOR_CLASS[color];
            return (
              <button key={type} type="button" onClick={() => setForm(f => ({ ...f, type }))}
                className={`p-2.5 rounded-xl border-2 text-left transition-all flex items-center gap-2 ${
                  active ? `${c.bg} text-white ${c.border}` : 'bg-white border-gray-200 hover:border-gray-300'
                }`}>
                <Icon size={13} className={active ? 'text-white' : 'text-gray-400'} />
                <span className={`font-semibold text-xs ${active ? 'text-white' : 'text-gray-700'}`}>{label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">পরিমাণ (৳) *</label>
              <input type="number" min="0.01" step="0.01" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="form-input text-lg font-bold" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">তারিখ</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="form-input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">নোট</label>
            <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="form-input" placeholder="ঐচ্ছিক" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 py-3">বাতিল</button>
            <button type="submit" disabled={loading} className={`flex-1 py-3 rounded-xl font-semibold text-sm text-white ${cc.bg} hover:opacity-90 disabled:opacity-50`}>
              {loading ? 'আপডেট...' : 'আপডেট করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Contact Detail Panel ─────────────────────────────── */
function ContactDetail({ contact, onBack, onRefresh }) {
  const [txns, setTxns]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editTxn, setEditTxn] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/ledger/contacts/${contact._id}/transactions`);
      setTxns(r.data.data);
    } catch {}
    finally { setLoading(false); }
  }, [contact._id]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (data) => {
    await api.post('/ledger/transactions', data);
    await load();
    onRefresh();
  };

  const handleEdit = async (data) => {
    await api.put(`/ledger/transactions/${editTxn._id}`, data);
    await load();
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!confirm('এই লেনদেন মুছবেন?')) return;
    await api.delete(`/ledger/transactions/${id}`);
    await load();
    onRefresh();
  };

  // Balance: positive types add, negative types subtract
  const balance = txns.reduce((sum, t) => {
    return sum + (POSITIVE_TYPES.includes(t.type) ? t.amount : -t.amount);
  }, 0);
  const totalLent     = txns.filter(t => t.type === 'lent'     || t.type === 'gave').reduce((s, t) => s + t.amount, 0);
  const totalBorrowed = txns.filter(t => t.type === 'borrowed' || t.type === 'received').reduce((s, t) => s + t.amount, 0);
  const totalRecBack  = txns.filter(t => t.type === 'received_back').reduce((s, t) => s + t.amount, 0);
  const totalPaidBack = txns.filter(t => t.type === 'paid_back').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="flex flex-col h-full">
      {showAdd  && <AddTransactionModal contact={contact} onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {editTxn  && <EditTransactionModal txn={editTxn} contact={contact} onClose={() => setEditTxn(null)} onSave={handleEdit} />}

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-700 transition-colors lg:hidden">
          <ArrowLeft size={18} />
        </button>
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
          style={{ background: balance > 0 ? 'linear-gradient(135deg,#f43f5e,#fb923c)' : balance < 0 ? 'linear-gradient(135deg,#7c3aed,#6366f1)' : 'linear-gradient(135deg,#94a3b8,#64748b)' }}>
          {contact.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-base truncate">{contact.name}</p>
          {contact.phone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} /> {contact.phone}</p>}
          {contact.note  && <p className="text-xs text-gray-400 italic">{contact.note}</p>}
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm flex items-center gap-1.5 px-4 py-2">
          <Plus size={15} /> লেনদেন
        </button>
      </div>

      {/* Net balance banner */}
      {txns.length > 0 && (
        <div className={`rounded-2xl px-5 py-4 mb-4 flex items-center justify-between ${
          balance > 0 ? 'bg-rose-50 border border-rose-200' : balance < 0 ? 'bg-violet-50 border border-violet-200' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${balance > 0 ? 'text-rose-400' : balance < 0 ? 'text-violet-400' : 'text-gray-400'}`}>
              {balance > 0 ? 'পাওনা আছে' : balance < 0 ? 'দেনা আছে' : 'বরাবর'}
            </p>
            <p className={`text-2xl font-black ${balance > 0 ? 'text-rose-600' : balance < 0 ? 'text-violet-600' : 'text-gray-400'}`}>
              {balance === 0 ? '✓ সব চুকে গেছে' : `৳ ${fmt(balance)}`}
            </p>
          </div>
          {balance !== 0 && (
            <div className={`text-right text-xs font-medium ${balance > 0 ? 'text-rose-500' : 'text-violet-500'}`}>
              {balance > 0
                ? <><p>{contact.name}</p><p>আমার কাছে পাবেন</p></>
                : <><p>আমি {contact.name}-এর</p><p>কাছে পাবো</p></>}
            </div>
          )}
        </div>
      )}

      {/* 4 mini-stat cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'ধার দিলাম', val: totalLent,     color: 'rose'    },
          { label: 'ধার নিলাম', val: totalBorrowed, color: 'violet'  },
          { label: 'ফেরত পেলাম', val: totalRecBack, color: 'emerald' },
          { label: 'ফেরত দিলাম', val: totalPaidBack,color: 'blue'    },
        ].map(({ label, val, color }) => (
          <div key={label} className="rounded-xl p-2.5 text-center bg-gray-50 border border-gray-100">
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1 leading-tight">{label}</p>
            <p className={`font-bold text-sm text-${color}-600`}>৳{fmt(val)}</p>
          </div>
        ))}
      </div>

      {/* Transaction list */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : txns.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-100">
            <FileText size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">কোনো লেনদেন নেই</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-xs text-brand-500 hover:text-brand-600 font-medium">
            + প্রথম লেনদেন যোগ করুন
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">লেনদেনের ইতিহাস (পুরনো → নতুন)</p>
          {(() => {
            let running = 0;
            return txns.map((txn, idx) => {
              running += POSITIVE_TYPES.includes(txn.type) ? txn.amount : -txn.amount;
              const m    = TXN_META[txn.type] || TXN_META['gave'];
              const cc   = COLOR_CLASS[m.color];
              const Icon = m.icon;
              const runColor = running > 0 ? 'text-rose-500' : running < 0 ? 'text-violet-600' : 'text-gray-400';
              return (
                <div key={txn._id} className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  {/* Main row */}
                  <div className={`flex items-center gap-3 p-3 ${cc.light} border-b border-current/10`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cc.icon}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-black text-sm">{m.sign} ৳{fmt(txn.amount)}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full opacity-80 ${cc.icon}`}>{m.label}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5 shrink-0">
                          <Calendar size={9} />
                          {new Date(txn.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {txn.note && <p className="text-[11px] opacity-60 mt-0.5 truncate">{txn.note}</p>}
                    </div>
                  </div>
                  {/* Footer: running balance + actions */}
                  <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50">
                    <span className="text-[11px] text-gray-400">
                      ব্যালেন্স: <span className={`font-bold ${runColor}`}>
                        {running === 0 ? 'বরাবর' : `৳${fmt(running)} ${running > 0 ? '(পাওনা)' : '(দেনা)'}`}
                      </span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditTxn(txn)}
                        className="p-1.5 rounded-lg hover:bg-brand-50 text-gray-300 hover:text-brand-500 transition-all">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => handleDelete(txn._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}

/* ── Main Ledger Page ─────────────────────────────────── */
export function Ledger() {
  const [contacts, setContacts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [contactModal, setContactModal] = useState(null); // null | 'add' | contact obj

  const loadContacts = async () => {
    setLoading(true);
    try {
      const r = await api.get('/ledger/contacts');
      setContacts(r.data.data);
      // Keep selected in sync
      if (selected) {
        const updated = r.data.data.find(c => c._id === selected._id);
        if (updated) setSelected(updated);
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadContacts(); }, []);

  const handleSaveContact = async (data, openingBalance) => {
    if (contactModal === 'add') {
      const r = await api.post('/ledger/contacts', data);
      const newContact = r.data.data;
      // Add opening balance transaction if provided
      if (openingBalance) {
        await api.post('/ledger/transactions', {
          contactId: newContact._id,
          type:      openingBalance.type,
          amount:    openingBalance.amount,
          note:      'প্রারম্ভিক ব্যালেন্স',
        });
      }
      await loadContacts();
      setSelected(newContact);
    } else {
      await api.put(`/ledger/contacts/${contactModal._id}`, data);
      await loadContacts();
    }
  };

  const handleDeleteContact = async (contact) => {
    if (!confirm(`"${contact.name}" এবং তার সমস্ত লেনদেন মুছে ফেলবেন?`)) return;
    await api.delete(`/ledger/contacts/${contact._id}`);
    if (selected?._id === contact._id) setSelected(null);
    await loadContacts();
  };

  // Summary
  const totalToReceive = contacts.filter(c => c.balance > 0).reduce((s, c) => s + c.balance, 0);
  const totalToGive    = contacts.filter(c => c.balance < 0).reduce((s, c) => s + Math.abs(c.balance), 0);
  const net            = totalToReceive - totalToGive;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {contactModal && (
        <ContactModal
          contact={contactModal === 'add' ? null : contactModal}
          onClose={() => setContactModal(null)}
          onSave={handleSaveContact}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">ব্যক্তিগত হিসাব</h1>
          <p className="text-gray-400 mt-1 text-sm">কে কতো দেবে বা পাবে তার ট্র্যাক রাখুন</p>
        </div>
        <button onClick={() => setContactModal('add')} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={17} /> ব্যক্তি যোগ করুন
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4" style={{ borderLeft: '3px solid #f43f5e' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#fff1f2' }}>
            <TrendingUp size={20} style={{ color: '#f43f5e' }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">আমি পাবো</p>
            <p className="text-gray-900 text-xl font-bold mt-0.5">৳ {fmt(totalToReceive)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{contacts.filter(c => c.balance > 0).length} জনের কাছে</p>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4" style={{ borderLeft: '3px solid #10b981' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#f0fdf4' }}>
            <TrendingDown size={20} style={{ color: '#10b981' }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">আমি দেবো</p>
            <p className="text-gray-900 text-xl font-bold mt-0.5">৳ {fmt(totalToGive)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{contacts.filter(c => c.balance < 0).length} জনকে</p>
          </div>
        </div>
        <div className={`glass-panel p-5 rounded-2xl flex items-center gap-4`}
          style={{ borderLeft: `3px solid ${net >= 0 ? '#7c3aed' : '#f59e0b'}` }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: net >= 0 ? '#ede9fe' : '#fffbeb' }}>
            <Wallet size={20} style={{ color: net >= 0 ? '#7c3aed' : '#f59e0b' }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">নেট ব্যালেন্স</p>
            <p className="text-gray-900 text-xl font-bold mt-0.5">৳ {fmt(net)}</p>
            <p className={`text-xs font-medium mt-0.5 ${net >= 0 ? 'text-brand-500' : 'text-amber-500'}`}>
              {net > 0 ? 'সামগ্রিকভাবে পাওয়ার আছে' : net < 0 ? 'সামগ্রিকভাবে দেওয়ার আছে' : 'সব বরাবর'}
            </p>
          </div>
        </div>
      </div>

      {/* Main content: split view on desktop, stack on mobile */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-14 text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">লোড হচ্ছে...</p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="glass-panel rounded-2xl p-14 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-brand-400" />
          </div>
          <p className="text-gray-600 font-semibold">কোনো ব্যক্তি নেই</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">যার সাথে হিসাব আছে তাকে যোগ করুন</p>
          <button onClick={() => setContactModal('add')} className="btn-primary px-6 py-2.5 text-sm">
            <Plus size={16} className="inline mr-1" /> ব্যক্তি যোগ করুন
          </button>
        </div>
      ) : (
        <div className="flex gap-4">
          {/* Contact list — always visible on desktop, hidden on mobile when selected */}
          <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col gap-2 w-full lg:w-80 shrink-0`}>
            {contacts.map((contact) => {
              const isSelected = selected?._id === contact._id;
              return (
                <div key={contact._id}
                  onClick={() => setSelected(contact)}
                  className={`glass-panel rounded-2xl p-4 cursor-pointer transition-all border-2 group ${
                    isSelected ? 'border-brand-400 shadow-lg shadow-brand-100' : 'border-transparent hover:border-gray-200'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ background: contact.balance > 0 ? 'linear-gradient(135deg, #f43f5e, #fb923c)' : contact.balance < 0 ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #94a3b8, #64748b)' }}>
                      {contact.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{contact.name}</p>
                      {contact.phone && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone size={9} /> {contact.phone}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {contact.balance === 0 ? (
                        <span className="text-[11px] text-gray-400 font-medium">বরাবর</span>
                      ) : (
                        <>
                          <p className={`font-bold text-sm ${contact.balance > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                            ৳{fmt(contact.balance)}
                          </p>
                          <p className={`text-[10px] font-medium mt-0.5 ${contact.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {contact.balance > 0 ? 'পাবো' : 'দেবো'}
                          </p>
                        </>
                      )}
                    </div>
                    <ChevronRight size={14} className={`text-gray-300 transition-colors ${isSelected ? 'text-brand-400' : 'group-hover:text-gray-400'}`} />
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1 mt-2.5 pt-2.5 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => e.stopPropagation()}>
                    <button onClick={() => setContactModal(contact)}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors font-medium">
                      <Edit2 size={10} /> সম্পাদনা
                    </button>
                    <button onClick={() => handleDeleteContact(contact)}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors font-medium ml-auto">
                      <Trash2 size={10} /> মুছুন
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          {selected ? (
            <div className={`flex-1 glass-panel rounded-2xl p-5 ${selected ? 'flex' : 'hidden lg:flex'} flex-col`}
              style={{ minHeight: '480px' }}>
              <ContactDetail
                key={selected._id}
                contact={selected}
                onBack={() => setSelected(null)}
                onRefresh={loadContacts}
              />
            </div>
          ) : (
            <div className="flex-1 glass-panel rounded-2xl p-5 hidden lg:flex flex-col items-center justify-center text-center"
              style={{ minHeight: '480px' }}>
              <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
                <Users size={28} className="text-brand-400" />
              </div>
              <p className="text-gray-500 font-medium">একজন বেছে নিন</p>
              <p className="text-gray-400 text-sm mt-1">বাম থেকে ব্যক্তি নির্বাচন করুন</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
