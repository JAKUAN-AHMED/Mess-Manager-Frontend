import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Utensils, TrendingUp, Users, Copy, RefreshCw, Wallet, ChefHat, Sparkles, Sun, Moon, Cloud } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MONTHS_BN_SHORT = ['জানু','ফেব','মার','এপ্র','মে','জুন','জুলা','আগ','সেপ','অক্টো','নভে','ডিস'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-modal rounded-xl px-4 py-3 text-sm shadow-xl">
        <p className="text-gray-400 mb-1 text-xs">{label}</p>
        <p className="text-gray-900 font-bold">{payload[0].value} টি মিল</p>
      </div>
    );
  }
  return null;
};

const StatCard = ({ label, value, icon: Icon, cardClass, iconColor, iconBg }) => (
  <div className={`glass-panel ${cardClass} p-4 sm:p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300`}>
    {/* Hover glow */}
    <div className="absolute -right-12 -top-12 w-28 h-28 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-500"
      style={{ background: `radial-gradient(circle, ${iconColor} 0%, transparent 70%)` }} />
    <div className="relative flex justify-between items-start gap-2">
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 sm:mb-2 truncate">{label}</p>
        <h3 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight truncate">{value}</h3>
      </div>
      <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300"
        style={{ background: iconBg, boxShadow: `0 6px 16px ${iconColor}30` }}>
        <Icon size={18} style={{ color: iconColor }} className="sm:hidden" />
        <Icon size={22} style={{ color: iconColor }} className="hidden sm:block" />
      </div>
    </div>
  </div>
);

export function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const now = new Date();
  const [summary, setSummary]       = useState(null);
  const [trend, setTrend]           = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [mess, setMess]             = useState(null);
  const [copied, setCopied]         = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, trendRes, membersRes, messRes] = await Promise.all([
          api.get(`/reports/monthly-summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`),
          api.get('/reports/yearly-trend'),
          api.get('/users'),
          api.get('/mess'),
        ]);
        setSummary(summaryRes.data.data);
        setTrend(trendRes.data.data.map((d) => ({ name: MONTHS_BN_SHORT[d.month - 1], meals: d.totalMeals })));
        setMemberCount(membersRes.data.data.filter((m) => m.isActive).length);
        setMess(messRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const dateStr = now.toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const hour = now.getHours();
  const greeting = hour < 5
    ? { text: 'শুভ রাত্রি', Icon: Moon, color: '#4338ca' }
    : hour < 12
    ? { text: 'শুভ সকাল', Icon: Sun, color: '#f59e0b' }
    : hour < 17
    ? { text: 'শুভ দুপুর', Icon: Sun, color: '#ea580c' }
    : hour < 20
    ? { text: 'শুভ সন্ধ্যা', Icon: Cloud, color: '#7c3aed' }
    : { text: 'শুভ রাত্রি', Icon: Moon, color: '#4338ca' };
  const GIcon = greeting.Icon;

  const handleCopy = () => {
    if (!mess?.joinCode) return;
    navigator.clipboard.writeText(mess.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!confirm('নতুন কোড তৈরি করলে পুরনো কোড আর কাজ করবে না। নিশ্চিত?')) return;
    setRegenerating(true);
    try {
      const res = await api.post('/mess/regenerate-code');
      setMess((prev) => ({ ...prev, joinCode: res.data.data.joinCode }));
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Welcome header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 40%, #e0e7ff 70%, #fef3c7 100%)', border: '1.5px solid #ddd6fe' }}>
        {/* Decorative blobs */}
        <div className="absolute -right-12 -top-12 w-72 h-72 rounded-full opacity-25" style={{
          background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
        }} />
        <div className="absolute -left-16 -bottom-20 w-72 h-72 rounded-full opacity-15" style={{
          background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)',
        }} />
        <div className="absolute right-1/3 top-1/2 w-32 h-32 rounded-full opacity-10" style={{
          background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)',
        }} />

        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}>
                <ChefHat size={14} className="text-white" />
              </div>
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em]">ড্যাশবোর্ড</span>
              <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                style={{ background: greeting.color + '15', borderColor: greeting.color + '40', color: greeting.color }}>
                <GIcon size={9} /> {greeting.text}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              স্বাগতম, <span className="text-gradient">{user?.name || 'ম্যানেজার'}</span>!
            </h1>
            <p className="text-gray-600 mt-1.5 text-xs sm:text-sm flex items-center gap-1.5">
              <Sparkles size={12} className="text-brand-400" /> {dateStr}
            </p>
          </div>
          {/* Decorative emblem */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">এই মাসে</p>
              <p className="text-3xl font-black text-gradient leading-none mt-1">
                {loading ? '—' : (summary?.totalMealsCount || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">টি মিল হয়েছে</p>
            </div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border"
              style={{ background: 'rgba(255,255,255,0.7)', borderColor: '#fff', backdropFilter: 'blur(8px)' }}>
              <Utensils size={28} className="text-brand-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatCard
          label={t('dashboard.total_expenses')}
          value={loading ? '...' : `৳ ${(summary?.totalCost || 0).toLocaleString()}`}
          icon={Wallet}
          cardClass="stat-rose"
          iconColor="#e11d48"
          iconBg="#fee2e2"
        />
        <StatCard
          label={t('dashboard.meal_rate')}
          value={loading ? '...' : `৳ ${(summary?.mealRate || 0).toFixed(2)}`}
          icon={TrendingUp}
          cardClass="stat-violet"
          iconColor="#7c3aed"
          iconBg="#ede9fe"
        />
        <StatCard
          label={t('dashboard.total_meals')}
          value={loading ? '...' : `${summary?.totalMealsCount || 0} টি`}
          icon={Utensils}
          cardClass="stat-emerald"
          iconColor="#059669"
          iconBg="#dcfce7"
        />
        <StatCard
          label="সক্রিয় সদস্য"
          value={loading ? '...' : `${memberCount} জন`}
          icon={Users}
          cardClass="stat-cyan"
          iconColor="#0891b2"
          iconBg="#cffafe"
        />
      </div>

      {/* Join code — admin only */}
      {isAdmin && mess && (
        <div className="glass-panel p-6 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, #faf9ff, #f5f3ff)', border: '1.5px solid #ddd6fe' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">Join Code</p>
              <p className="text-gray-500 text-xs mb-3">সদস্যরা এই কোড দিয়ে সাইনআপ করতে পারবে</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black tracking-[0.3em] text-gray-900">{mess.joinCode}</span>
                <button onClick={handleCopy} title="কপি করুন"
                  className="p-2 hover:bg-brand-100 rounded-lg text-gray-400 hover:text-brand-600 transition-all">
                  <Copy size={18} />
                </button>
                {copied && <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-lg">কপি হয়েছে!</span>}
              </div>
            </div>
            <button onClick={handleRegenerate} disabled={regenerating}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-brand-300 hover:bg-brand-50 rounded-xl text-gray-600 hover:text-brand-700 text-sm font-medium transition-all disabled:opacity-50 shrink-0 shadow-sm">
              <RefreshCw size={15} className={regenerating ? 'animate-spin' : ''} />
              নতুন কোড তৈরি করুন
            </button>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="mb-6">
          <h2 className="text-base font-bold text-gray-900">মাসিক মিলের পরিসংখ্যান</h2>
          <p className="text-gray-400 text-xs mt-0.5">{now.getFullYear()} সালের মাসিক মিলের বাবহার</p>
        </div>
        {trend.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-gray-400">
            {loading ? (
              <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Utensils size={32} className="text-gray-300 mb-2" />
                <p className="text-sm">এখনো কোনো মিল ডেটা নেই</p>
              </>
            )}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="mealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="meals"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fill="url(#mealGrad)"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
