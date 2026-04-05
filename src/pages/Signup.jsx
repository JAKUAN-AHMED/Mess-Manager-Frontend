import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Utensils, Eye, EyeOff, ShieldCheck, Users, Hash, CheckCircle, Copy } from 'lucide-react';
import api from '../services/api';

function ManagerForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', password: '', confirmPassword: '', messName: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null); // { joinCode, messName }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('পাসওয়ার্ড মিলছে না');
    if (form.password.length < 6) return setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
    setLoading(true);
    try {
      const res = await api.post('/auth/register-manager', {
        name: form.name,
        phone: form.phone,
        password: form.password,
        messName: form.messName,
      });
      const { token, ...userData } = res.data.data.user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setDone({ joinCode: res.data.data.mess.joinCode, messName: res.data.data.mess.name });
    } catch (err) {
      setError(err.response?.data?.error || 'নিবন্ধন ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-green-500/20 rounded-full">
            <CheckCircle size={36} className="text-green-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-1">অ্যাকাউন্ট তৈরি হয়েছে!</h2>
        <p className="text-slate-400 text-sm mb-6">আপনার মেস "{done.messName}" তৈরি হয়েছে</p>

        <div className="bg-brand-600/10 border border-brand-500/30 rounded-2xl p-5 mb-6">
          <p className="text-slate-400 text-xs mb-2">সদস্যদের এই কোডটি দিন</p>
          <p className="text-4xl font-bold tracking-[0.3em] text-brand-300 mb-3">{done.joinCode}</p>
          <button
            onClick={() => { navigator.clipboard.writeText(done.joinCode); }}
            className="flex items-center gap-2 mx-auto text-xs text-slate-400 hover:text-white transition-colors"
          >
            <Copy size={13} /> কপি করুন
          </button>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl transition-all"
        >
          ড্যাশবোর্ডে যান
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm text-slate-400 mb-1.5">মেসের নাম *</label>
        <input value={form.messName} onChange={set('messName')}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-all"
          placeholder="যেমন: STA হোস্টেল মেস" required />
      </div>

      <div className="border-t border-white/10 pt-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">আপনার তথ্য</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">আপনার নাম *</label>
            <input value={form.name} onChange={set('name')}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-all"
              placeholder="পূর্ণ নাম" required />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">ফোন নম্বর *</label>
            <input type="tel" value={form.phone} onChange={set('phone')}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-all"
              placeholder="01XXXXXXXXX" required />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">পাসওয়ার্ড *</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-all"
                placeholder="কমপক্ষে ৬ অক্ষর" required />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">পাসওয়ার্ড নিশ্চিত করুন *</label>
            <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-all"
              placeholder="••••••••" required />
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-brand-600/20 mt-2">
        {loading ? 'তৈরি হচ্ছে...' : 'মেস তৈরি করুন'}
      </button>
    </form>
  );
}

function MemberForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ joinCode: '', name: '', phone: '', password: '', confirmPassword: '', roomNumber: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('পাসওয়ার্ড মিলছে না');
    if (form.password.length < 6) return setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', {
        name: form.name,
        phone: form.phone,
        password: form.password,
        joinCode: form.joinCode.trim(),
        roomNumber: form.roomNumber,
      });
      const { token, ...userData } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'নিবন্ধন ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Join code — prominent */}
      <div className="bg-brand-600/10 border border-brand-500/30 rounded-xl p-4">
        <label className="flex items-center gap-2 text-sm text-brand-300 mb-2 font-medium">
          <Hash size={15} /> মেস জয়েন কোড *
        </label>
        <input value={form.joinCode} onChange={(e) => setForm((f) => ({ ...f, joinCode: e.target.value.toUpperCase() }))}
          className="w-full bg-white/5 border border-brand-500/30 rounded-xl px-4 py-3 text-white text-center text-xl font-bold tracking-[0.3em] uppercase placeholder-slate-600 focus:outline-none focus:border-brand-400 transition-all"
          placeholder="XXXXXX" maxLength={6} required />
        <p className="text-xs text-slate-500 mt-2 text-center">ম্যানেজারের কাছ থেকে এই কোড নিন</p>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1.5">আপনার নাম *</label>
        <input value={form.name} onChange={set('name')}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-all"
          placeholder="পূর্ণ নাম" required />
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1.5">ফোন নম্বর *</label>
        <input type="tel" value={form.phone} onChange={set('phone')}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-all"
          placeholder="01XXXXXXXXX" required />
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1.5">রুম নম্বর (ঐচ্ছিক)</label>
        <input value={form.roomNumber} onChange={set('roomNumber')}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-all"
          placeholder="যেমন: ২০৪" />
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1.5">পাসওয়ার্ড *</label>
        <div className="relative">
          <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-all"
            placeholder="কমপক্ষে ৬ অক্ষর" required />
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1.5">পাসওয়ার্ড নিশ্চিত করুন *</label>
        <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-all"
          placeholder="••••••••" required />
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-brand-600/20 mt-2">
        {loading ? 'যোগ দেওয়া হচ্ছে...' : 'মেসে যোগ দিন'}
      </button>
    </form>
  );
}

export function Signup() {
  const [mode, setMode] = useState('member'); // 'manager' | 'member'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-10">
      <div className="absolute top-[-10rem] right-[-10rem] w-[40rem] h-[40rem] bg-brand-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10rem] left-[-10rem] w-[40rem] h-[40rem] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-panel rounded-2xl p-8 w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-brand-600/20 rounded-xl mb-3">
            <Utensils size={28} className="text-brand-300" />
          </div>
          <h1 className="text-xl font-bold text-white">মেস হিসাব</h1>
        </div>

        {/* Role selector tabs */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-6 border border-white/10">
          <button
            onClick={() => setMode('manager')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'manager'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={16} />
            ম্যানেজার
          </button>
          <button
            onClick={() => setMode('member')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'member'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users size={16} />
            সদস্য
          </button>
        </div>

        {/* Description */}
        <p className="text-slate-500 text-xs text-center mb-5">
          {mode === 'manager'
            ? 'নতুন মেস তৈরি করুন এবং জয়েন কোড পান'
            : 'ম্যানেজারের কাছ থেকে কোড নিয়ে মেসে যোগ দিন'}
        </p>

        {mode === 'manager' ? <ManagerForm /> : <MemberForm />}

        <p className="text-center text-sm text-slate-500 mt-6">
          ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            লগইন করুন
          </Link>
        </p>
      </div>
    </div>
  );
}
