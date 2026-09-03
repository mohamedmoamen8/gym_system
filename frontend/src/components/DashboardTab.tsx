import { useState, useEffect, useCallback } from 'react';
import { Users, ShieldOff, QrCode, DollarSign, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';

interface MemberSummary {
  total: number;
  active: number;
  expired: number;
  suspended: number;
}

interface CheckinDaily {
  day: string;
  count: number;
}

interface RevenueMonthly {
  month: string;
  total: number;
}

interface MemberListItem {
  id: string;
  status: string;
  effectiveStatus: string;
  accessAllowed: boolean;
}

interface DashboardData {
  members: MemberSummary;
  todayCheckins: number;
  dailyCheckins: CheckinDaily[];
  revenue: { total: number };
  monthlyRevenue: RevenueMonthly[];
}

export default function DashboardTab() {
  const { authHeader } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, todayRes, dailyRes, revenueRes, monthlyRes] = await Promise.all([
        fetch('/api/customers', { headers: authHeader() }),
        fetch('/api/checkins/today', { headers: authHeader() }),
        fetch('/api/checkins/daily?days=7', { headers: authHeader() }),
        fetch('/api/payments/analytics/revenue', { headers: authHeader() }),
        fetch('/api/payments/analytics/monthly', { headers: authHeader() }),
      ]);

      const members: MemberListItem[] = await membersRes.json();
      const today: { count: number } = await todayRes.json();
      const daily: CheckinDaily[] = await dailyRes.json();
      const revenue: { total: number } = await revenueRes.json();
      const monthly: RevenueMonthly[] = await monthlyRes.json();

      setData({
        members: {
          total: members.length,
          active: members.filter((m) => m.accessAllowed).length,
          expired: members.filter((m) => m.effectiveStatus === 'Expired').length,
          suspended: members.filter((m) => m.effectiveStatus === 'Suspended').length,
        },
        todayCheckins: today.count,
        dailyCheckins: daily,
        revenue,
        monthlyRevenue: monthly,
      });
    } catch {
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-stone-600"><Loader2 size={20} className="animate-spin mr-2" /><span className="text-xs uppercase tracking-widest">Loading dashboard...</span></div>;
  }

  if (error) {
    return <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded p-3"><AlertTriangle size={14} className="text-red-400 shrink-0" /><p className="text-red-400 text-[10px] font-bold">{error}</p></div>;
  }

  const kpis = data ? [
    { label: 'Total Members', value: data.members.total, icon: <Users size={16} className="text-stone-400" />, accent: 'text-stone-200' },
    { label: 'Active', value: data.members.active, icon: <ShieldCheck size={16} className="text-green-400" />, accent: 'text-green-400' },
    { label: 'Expired', value: data.members.expired, icon: <ShieldOff size={16} className="text-red-400" />, accent: 'text-red-400' },
    { label: 'Checkins Today', value: data.todayCheckins, icon: <QrCode size={16} className="text-stone-400" />, accent: 'text-stone-200' },
    { label: 'Lifetime Revenue', value: Number(data.revenue.total ?? 0).toLocaleString('en-EG') + ' EGP', icon: <DollarSign size={16} className="text-yellow-400" />, accent: 'text-yellow-400' },
  ] : [];

  const fmtMoney = (v: number) => v.toLocaleString('en-EG') + ' EGP';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-stone-100">Dashboard</h1>
        <p className="text-stone-500 text-xs tracking-wider uppercase mt-1">Business overview and trends.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-500">
              {k.icon} {k.label}
            </div>
            <div className={`text-2xl font-black ${k.accent}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-red-500">Attendance (last 7 days)</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.dailyCheckins ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                <XAxis dataKey="day" tick={{ fill: '#78716c', fontSize: 10 }} axisLine={{ stroke: '#292524' }} tickLine={false} />
                <YAxis tick={{ fill: '#78716c', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#0c0a09', border: '1px solid #292524', borderRadius: '0.5rem' }}
                  labelStyle={{ color: '#d6d3d1', fontSize: 10 }}
                  itemStyle={{ color: '#ef4444', fontSize: 12 }}
                  cursor={{ fill: '#292524' }}
                />
                <Bar dataKey="count" fill="#dc2626" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-red-500">Revenue (last 6 months)</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlyRevenue ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                <XAxis dataKey="month" tick={{ fill: '#78716c', fontSize: 10 }} axisLine={{ stroke: '#292524' }} tickLine={false} />
                <YAxis tick={{ fill: '#78716c', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0c0a09', border: '1px solid #292524', borderRadius: '0.5rem' }}
                  labelStyle={{ color: '#d6d3d1', fontSize: 10 }}
                  formatter={(value: any) => [fmtMoney(Number(value)), 'Revenue']}
                  cursor={{ fill: '#292524' }}
                />
                <Bar dataKey="total" fill="#eab308" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}