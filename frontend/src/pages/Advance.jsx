import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Trash2, Plus, Wallet2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MONTHS_BN = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];

function AddAdvanceModal({ members, month, year, onClose, onSaved }) {
  const [userId, setUserId]   = useState('');
  const [amount, setAmount]   = useState('');
  const [note, setNote]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !amount || parseFloat(amount) <= 0) {
      setError('সদস্য বেছে নিন এবং সঠিক পরিমাণ দিন');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/advance-payments', {
        userId,
        month,
        year,
        amount: parseFloat(amount),
        note: note.trim(),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'ত্রুটি হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const selectedMember = members.find(m => m._id === userId);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-modal w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 sm:p-7">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">অগ্রিম যোগ করুন</h2>
            <p className="text-xs text-gray-400 mt-0.5">{MONTHS_BN[month - 1]} {year}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">সদস্য বেছে নিন</label>
            <select
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className="form-input"
              required
            >
              <option value="">-- সদস্য বেছে নিন --</option>
              {members.map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
            {selectedMember && (
              <p className="text-xs text-gray-400 mt-1">{selectedMember.phone}{selectedMember.roomNumber ? ` · রুম ${selectedMember.roomNumber}` : ''}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">অগ্রিম পরিমাণ (৳)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="যেমন: 500"
              className="form-input"
              required
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">নোট (ঐচ্ছিক)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="যেমন: নগদ প্রদান"
              className="form-input"
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">বাতিল</button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all text-sm shadow-md shadow-blue-500/20"
            >
              {loading ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Advance() {
  const { user: currentUser } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [advances, setAdvances]   = useState([]);
  const [members, setMembers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId]   = useState(null);

  const isAdmin = currentUser?.role === 'admin';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [advRes, memRes] = await Promise.all([
        api.get(`/advance-payments?month=${month}&year=${year}`),
        api.get('/users'),
      ]);
      setAdvances(advRes.data.data);
      setMembers(memRes.data.data.filter(m => m.isActive));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [month, year]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/advance-payments/${id}`);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const totalAdvance = advances.reduce((sum, a) => sum + a.amount, 0);

  // Group by member
  const byMember = advances.reduce((acc, a) => {
    const uid = a.user?._id;
    if (!uid) return acc;
    if (!acc[uid]) acc[uid] = { user: a.user, total: 0, entries: [] };
    acc[uid].total += a.amount;
    acc[uid].entries.push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {showModal && (
        <AddAdvanceModal
          members={members}
          month={month}
          year={year}
          onClose={() => setShowModal(false)}
          onSaved={fetchData}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-modal w-full max-w-xs rounded-2xl p-6 text-center">
            <p className="text-gray-800 font-semibold mb-4">এই অগ্রিম মুছে ফেলবেন?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-ghost flex-1">না</button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
              >
                হ্যাঁ, মুছুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">অগ্রিম পেমেন্ট</h1>
          <p className="text-gray-400 mt-1 text-sm">
            মোট জমা:{' '}
            <span className="text-blue-600 font-semibold">৳ {totalAdvance.toLocaleString()}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/20"
            >
              <Plus size={15} />
              অগ্রিম যোগ
            </button>
          )}
          <div className="flex items-center gap-1 glass-panel rounded-xl px-1">
            <button onClick={prevMonth} className="p-2 hover:bg-brand-50 rounded-xl text-gray-400 hover:text-brand-600 transition-all">
              <ChevronLeft size={18} />
            </button>
            <span className="text-gray-700 font-semibold w-28 sm:w-32 text-center text-sm">{MONTHS_BN[month - 1]} {year}</span>
            <button onClick={nextMonth} className="p-2 hover:bg-brand-50 rounded-xl text-gray-400 hover:text-brand-600 transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-14 text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">লোড হচ্ছে...</p>
        </div>
      ) : advances.length === 0 ? (
        <div className="glass-panel rounded-2xl p-14 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet2 size={32} className="text-blue-400" />
          </div>
          <p className="text-gray-500 font-medium">{MONTHS_BN[month - 1]} {year}-এ কোনো অগ্রিম নেই</p>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all"
            >
              প্রথম অগ্রিম যোগ করুন
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(byMember).map(({ user, total, entries }) => (
            <div key={user._id} className="glass-panel rounded-2xl overflow-hidden">
              {/* Member header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)' }}>
                    {user.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.phone}{user.roomNumber ? ` · রুম ${user.roomNumber}` : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">মোট অগ্রিম</p>
                  <p className="text-blue-600 font-bold text-lg">৳ {total.toLocaleString()}</p>
                </div>
              </div>

              {/* Individual entries */}
              <div className="divide-y divide-gray-50">
                {entries.map(entry => (
                  <div key={entry._id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-gray-800 font-semibold text-sm">৳ {entry.amount.toLocaleString()}</p>
                      {entry.note && <p className="text-xs text-gray-400 mt-0.5">{entry.note}</p>}
                      <p className="text-xs text-gray-300 mt-0.5">
                        {new Date(entry.createdAt).toLocaleDateString('bn-BD')}
                        {entry.recordedBy?.name ? ` · ${entry.recordedBy.name}` : ''}
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => setDeleteId(entry._id)}
                        className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-xl transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
