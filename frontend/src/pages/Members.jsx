import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, Plus, Edit2, ToggleLeft, ToggleRight, X, Check, Trash2, Crown,
  Copy, RefreshCw, KeyRound, Mail, Archive, ArchiveRestore, Search,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ─── Member Modal ──────────────────────────────────── */
function MemberModal({ member, onClose, onSave }) {
  const [form, setForm] = useState({
    name: member?.name || '',
    phone: member?.phone || '',
    email: member?.email || '',
    password: '',
    roomNumber: member?.roomNumber || '',
    role: member?.role || 'member',
    canInputMeals: member?.canInputMeals ?? false,
    advancedPayment: member?.advancedPayment ?? 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-modal w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {member ? 'সদস্য সম্পাদনা' : 'নতুন সদস্য'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {member ? 'তথ্য আপডেট করুন' : 'নতুন সদস্যের তথ্য পূরণ করুন'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">নাম *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="form-input" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">ফোন *</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="form-input" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail size={11} /> ইমেইল (মাসিক বিল পাঠানোর জন্য)
            </label>
            <input
              type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="form-input" placeholder="example@email.com" />
            <p className="text-[10px] text-gray-400 mt-1">প্রতি মাসের শেষে স্বয়ংক্রিয় বিল এই ঠিকানায় যাবে</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                পাসওয়ার্ড {member ? '(ঐচ্ছিক)' : '*'}
              </label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="form-input" required={!member} placeholder={member ? '' : '১২৩৪'} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">রুম নম্বর</label>
              <input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                className="form-input" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">ভূমিকা</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="form-input">
                <option value="member">সদস্য</option>
                <option value="admin">অ্যাডমিন</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">অগ্রিম জমা (৳)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.advancedPayment}
                onChange={(e) => setForm({ ...form, advancedPayment: parseFloat(e.target.value) || 0 })}
                className="form-input"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">মিল ইনপুটের অনুমতি</p>
              <p className="text-xs text-gray-400 mt-0.5">মিল যোগ ও আপডেট করতে পারবে</p>
            </div>
            <button type="button" onClick={() => setForm({ ...form, canInputMeals: !form.canInputMeals })}
              className={`transition-colors ${form.canInputMeals ? 'text-brand-600' : 'text-gray-300'}`}>
              {form.canInputMeals ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 py-3">বাতিল</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
              {loading ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Confirm Dialog ────────────────────────────────── */
function ConfirmDialog({ title, message, hint, confirmLabel, danger, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    try { await onConfirm(); onClose(); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-modal w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 sm:p-7">
        <h2 className="text-base font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 mb-3">{message}</p>
        {hint && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-3 py-2.5 text-xs mb-5 flex items-start gap-2">
            <Check size={13} className="mt-0.5 shrink-0" />
            <span>{hint}</span>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1 py-3">বাতিল</button>
          <button onClick={handle} disabled={loading}
            className={`flex-1 font-semibold py-3 rounded-xl transition-all text-sm ${danger
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20'
              : 'btn-primary'}`}>
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Members Page ──────────────────────────────────── */
export function Members() {
  const { t } = useTranslation();
  const { user: currentUser, updateCurrentUser } = useAuth();
  const [members, setMembers]               = useState([]);
  const [archived, setArchived]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [tab, setTab]                       = useState('active'); // 'active' | 'archived'
  const [search, setSearch]                 = useState('');
  const [modal, setModal]                   = useState(null);
  const [archiveTarget, setArchiveTarget]   = useState(null);
  const [restoreTarget, setRestoreTarget]   = useState(null);
  const [transferTarget, setTransferTarget] = useState(null);
  const [copiedId, setCopiedId]             = useState(null);
  const [regenId, setRegenId]               = useState(null);

  const fetchMembers = async () => {
    try {
      const [activeRes, archivedRes] = await Promise.all([
        api.get('/users'),
        api.get('/users?archived=1'),
      ]);
      setMembers(activeRes.data.data);
      setArchived(archivedRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleSave = async (data) => {
    if (modal === 'add') await api.post('/users', data);
    else await api.put(`/users/${modal._id}`, data);
    fetchMembers();
  };

  const toggleActive = async (member) => {
    await api.put(`/users/${member._id}`, { isActive: !member.isActive });
    fetchMembers();
  };

  const handleArchive = async (member) => {
    await api.delete(`/users/${member._id}`);
    fetchMembers();
  };

  const handleRestore = async (member) => {
    await api.post(`/users/${member._id}/restore`);
    fetchMembers();
  };

  const handleCopyCode = (member) => {
    if (!member.memberCode) return;
    navigator.clipboard.writeText(member.memberCode);
    setCopiedId(member._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenCode = async (member) => {
    setRegenId(member._id);
    try {
      const res = await api.post(`/users/${member._id}/regenerate-code`);
      setMembers(prev => prev.map(m => m._id === member._id ? { ...m, memberCode: res.data.data.memberCode } : m));
    } catch (err) { console.error(err); }
    finally { setRegenId(null); }
  };

  const handleTransferAdmin = async (member) => {
    await api.put(`/users/${member._id}`, { role: 'admin' });
    await api.put(`/users/${currentUser._id}`, { role: 'member' });
    updateCurrentUser({ ...currentUser, role: 'member' });
    fetchMembers();
  };

  const isAdmin     = currentUser?.role === 'admin';
  const activeCount = members.filter((m) => m.isActive).length;
  const adminCount  = members.filter((m) => m.role === 'admin').length;
  const emailCount  = members.filter((m) => m.email).length;

  const list = tab === 'active' ? members : archived;
  const filteredList = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(m =>
      (m.name || '').toLowerCase().includes(q) ||
      (m.phone || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.roomNumber || '').toLowerCase().includes(q)
    );
  }, [list, search]);

  const MemberAvatar = ({ name, dim = false }) => (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${dim ? 'opacity-60' : ''}`}
      style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8)' }}>
      {name?.charAt(0)}
    </div>
  );

  const RoleBadge = ({ role }) =>
    role === 'admin'
      ? <span className="badge badge-violet"><Crown size={9} /> অ্যাডমিন</span>
      : <span className="badge" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>সদস্য</span>;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Modals */}
      {modal && (
        <MemberModal member={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {archiveTarget && (
        <ConfirmDialog
          title="সদস্য আর্কাইভ করুন"
          message={`"${archiveTarget.name}" কে রোস্টার থেকে সরিয়ে দেবেন?`}
          hint="তার পুরোনো সব মিল, খরচ ও বিলের তথ্য সংরক্ষিত থাকবে — পরবর্তীতে দেখা ও মাসিক বিল তৈরি করা যাবে।"
          confirmLabel="আর্কাইভ করুন" danger
          onConfirm={() => handleArchive(archiveTarget)}
          onClose={() => setArchiveTarget(null)}
        />
      )}
      {restoreTarget && (
        <ConfirmDialog
          title="সদস্য পুনরুদ্ধার করুন"
          message={`"${restoreTarget.name}" কে আবার সক্রিয় সদস্য করবেন?`}
          confirmLabel="পুনরুদ্ধার"
          onConfirm={() => handleRestore(restoreTarget)}
          onClose={() => setRestoreTarget(null)}
        />
      )}
      {transferTarget && (
        <ConfirmDialog
          title="অ্যাডমিন হস্তান্তর"
          message={`"${transferTarget.name}" কে অ্যাডমিন করলে আপনি সাধারণ সদস্য হবেন।`}
          confirmLabel="হস্তান্তর করুন"
          onConfirm={() => handleTransferAdmin(transferTarget)}
          onClose={() => setTransferTarget(null)}
        />
      )}

      {/* ── Hero Header ── */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #e0e7ff 100%)', border: '1.5px solid #ddd6fe' }}>
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}>
                <Users size={14} className="text-white" />
              </div>
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em]">টিম ব্যবস্থাপনা</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{t('sidebar.members')}</h1>
            <p className="text-gray-500 mt-1.5 text-sm">আপনার মেসের সদস্যদের সম্পূর্ণ তালিকা ও তথ্য একটি জায়গায়</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            {/* Mini stats */}
            <div className="flex items-center gap-2.5 bg-white/70 backdrop-blur rounded-xl px-3.5 py-2 border border-white">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-emerald-100">
                <Users size={11} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">সক্রিয়</p>
                <p className="text-sm font-black text-gray-900 leading-none mt-0.5">{activeCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-white/70 backdrop-blur rounded-xl px-3.5 py-2 border border-white">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-violet-100">
                <Crown size={11} className="text-violet-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">অ্যাডমিন</p>
                <p className="text-sm font-black text-gray-900 leading-none mt-0.5">{adminCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-white/70 backdrop-blur rounded-xl px-3.5 py-2 border border-white">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-amber-100">
                <Mail size={11} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">ইমেইল</p>
                <p className="text-sm font-black text-gray-900 leading-none mt-0.5">{emailCount}</p>
              </div>
            </div>

            {isAdmin && (
              <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={16} /> {t('members.add_member')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs + Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-1 glass-panel rounded-xl p-1 self-start">
          <button onClick={() => setTab('active')}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition-all"
            style={tab === 'active'
              ? { background: 'linear-gradient(135deg,#7c3aed,#6366f1)', color: '#fff', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }
              : { color: '#6b7280' }}>
            <Users size={12} /> সক্রিয় <span className={tab === 'active' ? 'text-white/80' : 'text-gray-400'}>({members.length})</span>
          </button>
          <button onClick={() => setTab('archived')}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition-all"
            style={tab === 'archived'
              ? { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }
              : { color: '#6b7280' }}>
            <Archive size={12} /> আর্কাইভ <span className={tab === 'archived' ? 'text-amber-700/80' : 'text-gray-400'}>({archived.length})</span>
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম, ফোন, রুম দিয়ে খুঁজুন..."
            className="form-input pl-9 pr-3 w-full sm:w-72 text-sm" />
        </div>
      </div>

      {tab === 'archived' && archived.length > 0 && (
        <div className="rounded-xl px-4 py-3 text-xs font-medium border flex items-start gap-2"
          style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
          <Archive size={13} className="shrink-0 mt-0.5" />
          <span>আর্কাইভ করা সদস্যদের সব পুরোনো তথ্য সংরক্ষিত আছে। যেকোনো সময় পুনরুদ্ধার করতে পারবেন এবং তাদের আগের মাসের বিল তৈরি ও ইমেইল করা যাবে।</span>
        </div>
      )}

      {loading ? (
        <div className="glass-panel rounded-2xl p-14 text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">লোড হচ্ছে...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="glass-panel rounded-2xl p-14 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {tab === 'active' ? <Users size={32} className="text-brand-400" /> : <Archive size={32} className="text-amber-400" />}
          </div>
          <p className="text-gray-500 font-medium">
            {search ? 'কোনো মিল পাওয়া যায়নি' : tab === 'active' ? 'কোনো সক্রিয় সদস্য নেই' : 'আর্কাইভ খালি'}
          </p>
        </div>
      ) : (
        <>
          {/* ── Mobile card view ──────────────────────── */}
          <div className="lg:hidden space-y-3">
            {filteredList.map((member) => {
              const isSelf      = member._id === currentUser?._id;
              const isArchivedM = member.isArchived;
              return (
                <div key={member._id} className="glass-panel rounded-2xl p-4 border border-gray-100 relative overflow-hidden">
                  {isArchivedM && (
                    <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-bold rounded-bl-2xl"
                      style={{ background: '#fef3c7', color: '#92400e' }}>
                      আর্কাইভড
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <MemberAvatar name={member.name} dim={isArchivedM} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-semibold text-sm truncate ${isArchivedM ? 'text-gray-500' : 'text-gray-900'}`}>{member.name}</p>
                          {isSelf && <span className="text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full font-medium">আপনি</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{member.phone}</p>
                        {member.email && (
                          <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 truncate">
                            <Mail size={9} /> {member.email}
                          </p>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        {!isArchivedM && (
                          <button onClick={() => setModal(member)}
                            className="p-2 hover:bg-brand-50 rounded-lg text-gray-400 hover:text-brand-600 transition-all">
                            <Edit2 size={15} />
                          </button>
                        )}
                        {!isArchivedM && !isSelf && member.role !== 'admin' && (
                          <button onClick={() => setTransferTarget(member)}
                            className="p-2 hover:bg-violet-50 rounded-lg text-gray-400 hover:text-violet-600 transition-all">
                            <Crown size={15} />
                          </button>
                        )}
                        {!isArchivedM && !isSelf && (
                          <button onClick={() => setArchiveTarget(member)} title="আর্কাইভ করুন"
                            className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-all">
                            <Trash2 size={15} />
                          </button>
                        )}
                        {isArchivedM && (
                          <button onClick={() => setRestoreTarget(member)} title="পুনরুদ্ধার"
                            className="p-2 hover:bg-emerald-50 rounded-lg text-gray-400 hover:text-emerald-600 transition-all">
                            <ArchiveRestore size={15} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">রুম:</span>
                      <span className="text-gray-700 font-medium">{member.roomNumber || '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">ভূমিকা:</span>
                      <RoleBadge role={member.role} />
                    </div>
                    {!isArchivedM && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">মিল:</span>
                        {member.canInputMeals
                          ? <span className="badge badge-green"><Check size={9} /> হ্যাঁ</span>
                          : <span className="text-gray-300">না</span>}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">অবস্থা:</span>
                      <span className={`badge ${isArchivedM ? 'badge-amber' : member.isActive ? 'badge-green' : 'badge-red'}`}>
                        {isArchivedM ? 'আর্কাইভড' : member.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </div>
                    {member.advancedPayment > 0 && (
                      <div className="flex items-center gap-1.5 col-span-2">
                        <span className="text-gray-400">অগ্রিম জমা:</span>
                        <span className="text-blue-600 font-semibold">৳ {member.advancedPayment.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {!isArchivedM && isAdmin && member.role === 'member' && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <KeyRound size={9} /> লগইন কোড
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-black tracking-[0.2em] text-brand-700 text-sm bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100">
                          {member.memberCode || '—'}
                        </span>
                        {member.memberCode && (
                          <button onClick={() => handleCopyCode(member)}
                            className="p-1.5 hover:bg-brand-50 rounded-lg text-gray-400 hover:text-brand-600 transition-all"
                            title="কপি করুন">
                            {copiedId === member._id ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                          </button>
                        )}
                        <button onClick={() => handleRegenCode(member)} disabled={regenId === member._id}
                          className="p-1.5 hover:bg-amber-50 rounded-lg text-gray-400 hover:text-amber-500 transition-all"
                          title="নতুন কোড তৈরি করুন">
                          <RefreshCw size={13} className={regenId === member._id ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    </div>
                  )}

                  {!isArchivedM && isAdmin && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                      <button onClick={() => toggleActive(member)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all border ${
                          member.isActive
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-green-50 text-green-600 border-green-200'
                        }`}>
                        {member.isActive
                          ? <span className="flex items-center gap-1"><ToggleRight size={13} /> নিষ্ক্রিয় করুন</span>
                          : <span className="flex items-center gap-1"><ToggleLeft size={13} /> সক্রিয় করুন</span>}
                      </button>
                    </div>
                  )}
                  {isArchivedM && member.archivedAt && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-[10px] text-gray-400">
                        আর্কাইভ হয়েছে: {new Date(member.archivedAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Desktop table ─────────────────────────── */}
          <div className="hidden lg:block glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">নাম</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">যোগাযোগ</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">রুম</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ভূমিকা</th>
                    {tab === 'active' && (
                      <>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">মিল</th>
                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">অগ্রিম</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">লগইন কোড</th>
                      </>
                    )}
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">অবস্থা</th>
                    {isAdmin && <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">কার্যক্রম</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredList.map((member) => {
                    const isSelf      = member._id === currentUser?._id;
                    const isArchivedM = member.isArchived;
                    return (
                      <tr key={member._id} className={`table-row-hover transition-colors ${isArchivedM ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <MemberAvatar name={member.name} dim={isArchivedM} />
                            <div>
                              <span className={`font-semibold text-sm ${isArchivedM ? 'text-gray-500' : 'text-gray-900'}`}>{member.name}</span>
                              {isSelf && <span className="ml-2 text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full font-medium">আপনি</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-gray-600">{member.phone}</div>
                          {member.email && (
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Mail size={10} /> {member.email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{member.roomNumber || '—'}</td>
                        <td className="px-6 py-4"><RoleBadge role={member.role} /></td>
                        {tab === 'active' && (
                          <>
                            <td className="px-6 py-4">
                              {member.canInputMeals
                                ? <span className="badge badge-green"><Check size={10} /> হ্যাঁ</span>
                                : <span className="text-gray-300 text-sm">—</span>}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {member.advancedPayment > 0
                                ? <span className="text-blue-600 font-semibold text-sm">৳ {member.advancedPayment.toLocaleString()}</span>
                                : <span className="text-gray-300 text-sm">—</span>}
                            </td>
                            <td className="px-6 py-4">
                              {member.role === 'member' && isAdmin ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black tracking-[0.15em] text-brand-700 text-xs bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100">
                                    {member.memberCode || '—'}
                                  </span>
                                  {member.memberCode && (
                                    <button onClick={() => handleCopyCode(member)}
                                      className="p-1 hover:bg-brand-50 rounded text-gray-300 hover:text-brand-600 transition-all">
                                      {copiedId === member._id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                    </button>
                                  )}
                                  <button onClick={() => handleRegenCode(member)} disabled={regenId === member._id}
                                    className="p-1 hover:bg-amber-50 rounded text-gray-300 hover:text-amber-500 transition-all">
                                    <RefreshCw size={12} className={regenId === member._id ? 'animate-spin' : ''} />
                                  </button>
                                </div>
                              ) : <span className="text-gray-300 text-sm">—</span>}
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4">
                          {isArchivedM ? (
                            <span className="badge badge-amber">
                              <Archive size={10} /> আর্কাইভড
                              {member.archivedAt && (
                                <span className="text-[9px] opacity-70 ml-1">
                                  · {new Date(member.archivedAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className={`badge ${member.isActive ? 'badge-green' : 'badge-red'}`}>
                              {member.isActive ? t('members.active') : t('members.inactive')}
                            </span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isArchivedM ? (
                                <>
                                  <button onClick={() => setModal(member)} title="সম্পাদনা"
                                    className="p-2 hover:bg-brand-50 rounded-lg text-gray-400 hover:text-brand-600 transition-all">
                                    <Edit2 size={15} />
                                  </button>
                                  <button onClick={() => toggleActive(member)}
                                    title={member.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                                    className={`p-2 rounded-lg transition-all ${member.isActive ? 'hover:bg-amber-50 text-gray-400 hover:text-amber-500' : 'hover:bg-green-50 text-gray-400 hover:text-green-500'}`}>
                                    {member.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                                  </button>
                                  {!isSelf && member.role !== 'admin' && (
                                    <button onClick={() => setTransferTarget(member)} title="অ্যাডমিন করুন"
                                      className="p-2 hover:bg-violet-50 rounded-lg text-gray-400 hover:text-violet-600 transition-all">
                                      <Crown size={15} />
                                    </button>
                                  )}
                                  {!isSelf && (
                                    <button onClick={() => setArchiveTarget(member)} title="আর্কাইভ করুন"
                                      className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-all">
                                      <Trash2 size={15} />
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button onClick={() => setRestoreTarget(member)} title="পুনরুদ্ধার"
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-all">
                                  <ArchiveRestore size={13} /> পুনরুদ্ধার
                                </button>
                              )}
                            </div>
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
