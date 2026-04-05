import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Edit2, ToggleLeft, ToggleRight, X, Check, Trash2, Crown } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ─── Member Modal ──────────────────────────────────── */
function MemberModal({ member, onClose, onSave }) {
  const [form, setForm] = useState({
    name: member?.name || '',
    phone: member?.phone || '',
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
function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    try { await onConfirm(); onClose(); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-modal w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 sm:p-7">
        <h2 className="text-base font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
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
  const [members, setMembers]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [transferTarget, setTransferTarget] = useState(null);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/users');
      setMembers(res.data.data);
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

  const handleDelete = async (member) => {
    await api.delete(`/users/${member._id}`);
    fetchMembers();
  };

  const handleTransferAdmin = async (member) => {
    await api.put(`/users/${member._id}`, { role: 'admin' });
    await api.put(`/users/${currentUser._id}`, { role: 'member' });
    updateCurrentUser({ ...currentUser, role: 'member' });
    fetchMembers();
  };

  const isAdmin      = currentUser?.role === 'admin';
  const activeCount  = members.filter((m) => m.isActive).length;

  const MemberAvatar = ({ name }) => (
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
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
      {deleteTarget && (
        <ConfirmDialog
          title="সদস্য মুছে ফেলুন"
          message={`"${deleteTarget.name}" কে স্থায়ীভাবে মুছে ফেলবেন?`}
          confirmLabel="মুছে ফেলুন" danger
          onConfirm={() => handleDelete(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
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

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">{t('sidebar.members')}</h1>
          <p className="text-gray-400 mt-1 text-sm">{activeCount} জন সক্রিয় সদস্য</p>
        </div>
        {isAdmin && (
          <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={17} /> {t('members.add_member')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-14 text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">লোড হচ্ছে...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="glass-panel rounded-2xl p-14 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-brand-400" />
          </div>
          <p className="text-gray-500 font-medium">কোনো সদস্য নেই</p>
        </div>
      ) : (
        <>
          {/* ── Mobile card view ──────────────────────── */}
          <div className="lg:hidden space-y-3">
            {members.map((member) => {
              const isSelf = member._id === currentUser?._id;
              return (
                <div key={member._id} className="glass-panel rounded-2xl p-4 border border-gray-100">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <MemberAvatar name={member.name} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm truncate">{member.name}</p>
                          {isSelf && <span className="text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full font-medium">আপনি</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{member.phone}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => setModal(member)}
                          className="p-2 hover:bg-brand-50 rounded-lg text-gray-400 hover:text-brand-600 transition-all">
                          <Edit2 size={15} />
                        </button>
                        {!isSelf && member.role !== 'admin' && (
                          <button onClick={() => setTransferTarget(member)}
                            className="p-2 hover:bg-violet-50 rounded-lg text-gray-400 hover:text-violet-600 transition-all">
                            <Crown size={15} />
                          </button>
                        )}
                        {!isSelf && (
                          <button onClick={() => setDeleteTarget(member)}
                            className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-all">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Info grid */}
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">রুম:</span>
                      <span className="text-gray-700 font-medium">{member.roomNumber || '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">ভূমিকা:</span>
                      <RoleBadge role={member.role} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">মিল:</span>
                      {member.canInputMeals
                        ? <span className="badge badge-green"><Check size={9} /> হ্যাঁ</span>
                        : <span className="text-gray-300">না</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">অবস্থা:</span>
                      <span className={`badge ${member.isActive ? 'badge-green' : 'badge-red'}`}>
                        {member.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </div>
                    {member.advancedPayment > 0 && (
                      <div className="flex items-center gap-1.5 col-span-2">
                        <span className="text-gray-400">অগ্রিম জমা:</span>
                        <span className="text-blue-600 font-semibold">৳ {member.advancedPayment.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Toggle active */}
                  {isAdmin && (
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
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ফোন</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">রুম</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ভূমিকা</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">মিল</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">অগ্রিম জমা</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">অবস্থা</th>
                    {isAdmin && <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">কার্যক্রম</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((member) => {
                    const isSelf = member._id === currentUser?._id;
                    return (
                      <tr key={member._id} className="table-row-hover transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <MemberAvatar name={member.name} />
                            <div>
                              <span className="text-gray-900 font-semibold text-sm">{member.name}</span>
                              {isSelf && <span className="ml-2 text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full font-medium">আপনি</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{member.phone}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{member.roomNumber || '—'}</td>
                        <td className="px-6 py-4"><RoleBadge role={member.role} /></td>
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
                          <span className={`badge ${member.isActive ? 'badge-green' : 'badge-red'}`}>
                            {member.isActive ? t('members.active') : t('members.inactive')}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1.5">
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
                                <button onClick={() => setDeleteTarget(member)} title="মুছে ফেলুন"
                                  className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-all">
                                  <Trash2 size={15} />
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
