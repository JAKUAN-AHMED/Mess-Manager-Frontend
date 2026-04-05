import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../services/api';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = enter details, 2 = success
  const [form, setForm] = useState({
    phone:       '',
    joinCode:    '',
    newPassword: '',
    confirmPass: '',
  });
  const [showPass, setShowPass]         = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.newPassword.length < 4) {
      setError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষর হতে হবে');
      return;
    }
    if (form.newPassword !== form.confirmPass) {
      setError('পাসওয়ার্ড দুটো মিলছে না');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', {
        phone:       form.phone,
        joinCode:    form.joinCode,
        newPassword: form.newPassword,
      });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ─────────────────────────────── */
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f0f2ff' }}>
        <div className="w-full max-w-sm text-center">
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-brand-600/10" style={{ border: '1.5px solid #e8e4f8' }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{ background: '#dcfce7' }}>
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">পাসওয়ার্ড পরিবর্তন হয়েছে!</h2>
            <p className="text-gray-400 text-sm mb-6">নতুন পাসওয়ার্ড দিয়ে লগইন করুন।</p>
            <button onClick={() => navigate('/login')} className="btn-primary w-full py-3">
              লগইন পাতায় যান
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form ───────────────────────────────────────── */
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f0f2ff' }}>
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl p-7 shadow-xl shadow-brand-600/10" style={{ border: '1.5px solid #e8e4f8' }}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)' }}>
              <KeyRound size={22} className="text-brand-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">পাসওয়ার্ড ভুলে গেছেন?</h1>
              <p className="text-xs text-gray-400 mt-0.5">ফোন নম্বর ও মেস কোড দিয়ে রিসেট করুন</p>
            </div>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl mb-5 text-xs"
            style={{ background: '#faf9ff', border: '1px solid #ddd6fe' }}>
            <span className="text-brand-500 mt-0.5 shrink-0">ℹ️</span>
            <p className="text-gray-500 leading-relaxed">
              মেস জয়েন কোড অ্যাডমিনের কাছ থেকে নিন। এটি আপনার পরিচয় নিশ্চিত করতে ব্যবহার হয়।
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                ফোন নম্বর *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="form-input"
                placeholder="01XXXXXXXXX"
                required
              />
            </div>

            {/* Join code */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                মেস জয়েন কোড *
              </label>
              <input
                value={form.joinCode}
                onChange={(e) => setForm({ ...form, joinCode: e.target.value.toUpperCase() })}
                className="form-input tracking-widest font-bold text-center text-brand-700 placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-300"
                placeholder="XXXXXX"
                maxLength={8}
                required
              />
            </div>

            {/* New password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                নতুন পাসওয়ার্ড *
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  className="form-input pr-12"
                  placeholder="কমপক্ষে ৪ অক্ষর"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-brand-600 transition-colors">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                পাসওয়ার্ড নিশ্চিত করুন *
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPass}
                  onChange={(e) => setForm({ ...form, confirmPass: e.target.value })}
                  className={`form-input pr-12 ${
                    form.confirmPass && form.confirmPass !== form.newPassword
                      ? 'border-red-300 focus:border-red-400'
                      : form.confirmPass && form.confirmPass === form.newPassword
                      ? 'border-emerald-400 focus:border-emerald-500'
                      : ''
                  }`}
                  placeholder="পুনরায় লিখুন"
                  required
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-brand-600 transition-colors">
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {form.confirmPass && form.confirmPass !== form.newPassword && (
                <p className="text-xs text-red-500 mt-1">পাসওয়ার্ড দুটো মিলছে না</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  পরিবর্তন হচ্ছে...
                </span>
              ) : 'পাসওয়ার্ড পরিবর্তন করুন'}
            </button>
          </form>

          {/* Back to login */}
          <Link to="/login"
            className="mt-5 flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-brand-600 transition-colors">
            <ArrowLeft size={15} />
            লগইন পাতায় ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
