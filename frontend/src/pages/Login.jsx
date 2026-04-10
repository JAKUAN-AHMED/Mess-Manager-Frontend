import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ChefHat, KeyRound, ShieldCheck } from 'lucide-react';

export function Login() {
  const { login, memberLogin } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode]         = useState('member'); // 'member' | 'admin'
  const [code, setCode]         = useState('');
  const [adminForm, setAdminForm] = useState({ phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleMemberLogin = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError(''); setLoading(true);
    try {
      await memberLogin(code.trim());
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'কোডটি সঠিক নয়');
    } finally { setLoading(false); }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(adminForm.phone, adminForm.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'ফোন বা পাসওয়ার্ড ভুল');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#f0f2ff' }}>

      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #1e1152 0%, #2d1b69 50%, #1a0a4a 100%)' }}>
        <div className="absolute w-80 h-80 rounded-full opacity-20 top-[-5rem] right-[-5rem]"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)' }} />
        <div className="absolute w-64 h-64 rounded-full opacity-15 bottom-[-4rem] left-[-4rem]"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }} />

        <div className="relative text-center text-white">
          <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'rgba(167,139,250,0.2)', border: '1.5px solid rgba(167,139,250,0.3)' }}>
            <ChefHat size={40} className="text-violet-300" />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-3" style={{
            background: 'linear-gradient(135deg,#ffffff,#e2d9f3)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>মেস হিসাব</h1>
          <p className="text-white/50 text-base mb-10">Smart Mess Management System</p>
          <div className="space-y-4 text-left max-w-xs mx-auto">
            {[
              { icon: '💰', text: 'মাসিক খরচ ও বিল ট্র্যাক করুন' },
              { icon: '🍽️', text: 'মিল রেকর্ড সহজে ম্যানেজ করুন' },
              { icon: '👥', text: 'সদস্যদের একটি জায়গায় পরিচালনা করুন' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-white/70 text-sm">
                <span className="text-xl">{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}>
              <ChefHat size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gradient">মেস হিসাব</h1>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-brand-600/10 overflow-hidden"
            style={{ border: '1.5px solid #e8e4f8' }}>

            {/* Mode tabs */}
            <div className="grid grid-cols-2 border-b border-gray-100">
              <button onClick={() => { setMode('member'); setError(''); }}
                className="py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={mode === 'member'
                  ? { background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', color: '#7c3aed', borderBottom: '2px solid #7c3aed' }
                  : { color: '#94a3b8' }}>
                <KeyRound size={15} /> সদস্য লগইন
              </button>
              <button onClick={() => { setMode('admin'); setError(''); }}
                className="py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={mode === 'admin'
                  ? { background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', color: '#16a34a', borderBottom: '2px solid #16a34a' }
                  : { color: '#94a3b8' }}>
                <ShieldCheck size={15} /> ম্যানেজার
              </button>
            </div>

            <div className="p-6 sm:p-8">

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* ── Member code login ── */}
              {mode === 'member' && (
                <form onSubmit={handleMemberLogin} className="space-y-5">
                  <div className="text-center mb-2">
                    <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)' }}>
                      <KeyRound size={24} className="text-violet-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">মেম্বার কোড দিন</h2>
                    <p className="text-gray-400 text-sm mt-1">আপনার ম্যানেজার আপনাকে ৬ অক্ষরের একটি কোড দিয়েছে</p>
                  </div>

                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    className="form-input text-center text-2xl font-black tracking-[0.4em] uppercase"
                    placeholder="ABC123"
                    maxLength={6}
                    autoFocus
                    required
                  />

                  <button type="submit" disabled={loading || code.length < 6} className="btn-primary w-full py-3 text-base">
                    {loading
                      ? <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          লগইন হচ্ছে...
                        </span>
                      : 'লগইন করুন'}
                  </button>
                </form>
              )}

              {/* ── Admin phone+password login ── */}
              {mode === 'admin' && (
                <form onSubmit={handleAdminLogin} className="space-y-5">
                  <div className="text-center mb-2">
                    <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)' }}>
                      <ShieldCheck size={24} className="text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">ম্যানেজার লগইন</h2>
                    <p className="text-gray-400 text-sm mt-1">ফোন নম্বর ও পাসওয়ার্ড দিয়ে লগইন করুন</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">ফোন নম্বর</label>
                    <input
                      type="tel"
                      value={adminForm.phone}
                      onChange={e => setAdminForm({ ...adminForm, phone: e.target.value })}
                      className="form-input"
                      placeholder="01XXXXXXXXX"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">পাসওয়ার্ড</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={adminForm.password}
                        onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                        className="form-input pr-12"
                        placeholder="••••••••"
                        required
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 transition-colors">
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-3 text-base font-bold rounded-xl text-white transition-all"
                    style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }}>
                    {loading
                      ? <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          লগইন হচ্ছে...
                        </span>
                      : 'লগইন করুন'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
