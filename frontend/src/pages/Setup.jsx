import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Utensils, Eye, EyeOff, CheckCircle } from 'lucide-react';

export function Setup() {
  const { setup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    messName: '',
    adminName: '',
    adminPhone: '',
    adminPassword: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.adminPassword !== form.confirmPassword) {
      setError('পাসওয়ার্ড মিলছে না');
      return;
    }
    if (form.adminPassword.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    setLoading(true);
    try {
      const result = await setup({
        messName: form.messName,
        adminName: form.adminName,
        adminPhone: form.adminPhone,
        adminPassword: form.adminPassword,
      });
      setJoinCode(result.mess.joinCode);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'সেটআপ ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute top-[-10rem] right-[-10rem] w-[40rem] h-[40rem] bg-green-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="glass-panel rounded-2xl p-10 w-full max-w-md relative z-10 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-green-500/20 rounded-full">
              <CheckCircle size={36} className="text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">সেটআপ সম্পন্ন!</h2>
          <p className="text-slate-400 mb-8">আপনার মেস তৈরি হয়েছে। সদস্যদের নিচের কোডটি দিন।</p>

          <div className="bg-brand-600/10 border border-brand-500/30 rounded-2xl p-6 mb-8">
            <p className="text-slate-400 text-sm mb-2">মেসে যোগ দেওয়ার কোড</p>
            <p className="text-4xl font-bold tracking-[0.3em] text-brand-300">{joinCode}</p>
            <p className="text-slate-500 text-xs mt-3">এই কোডটি ড্যাশবোর্ড থেকেও দেখা যাবে</p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl transition-all"
          >
            ড্যাশবোর্ডে যান
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-10">
      <div className="absolute top-[-10rem] right-[-10rem] w-[40rem] h-[40rem] bg-brand-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10rem] left-[-10rem] w-[40rem] h-[40rem] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-panel rounded-2xl p-10 w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-brand-600/20 rounded-xl mb-4">
            <Utensils size={32} className="text-brand-300" />
          </div>
          <h1 className="text-2xl font-bold text-white">মেস সেটআপ</h1>
          <p className="text-slate-400 text-sm mt-1 text-center">প্রথমবার সেটআপ করুন</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 mb-5 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">মেসের নাম *</label>
            <input
              value={form.messName}
              onChange={(e) => setForm({ ...form, messName: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:bg-white/10 transition-all"
              placeholder="যেমন: STA হোস্টেল মেস"
              required
            />
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">অ্যাডমিন তথ্য</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">আপনার নাম *</label>
                <input
                  value={form.adminName}
                  onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:bg-white/10 transition-all"
                  placeholder="পূর্ণ নাম"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">ফোন নম্বর *</label>
                <input
                  type="tel"
                  value={form.adminPhone}
                  onChange={(e) => setForm({ ...form, adminPhone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:bg-white/10 transition-all"
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">পাসওয়ার্ড *</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.adminPassword}
                    onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:bg-white/10 transition-all"
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">পাসওয়ার্ড নিশ্চিত করুন *</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:bg-white/10 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-brand-600/20 mt-2"
          >
            {loading ? 'সেটআপ হচ্ছে...' : 'মেস তৈরি করুন'}
          </button>
        </form>
      </div>
    </div>
  );
}
