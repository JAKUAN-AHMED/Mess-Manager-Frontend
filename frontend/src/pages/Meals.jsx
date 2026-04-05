import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, CheckCircle, Utensils, TrendingUp,
  X, Save, Users, Sun, Moon, BarChart3, CalendarDays,
  Minus, Plus, Trash2, SlidersHorizontal,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MONTHS_BN  = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
const DAYS_SHORT = ['র','স','ম','বু','বৃ','শু','শ'];
const MEAL_LABELS = { b: 'সকাল', l: 'দুপুর', d: 'রাত' };
const MEAL_COLORS = {
  b: { text: '#c2410c' },
  l: { text: '#16a34a' },
  d: { text: '#4338ca' },
};
const PRESETS = [
  { label: '৩ বেলা',      b: 1, l: 1, d: 1 },
  { label: 'দুপুর+রাত',   b: 0, l: 1, d: 1 },
  { label: 'সকাল+দুপুর',  b: 1, l: 1, d: 0 },
  { label: 'শুধু দুপুর',  b: 0, l: 1, d: 0 },
  { label: 'রিসেট',        b: 0, l: 0, d: 0 },
];

/* ── Small number input ─────────────────────────── */
function MealInput({ value, onChange, color }) {
  return (
    <input
      type="number" min="0"
      value={value === 0 ? '' : value}
      placeholder="0"
      onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
      onFocus={e => e.target.select()}
      className="w-full text-center text-sm font-black py-2 rounded-xl border-2 bg-white focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all"
      style={{
        color,
        borderColor:     value > 0 ? color + '66' : '#e5e7eb',
        backgroundColor: value > 0 ? color + '0a' : '#fff',
        '--tw-ring-color': color + '33',
      }}
    />
  );
}

/* ── Day Detail Panel (single date) ────────────── */
function DayDetailPanel({ date, members, mealsByDate, onRefresh, onClear }) {
  const dayMeals = mealsByDate[date] || [];
  const d        = new Date(date + 'T00:00:00');
  const dayLabel = `${d.getDate()} ${MONTHS_BN[d.getMonth()]}`;

  const initRows = () => members.map(m => {
    const entry = dayMeals.find(ml => (ml.user?._id || ml.user) === m._id);
    return {
      memberId: m._id,
      name:     m.name,
      entryId:  entry?._id   ?? null,
      b:        entry?.breakfast ?? 0,
      l:        entry?.lunch     ?? 0,
      d:        entry?.dinner    ?? 0,
      saving:   false,
      deleting: false,
      saved:    false,
    };
  });

  const [rows, setRows]               = useState(initRows);
  const [presetApplied, setPreset]    = useState(null);
  const [savingAll, setSavingAll]     = useState(false);
  const [allDone, setAllDone]         = useState(false);

  // Re-init whenever the selected date or raw data changes
  useEffect(() => {
    setRows(initRows());
    setAllDone(false);
  }, [date, dayMeals.length, dayMeals.map(m => m._id + (m.breakfast||0) + (m.lunch||0) + (m.dinner||0)).join()]);

  const setRow = (memberId, patch) =>
    setRows(r => r.map(x => x.memberId === memberId ? { ...x, ...patch } : x));

  const applyPreset = p => {
    setRows(r => r.map(x => ({ ...x, b: p.b, l: p.l, d: p.d, saved: false })));
    setPreset(p.label);
    setTimeout(() => setPreset(null), 1400);
  };

  const saveRow = async row => {
    setRow(row.memberId, { saving: true });
    try {
      const res = await api.post('/meals', {
        userId: row.memberId, date,
        breakfast: row.b, lunch: row.l, dinner: row.d,
      });
      setRow(row.memberId, { saving: false, saved: true, entryId: res.data.data._id });
      onRefresh();
    } catch {
      setRow(row.memberId, { saving: false });
    }
  };

  const deleteRow = async row => {
    if (!row.entryId) return;
    setRow(row.memberId, { deleting: true });
    try {
      await api.delete(`/meals/${row.entryId}`);
      setRow(row.memberId, { deleting: false, entryId: null, b: 0, l: 0, d: 0, saved: false });
      onRefresh();
    } catch {
      setRow(row.memberId, { deleting: false });
    }
  };

  const saveAll = async () => {
    setSavingAll(true);
    try {
      const results = await Promise.all(rows.map(row =>
        api.post('/meals', { userId: row.memberId, date, breakfast: row.b, lunch: row.l, dinner: row.d })
      ));
      setRows(r => r.map((x, i) => ({ ...x, saved: true, entryId: results[i].data.data._id })));
      setAllDone(true);
      onRefresh();
      setTimeout(() => { setAllDone(false); }, 1500);
    } catch {
      /* no-op */
    } finally {
      setSavingAll(false);
    }
  };

  const totalMeals = rows.reduce((s, r) => s + r.b + r.l + r.d, 0);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 shrink-0"
        style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}>
              <CalendarDays size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-violet-900">{dayLabel}</p>
              <p className="text-[10px] text-violet-600">মোট {totalMeals} মিল · {members.length} সদস্য</p>
            </div>
          </div>
          <button onClick={onClear} className="p-1.5 rounded-lg hover:bg-white/60 text-violet-400 transition-colors">
            <X size={15} />
          </button>
        </div>
        {/* Presets */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all"
              style={presetApplied === p.label
                ? { background: '#ede9fe', color: '#7c3aed', borderColor: '#c4b5fd' }
                : { background: '#fff',    color: '#64748b', borderColor: '#e2e8f0' }}>
              {presetApplied === p.label ? '✓ ' : ''}{p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Member rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {rows.map(row => {
          const total = row.b + row.l + row.d;
          return (
            <div key={row.memberId} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                  style={{ background: 'linear-gradient(135deg,#a78bfa,#818cf8)' }}>
                  {row.name.charAt(0)}
                </div>
                <span className="flex-1 text-sm font-semibold text-gray-800 truncate">{row.name}</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: total > 0 ? '#ede9fe' : '#f3f4f6', color: total > 0 ? '#7c3aed' : '#9ca3af' }}>
                  {total} মিল
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 ml-9">
                {(['b','l','d']).map(f => (
                  <div key={f} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-gray-400">{MEAL_LABELS[f]}</span>
                    <MealInput
                      value={row[f]}
                      onChange={v => setRow(row.memberId, { [f]: v, saved: false })}
                      color={MEAL_COLORS[f].text}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-2 ml-9">
                <button onClick={() => saveRow(row)} disabled={row.saving}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all border"
                  style={row.saved
                    ? { background: '#dcfce7', color: '#16a34a', borderColor: '#86efac' }
                    : { background: '#f5f3ff', color: '#7c3aed', borderColor: '#e9d5ff' }}>
                  {row.saving
                    ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    : row.saved
                    ? <><CheckCircle size={11} /> সেভ হয়েছে</>
                    : <><Save size={11} /> সেভ করুন</>}
                </button>
                {row.entryId && (
                  <button onClick={() => deleteRow(row)} disabled={row.deleting}
                    className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-all flex items-center gap-1">
                    {row.deleting
                      ? <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                      : <Trash2 size={11} />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save all footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/40 shrink-0">
        <button onClick={saveAll} disabled={savingAll}
          className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm">
          {allDone
            ? <><CheckCircle size={15} /> সব সেভ হয়েছে!</>
            : savingAll
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> সেভ হচ্ছে...</>
            : <><Save size={14} /> সব সেভ করুন ({members.length} সদস্য)</>}
        </button>
      </div>
    </div>
  );
}

/* ── Bulk Entry Panel (multiple dates) ──────────── */
function BulkEntryPanel({ selectedDates, members, onSave, onClear }) {
  const initRows = () =>
    members.map(m => ({ userId: m._id, name: m.name, checked: true, b: 0, l: 0, d: 0 }));

  const [rows, setRows]            = useState(initRows);
  const [header, setHeader]        = useState({ b: 0, l: 0, d: 0 });
  const [presetApplied, setPreset] = useState(null);
  const [saving, setSaving]        = useState(false);
  const [done, setDone]            = useState(false);

  useEffect(() => {
    setRows(initRows());
    setHeader({ b: 0, l: 0, d: 0 });
    setDone(false);
  }, [members.length, selectedDates.join(',')]);

  const setRow = (uid, patch) =>
    setRows(r => r.map(x => x.userId === uid ? { ...x, ...patch } : x));

  const applyPreset = p => {
    setRows(r => r.map(x => ({ ...x, b: p.b, l: p.l, d: p.d })));
    setHeader({ b: p.b, l: p.l, d: p.d });
    setPreset(p.label);
    setTimeout(() => setPreset(null), 1400);
  };

  // Apply-to-all: update header AND all member rows
  const applyHeader = (field, val) => {
    setHeader(h => ({ ...h, [field]: val }));
    setRows(r => r.map(x => ({ ...x, [field]: val })));
  };

  const toggleAll = () => {
    const allOn = rows.every(r => r.checked);
    setRows(r => r.map(x => ({ ...x, checked: !allOn })));
  };

  const checkedRows = rows.filter(r => r.checked);
  const grandTotal  = checkedRows.reduce((s, r) => s + r.b + r.l + r.d, 0) * selectedDates.length;

  const handleSave = async () => {
    if (!checkedRows.length) return;
    setSaving(true);
    try {
      await Promise.all(
        selectedDates.flatMap(date =>
          checkedRows.map(row =>
            api.post('/meals', { userId: row.userId, date, breakfast: row.b, lunch: row.l, dinner: row.d })
          )
        )
      );
      setDone(true);
      setTimeout(() => { setDone(false); onSave(); onClear(); }, 1000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 shrink-0"
        style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500">
              <CalendarDays size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">বাল্ক মিল এন্ট্রি</p>
              <p className="text-[10px] text-emerald-600">{selectedDates.length} দিন · {checkedRows.length} সদস্য</p>
            </div>
          </div>
          <button onClick={onClear} className="p-1.5 rounded-lg hover:bg-white/60 text-emerald-600 transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {selectedDates.slice(0, 6).map(ds => {
            const d = new Date(ds + 'T00:00:00');
            return (
              <span key={ds} className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white bg-emerald-500">
                {d.getDate()} {MONTHS_BN[d.getMonth()].slice(0, 3)}
              </span>
            );
          })}
          {selectedDates.length > 6 && (
            <span className="text-[10px] font-bold text-gray-400 px-2 py-1">+{selectedDates.length - 6} আরো</span>
          )}
        </div>
      </div>

      {/* Presets */}
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/40 shrink-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">দ্রুত প্রিসেট</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all"
              style={presetApplied === p.label
                ? { background: '#dcfce7', color: '#16a34a', borderColor: '#86efac' }
                : { background: '#fff',    color: '#64748b', borderColor: '#e2e8f0' }}>
              {presetApplied === p.label ? '✓ ' : ''}{p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Apply-to-all (uses independent header state) */}
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/40 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">সবার জন্য সেট করুন</p>
          <button onClick={toggleAll} className="text-[10px] font-semibold text-brand-600 hover:text-brand-700 transition-colors">
            {rows.every(r => r.checked) ? 'সব বাদ' : 'সব সিলেক্ট'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['b','l','d']).map(f => (
            <div key={f} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-medium text-gray-500">{MEAL_LABELS[f]}</span>
              <MealInput value={header[f]} onChange={v => applyHeader(f, v)} color={MEAL_COLORS[f].text} />
            </div>
          ))}
        </div>
      </div>

      {/* Member rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50 min-h-0">
        {rows.map(row => {
          const total = row.b + row.l + row.d;
          return (
            <div key={row.userId} className={`px-4 py-3 transition-all ${!row.checked ? 'opacity-40' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setRow(row.userId, { checked: !row.checked })}
                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                    row.checked ? 'border-brand-500' : 'border-gray-300 bg-white'
                  }`}
                  style={row.checked ? { background: 'linear-gradient(135deg,#7c3aed,#6366f1)' } : {}}>
                  {row.checked && <span className="text-white text-[9px] font-black">✓</span>}
                </button>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                  style={{ background: 'linear-gradient(135deg,#a78bfa,#818cf8)' }}>
                  {row.name.charAt(0)}
                </div>
                <span className="flex-1 text-sm font-semibold text-gray-800 truncate">{row.name}</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: total > 0 ? '#ede9fe' : '#f3f4f6', color: total > 0 ? '#7c3aed' : '#9ca3af' }}>
                  {total}
                </span>
              </div>
              {row.checked && (
                <div className="grid grid-cols-3 gap-2 ml-12">
                  {(['b','l','d']).map(f => (
                    <MealInput key={f} value={row[f]} onChange={v => setRow(row.userId, { [f]: v })} color={MEAL_COLORS[f].text} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/40 shrink-0 space-y-2">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {[['সদস্য', checkedRows.length], ['দিন', selectedDates.length], ['মোট মিল', grandTotal]].map(([l, v]) => (
            <div key={l} className="bg-white rounded-xl py-2 border border-gray-100">
              <p className="text-gray-400">{l}</p>
              <p className="font-black text-brand-600">{v}</p>
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={saving || done || !checkedRows.length}
          className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm">
          {done
            ? <><CheckCircle size={15} /> সফলভাবে সেভ হয়েছে!</>
            : saving
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> সেভ হচ্ছে...</>
            : <><Save size={14} /> {checkedRows.length * selectedDates.length} এন্ট্রি সেভ করুন</>}
        </button>
      </div>
    </div>
  );
}

/* ── Adjustment Modal ────────────────────────────── */
function AdjustmentModal({ member, month, year, adjustments, onSave, onClose }) {
  const [amount, setAmount]     = useState('');
  const [reason, setReason]     = useState('');
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);

  const memberAdjs = adjustments.filter(a => (a.user?._id || a.user) === member._id);
  const totalAdj   = memberAdjs.reduce((s, a) => s + a.amount, 0);

  const handleAdd = async sign => {
    const n = parseFloat(amount);
    if (!n || isNaN(n)) return;
    setSaving(true);
    try {
      await api.post('/meal-adjustments', { userId: member._id, month, year, amount: sign * Math.abs(n), reason });
      setAmount(''); setReason('');
      onSave();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    setDeleting(id);
    try { await api.delete(`/meal-adjustments/${id}`); onSave(); }
    catch (err) { console.error(err); }
    finally { setDeleting(null); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-modal w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
          style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0"
              style={{ background: 'linear-gradient(135deg,#a78bfa,#818cf8)' }}>
              {member.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">{member.name}</p>
              <p className="text-xs text-amber-700">মিল সমন্বয় — মোট:{' '}
                <span className={`font-black ml-1 ${totalAdj >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {totalAdj > 0 ? '+' : ''}{totalAdj}
                </span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-amber-200/50 rounded-xl text-amber-700 transition-colors">
            <X size={17} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">নতুন সমন্বয়</p>
            <input type="number" min="0" placeholder="পরিমাণ (যেমন: 5)"
              value={amount} onChange={e => setAmount(e.target.value)} onFocus={e => e.target.select()}
              className="form-input w-full text-center font-bold text-lg mb-2" />
            <input type="text" placeholder="কারণ (ঐচ্ছিক)"
              value={reason} onChange={e => setReason(e.target.value)}
              className="form-input w-full text-sm mb-3" />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleAdd(-1)} disabled={saving || !amount}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 border-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-700">
                <Minus size={15} /> কমান
              </button>
              <button onClick={() => handleAdd(1)} disabled={saving || !amount}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700">
                <Plus size={15} /> বাড়ান
              </button>
            </div>
          </div>

          {memberAdjs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">আগের সমন্বয়</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {memberAdjs.map(a => (
                  <div key={a._id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
                    a.amount < 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'
                  }`}>
                    <span className={`text-base font-black shrink-0 ${a.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {a.amount > 0 ? '+' : ''}{a.amount}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{a.reason || 'কারণ উল্লেখ নেই'}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(a.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(a._id)} disabled={deleting === a._id}
                      className="p-1.5 hover:bg-red-100 rounded-lg text-gray-300 hover:text-red-500 transition-colors shrink-0">
                      {deleting === a._id
                        ? <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin block" />
                        : <Trash2 size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────── */
export function Meals() {
  const { user: currentUser } = useAuth();
  const now = new Date();

  const [month, setMonth]           = useState(now.getMonth() + 1);
  const [year, setYear]             = useState(now.getFullYear());
  const [meals, setMeals]           = useState([]);
  const [members, setMembers]       = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(new Set());
  const [view, setView]             = useState('calendar');
  const [adjMember, setAdjMember]   = useState(null);
  const [toast, setToast]           = useState('');

  const isAdmin  = currentUser?.role === 'admin';
  const canInput = isAdmin || currentUser?.canInputMeals;

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mealsRes, membersRes, adjRes] = await Promise.all([
        api.get(`/meals?month=${month}&year=${year}`),
        api.get('/users'),
        api.get(`/meal-adjustments?month=${month}&year=${year}`),
      ]);
      setMeals(mealsRes.data.data);
      setMembers(membersRes.data.data.filter(m => m.isActive));
      setAdjustments(adjRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    setSelected(new Set());
  }, [month, year]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [month, year]);
  const firstDay    = useMemo(() => new Date(year, month - 1, 1).getDay(), [month, year]);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const getDS    = day => `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

  const mealsByDate = useMemo(() => {
    const map = {};
    meals.forEach(ml => {
      const d   = new Date(ml.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(ml);
    });
    return map;
  }, [meals]);

  const memberTotals = useMemo(() => {
    const map = {};
    meals.forEach(ml => {
      const uid = ml.user?._id || ml.user;
      if (!map[uid]) map[uid] = { b: 0, l: 0, d: 0, total: 0 };
      map[uid].b     += ml.breakfast  || 0;
      map[uid].l     += ml.lunch      || 0;
      map[uid].d     += ml.dinner     || 0;
      map[uid].total += ml.totalMeals || 0;
    });
    return map;
  }, [meals]);

  const adjByMember = useMemo(() => {
    const map = {};
    adjustments.forEach(a => {
      const uid = a.user?._id || a.user;
      if (!map[uid]) map[uid] = 0;
      map[uid] += a.amount;
    });
    return map;
  }, [adjustments]);

  const rawTotal   = meals.reduce((s, m) => s + (m.totalMeals || 0), 0);
  const totalAdj   = adjustments.reduce((s, a) => s + a.amount, 0);
  const totalMeals = Math.max(0, rawTotal + totalAdj);

  const handleDayClick = day => {
    if (!canInput) return;
    const ds = getDS(day);
    if (ds > todayStr) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(ds)) next.delete(ds);
      else next.add(ds);
      return next;
    });
  };

  const selectAllPast = () => {
    const all = new Set();
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = getDS(d);
      if (ds <= todayStr) all.add(ds);
    }
    setSelected(all);
  };

  const clearSelection = () => setSelected(new Set());

  const sortedSelected = useMemo(() => [...selected].sort(), [selected]);
  const isSingleDay    = selected.size === 1;
  const singleDate     = isSingleDay ? [...selected][0] : null;
  const panelOpen      = selected.size > 0 && canInput;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">মিল ব্যবস্থাপনা</h1>
          <p className="text-gray-400 mt-1 text-sm">
            <span className="font-semibold text-gray-700">{totalMeals}</span> মিল ·{' '}
            <span className="font-semibold text-gray-700">{Object.keys(mealsByDate).length}</span> দিন ·{' '}
            <span className="font-semibold text-gray-700">{members.length}</span> সদস্য
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center gap-0.5 glass-panel rounded-xl p-1">
            {[['calendar', CalendarDays], ['summary', BarChart3]].map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v)}
                className="p-2 rounded-lg transition-all"
                style={view === v ? { background: 'linear-gradient(135deg,#7c3aed,#6366f1)', color: '#fff' } : { color: '#9ca3af' }}>
                <Icon size={15} />
              </button>
            ))}
          </div>

          {canInput && selected.size > 0 && (
            <button onClick={clearSelection}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              <X size={12} /> বাতিল ({selected.size})
            </button>
          )}
          {canInput && (
            <button onClick={selectAllPast}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-brand-200 text-brand-600 hover:bg-brand-50 transition-colors">
              <Users size={12} /> সব দিন
            </button>
          )}

          {/* Month nav */}
          <div className="flex items-center gap-0.5 glass-panel rounded-xl px-1">
            <button onClick={prevMonth} className="p-2 hover:bg-brand-50 rounded-xl text-gray-400 hover:text-brand-600 transition-all">
              <ChevronLeft size={17} />
            </button>
            <span className="text-gray-700 font-bold w-32 text-center text-sm">{MONTHS_BN[month - 1]} {year}</span>
            <button onClick={nextMonth} className="p-2 hover:bg-brand-50 rounded-xl text-gray-400 hover:text-brand-600 transition-all">
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {adjMember && (
        <AdjustmentModal
          member={adjMember} month={month} year={year}
          adjustments={adjustments}
          onSave={() => { fetchData(); showToast('মিল সমন্বয় সম্পন্ন হয়েছে'); }}
          onClose={() => setAdjMember(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-medium">
          <CheckCircle size={16} /> {toast}
        </div>
      )}

      {/* ── Hint ── */}
      {canInput && !selected.size && !loading && view === 'calendar' && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium border"
          style={{ background: '#f5f3ff', borderColor: '#ddd6fe', color: '#6d28d9' }}>
          <CalendarDays size={13} className="shrink-0" />
          একটি তারিখে ক্লিক করুন → মিল দেখুন ও সম্পাদনা করুন | একাধিক তারিখ সিলেক্ট করুন → বাল্ক এন্ট্রি করুন
        </div>
      )}

      {loading ? (
        <div className="glass-panel rounded-2xl p-16 text-center">
          <div className="w-10 h-10 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderWidth: 3, borderStyle: 'solid' }} />
          <p className="text-gray-400 text-sm font-medium">লোড হচ্ছে...</p>
        </div>
      ) : view === 'calendar' ? (

        <div className={`grid gap-5 items-start ${panelOpen ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1 lg:grid-cols-3'}`}>

          {/* ── Calendar ── */}
          <div className={panelOpen ? 'lg:col-span-3' : 'lg:col-span-2'}>
            <div className="glass-panel rounded-2xl overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
                {DAYS_SHORT.map((d, i) => (
                  <div key={i} className={`py-2.5 text-center text-[11px] font-bold tracking-wide ${
                    i === 5 ? 'text-rose-400' : i === 0 ? 'text-brand-400' : 'text-gray-400'
                  }`}>{d}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`e${i}`} className="h-16 sm:h-[72px] border-b border-r border-gray-50/80 bg-gray-50/20" />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day      = i + 1;
                  const ds       = getDS(day);
                  const isToday  = ds === todayStr;
                  const isFuture = ds > todayStr;
                  const isSel    = selected.has(ds);
                  const dayData  = mealsByDate[ds] || [];
                  const hasData  = dayData.length > 0;
                  const dayTotal = dayData.reduce((s, m) => s + (m.totalMeals || 0), 0);
                  const isFri    = new Date(year, month - 1, day).getDay() === 5;
                  const isSun    = new Date(year, month - 1, day).getDay() === 0;

                  return (
                    <div key={day}
                      onClick={() => !isFuture && handleDayClick(day)}
                      className={`h-16 sm:h-[72px] relative flex flex-col p-1.5 sm:p-2 transition-all duration-150 border-b border-r border-gray-50
                        ${isFuture ? 'opacity-25 cursor-default' : canInput ? 'cursor-pointer' : 'cursor-default'}
                        ${isSel ? 'bg-brand-50' : hasData ? 'bg-white hover:bg-gray-50/80' : 'bg-white hover:bg-gray-50/50'}
                      `}>
                      {isSel && <div className="absolute inset-0 ring-2 ring-inset ring-brand-400 rounded-sm pointer-events-none z-10" />}

                      <div className="flex items-start justify-between">
                        <span className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-black leading-none transition-all ${
                          isToday ? 'text-white shadow-md' :
                          isSel   ? 'text-brand-700' :
                          isFri   ? 'text-rose-400' :
                          isSun   ? 'text-brand-400' : 'text-gray-700'
                        }`}
                        style={isToday ? { background: 'linear-gradient(135deg,#7c3aed,#6366f1)' } : {}}>
                          {day}
                        </span>
                        {isSel && (
                          <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}>
                            <span className="text-white text-[8px] font-black">✓</span>
                          </div>
                        )}
                      </div>

                      {hasData && (
                        <div className="mt-auto">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-black leading-none" style={{ color: isSel ? '#7c3aed' : '#6d28d9' }}>
                              {dayTotal}
                            </span>
                            <div className="flex gap-0.5">
                              {dayData.slice(0, 3).map((_, idx) => (
                                <div key={idx} className="w-1 h-1 rounded-full" style={{ background: isSel ? '#7c3aed' : '#a78bfa' }} />
                              ))}
                              {dayData.length > 3 && <span className="text-[8px] text-gray-300 font-bold">+{dayData.length - 3}</span>}
                            </div>
                          </div>
                        </div>
                      )}
                      {!hasData && !isFuture && <div className="mt-auto w-full h-0.5 rounded-full bg-gray-100" />}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="px-4 py-2.5 bg-gray-50/60 border-t border-gray-100 flex flex-wrap items-center gap-4 text-[10px] text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded ring-2 ring-brand-400 bg-brand-50 inline-block" /> সিলেক্টেড
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="font-black text-brand-600">৮</span> = দিনের মোট মিল
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-300 inline-block" /> = সদস্যের এন্ট্রি
                </span>
              </div>
            </div>
          </div>

          {/* ── Right Panel ── */}
          {panelOpen ? (
            <div className="lg:col-span-2">
              <div className="sticky top-4 max-h-[calc(100vh-6rem)] flex flex-col">
                {isSingleDay ? (
                  <DayDetailPanel
                    date={singleDate}
                    members={members}
                    mealsByDate={mealsByDate}
                    onRefresh={() => { fetchData(); showToast('মিল আপডেট হয়েছে'); }}
                    onClear={clearSelection}
                  />
                ) : (
                  <BulkEntryPanel
                    selectedDates={sortedSelected}
                    members={members}
                    onSave={() => { fetchData(); showToast(`${selected.size} দিনের মিল সেভ হয়েছে!`); }}
                    onClear={clearSelection}
                  />
                )}
              </div>
            </div>
          ) : (
            /* Stats sidebar when no date selected */
            <div className="lg:col-span-1 space-y-4">
              <div className="glass-panel rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={15} className="text-brand-500" />
                  <p className="text-sm font-bold text-gray-700">এই মাসের সারসংক্ষেপ</p>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'মোট মিল',    val: totalMeals, Icon: Utensils, color: '#7c3aed' },
                    { label: 'সকালের মিল', val: meals.reduce((s,m) => s+(m.breakfast||0), 0), Icon: Sun,     color: '#f59e0b' },
                    { label: 'দুপুরের মিল',val: meals.reduce((s,m) => s+(m.lunch||0),    0), Icon: Utensils, color: '#16a34a' },
                    { label: 'রাতের মিল',  val: meals.reduce((s,m) => s+(m.dinner||0),   0), Icon: Moon,     color: '#4338ca' },
                  ].map(({ label, val, Icon, color }) => (
                    <div key={label} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + '18' }}>
                        <Icon size={13} style={{ color }} />
                      </div>
                      <span className="text-xs text-gray-600 flex-1">{label}</span>
                      <span className="text-sm font-black" style={{ color }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {members.length > 0 && (
                <div className="glass-panel rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-700">সদস্যদের মিল</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {members.map(m => {
                      const mt    = memberTotals[m._id] || { total: 0 };
                      const adj   = adjByMember[m._id] || 0;
                      const final = Math.max(0, mt.total + adj);
                      const pct   = totalMeals > 0 ? (final / totalMeals) * 100 : 0;
                      return (
                        <div key={m._id} className="px-4 py-3 flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                            style={{ background: 'linear-gradient(135deg,#a78bfa,#818cf8)' }}>
                            {m.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">{m.name}</p>
                            <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#a78bfa,#6366f1)' }} />
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-sm font-black text-brand-600">{final}</span>
                            {adj !== 0 && (
                              <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${adj < 0 ? 'text-red-500 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}>
                                {adj > 0 ? '+' : ''}{adj}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      ) : (
        /* ── Summary Table View ── */
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-brand-500" />
              <h2 className="text-sm font-bold text-gray-700">সদস্যভিত্তিক বিস্তারিত — {MONTHS_BN[month - 1]} {year}</h2>
            </div>
            <span className="text-xs font-black text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-100">
              মোট {totalMeals} মিল
            </span>
          </div>

          {members.length === 0 ? (
            <div className="p-16 text-center">
              <Utensils size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">কোনো সদস্য নেই</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">সদস্য</th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-amber-500 uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-1"><Sun size={11} /> সকাল</div>
                    </th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-emerald-500 uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-1"><Utensils size={11} /> দুপুর</div>
                    </th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-1"><Moon size={11} /> রাত</div>
                    </th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-brand-500 uppercase tracking-wider">মোট</th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-amber-500 uppercase tracking-wider">সমন্বয়</th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">চূড়ান্ত</th>
                    {isAdmin && <th className="px-5 py-3.5" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {members.map(m => {
                    const mt    = memberTotals[m._id] || { b: 0, l: 0, d: 0, total: 0 };
                    const adj   = adjByMember[m._id] || 0;
                    const final = Math.max(0, mt.total + adj);
                    const pct   = totalMeals > 0 ? Math.round((final / totalMeals) * 100) : 0;
                    return (
                      <tr key={m._id} className="table-row-hover transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                              style={{ background: 'linear-gradient(135deg,#a78bfa,#818cf8)' }}>
                              {m.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{m.name}</p>
                              <p className="text-xs text-gray-400">{m.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">{mt.b}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">{mt.l}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">{mt.d}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-base font-black text-gray-600">{mt.total}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {adj !== 0 ? (
                            <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${adj < 0 ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}>
                              {adj > 0 ? '+' : ''}{adj}
                            </span>
                          ) : <span className="text-gray-300 text-sm">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-brand-700 shrink-0">{final}</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[40px]">
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#a78bfa,#6366f1)' }} />
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 shrink-0">{pct}%</span>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-4 text-right">
                            <button onClick={() => setAdjMember(m)}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all hover:shadow-sm"
                              style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#92400e' }}>
                              <SlidersHorizontal size={12} /> সমন্বয়
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-100">
                    <td className="px-5 py-4 text-sm font-bold text-gray-600">মোট</td>
                    <td className="px-4 py-4 text-center text-sm font-black text-amber-600">{meals.reduce((s,m) => s+(m.breakfast||0), 0)}</td>
                    <td className="px-4 py-4 text-center text-sm font-black text-emerald-600">{meals.reduce((s,m) => s+(m.lunch||0), 0)}</td>
                    <td className="px-4 py-4 text-center text-sm font-black text-indigo-600">{meals.reduce((s,m) => s+(m.dinner||0), 0)}</td>
                    <td className="px-4 py-4 text-center text-sm font-black text-gray-600">{rawTotal}</td>
                    <td className="px-4 py-4 text-center text-sm font-black">
                      {totalAdj !== 0 && (
                        <span className={totalAdj < 0 ? 'text-red-600' : 'text-emerald-600'}>
                          {totalAdj > 0 ? '+' : ''}{totalAdj}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-lg font-black text-brand-700">{totalMeals}</td>
                    {isAdmin && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
