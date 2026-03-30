import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router';
import { LayoutDashboard, Users, Utensils, Receipt, Banknote, LogOut, ShieldCheck, Globe, X, KeyRound, Eye, EyeOff, CheckCircle, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/* ─── Change Password Modal ─────────────────────────── */
function ChangePasswordModal({ onClose }) {
  const [form, setForm]           = useState({ current: '', next: '', confirm: '' });
  const [showCur, setShowCur]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.next.length < 4)    { setError('নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষর হতে হবে'); return; }
    if (form.next !== form.confirm) { setError('নতুন পাসওয়ার্ড দুটো মিলছে না'); return; }
    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword: form.current, newPassword: form.next });
      setSuccess(true);
      setTimeout(onClose, 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-modal w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 sm:p-7">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">পাসওয়ার্ড পরিবর্তন</h2>
            <p className="text-xs text-gray-400 mt-0.5">নিরাপদ রাখতে নিয়মিত পরিবর্তন করুন</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#dcfce7' }}>
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <p className="text-gray-700 font-semibold">পাসওয়ার্ড পরিবর্তন হয়েছে!</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 mb-4 text-sm">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">বর্তমান পাসওয়ার্ড *</label>
                <div className="relative">
                  <input type={showCur ? 'text' : 'password'} value={form.current}
                    onChange={(e) => setForm({ ...form, current: e.target.value })}
                    className="form-input pr-11" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowCur(!showCur)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-brand-600 transition-colors">
                    {showCur ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">নতুন পাসওয়ার্ড *</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} value={form.next}
                    onChange={(e) => setForm({ ...form, next: e.target.value })}
                    className="form-input pr-11" placeholder="কমপক্ষে ৪ অক্ষর" required />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-brand-600 transition-colors">
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">নিশ্চিত করুন *</label>
                <input type="password" value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className={`form-input ${form.confirm && form.confirm !== form.next ? 'border-red-300' : form.confirm && form.confirm === form.next ? 'border-emerald-400' : ''}`}
                  placeholder="পুনরায় লিখুন" required />
                {form.confirm && form.confirm !== form.next && (
                  <p className="text-xs text-red-500 mt-1">পাসওয়ার্ড মিলছে না</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="btn-ghost flex-1 py-3">বাতিল</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      পরিবর্তন...
                    </span>
                  ) : 'পরিবর্তন করুন'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export function Sidebar({ isOpen, onClose }) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showChangePass, setShowChangePass] = useState(false);

  const navItems = [
    { name: t('sidebar.dashboard'), path: '/',        icon: LayoutDashboard },
    { name: t('sidebar.members'),   path: '/members', icon: Users },
    { name: t('sidebar.meals'),     path: '/meals',   icon: Utensils },
    { name: t('sidebar.expenses'),  path: '/expenses',icon: Receipt },
    { name: t('sidebar.billing'),   path: '/billing', icon: Banknote },
    { name: 'ব্যক্তিগত হিসাব',     path: '/ledger',  icon: BookOpen },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose?.();
  };

  const handleLangToggle = () => {
    i18n.changeLanguage(i18n.language === 'bn' ? 'en' : 'bn');
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
    {showChangePass && <ChangePasswordModal onClose={() => setShowChangePass(false)} />}
    <div
      className={clsx(
        'sidebar-bg h-screen w-64 flex flex-col fixed left-0 top-0 z-30',
        'transition-transform duration-300 ease-in-out',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Logo + mobile close */}
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8)' }}>
            <Utensils size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gradient-white leading-tight">মেস হিসাব</h1>
            <p className="text-[10px] text-white/40 tracking-wider uppercase">Management</p>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                isActive
                  ? 'nav-active'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/8'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={18}
                  className={clsx(
                    'shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'
                  )}
                />
                <span className="text-sm font-medium tracking-wide">{item.name}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 pt-2 border-t border-white/10 space-y-2">
        {user && (
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/8 mb-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8)' }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-semibold truncate leading-tight">{user.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {user.role === 'admin' && <ShieldCheck size={10} className="text-violet-300 shrink-0" />}
                <p className="text-[11px] text-white/40">{user.role === 'admin' ? 'অ্যাডমিন' : 'সদস্য'}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowChangePass(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/6 hover:bg-white/12 transition-colors text-xs text-white/50 hover:text-white/80"
        >
          <KeyRound size={13} />
          পাসওয়ার্ড পরিবর্তন
        </button>

        <button
          onClick={handleLangToggle}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/6 hover:bg-white/12 transition-colors text-xs text-white/50 hover:text-white/80"
        >
          <Globe size={13} />
          {i18n.language === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 transition-colors text-sm text-rose-300 hover:text-rose-200"
        >
          <LogOut size={16} />
          <span className="font-medium">{t('common.logout')}</span>
        </button>
      </div>
    </div>
    </>
  );
}
