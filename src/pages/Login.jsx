import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Globe, KeyRound } from 'lucide-react';

export function Login() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.phone, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'লগইন ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#f0f2ff' }}>

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #1e1152 0%, #2d1b69 50%, #1a0a4a 100%)' }}>
        {/* Decorative orbs */}
        <div className="absolute w-80 h-80 rounded-full opacity-20 top-[-5rem] right-[-5rem]"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)' }} />
        <div className="absolute w-64 h-64 rounded-full opacity-15 bottom-[-4rem] left-[-4rem]"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }} />
        <div className="absolute w-48 h-48 rounded-full opacity-10 bottom-1/3 right-1/4"
          style={{ background: 'radial-gradient(circle, #c4b5fd, transparent 70%)' }} />

        <div className="relative text-center text-white">
          {/* Icon */}
          <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'rgba(167, 139, 250, 0.2)', border: '1.5px solid rgba(167, 139, 250, 0.3)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="text-violet-300">
              <path d="M3 11l19-9-9 19-2-8-8-2z" />
            </svg>
          </div>

          <h1 className="text-4xl font-black tracking-tight mb-3" style={{
            background: 'linear-gradient(135deg, #ffffff, #e2d9f3)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            মেস হিসাব
          </h1>
          <p className="text-white/50 text-base mb-10">Smart Mess Management System</p>

          <div className="space-y-4 text-left max-w-xs mx-auto">
            {[
              { icon: '💰', text: 'মাসিক খরচ ও বিল ট্র্যাক করুন' },
              { icon: '🍽️', text: 'মিল রেকর্ড সহজে ম্যানেজ করুন' },
              { icon: '👥', text: 'সদস্যদের একটি জায়গায় পরিচালনা করুন' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-white/70 text-sm">
                <span className="text-xl">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl shadow-brand-600/10" style={{ border: '1.5px solid #e8e4f8' }}>

            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-6">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11l19-9-9 19-2-8-8-2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gradient">মেস হিসাব</h1>
            </div>

            <div className="mb-7">
              <h2 className="text-2xl font-bold text-gray-900">স্বাগতম!</h2>
              <p className="text-gray-400 text-sm mt-1">আপনার অ্যাকাউন্টে লগইন করুন</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">ফোন নম্বর</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="form-input"
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-600">পাসওয়ার্ড</label>
                  <Link to="/forgot-password"
                    className="text-xs text-brand-500 hover:text-brand-700 font-medium transition-colors flex items-center gap-1">
                    <KeyRound size={11} /> ভুলে গেছেন?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="form-input pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 transition-colors">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-3 text-base">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    লগইন হচ্ছে...
                  </span>
                ) : 'লগইন করুন'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              মেসে নতুন?{' '}
              <Link to="/signup" className="text-brand-600 hover:text-brand-700 font-semibold transition-colors">
                যোগ দিন
              </Link>
            </p>
          </div>

          {/* Lang toggle */}
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'bn' ? 'en' : 'bn')}
            className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-brand-600 transition-colors py-2">
            <Globe size={14} />
            {i18n.language === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
