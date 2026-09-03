import React, { useState } from 'react';
import { Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ForcePasswordChange() {
  const { authHeader } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (next.length < 4) {
      setError('New password must be at least 4 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? 'Failed to change password');
      }
      setSuccess(true);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#dc2626 1px, transparent 1px), linear-gradient(90deg, #dc2626 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="relative w-full max-w-sm space-y-8">
        <div className="flex items-center gap-3 justify-center">
          <div className="bg-red-600 text-black font-black text-sm px-3 py-1.5 rounded shadow-lg shadow-red-600/20">FORCE PASSWORD CHANGE</div>
        </div>
        <div className="bg-stone-950 border border-stone-800 rounded-xl p-8 shadow-2xl space-y-6">
          <div>
            <h2 className="text-lg font-black tracking-tight text-stone-100">Set a new password</h2>
            <p className="text-stone-500 text-xs tracking-wider mt-1">You must change the default password before continuing.</p>
          </div>
          {error && (
            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <AlertTriangle size={14} className="text-red-400 shrink-0" />
              <p className="text-red-400 text-xs font-bold">{error}</p>
            </div>
          )}
          {success ? (
            <div className="flex items-center gap-2.5 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <ShieldCheck size={14} className="text-green-400 shrink-0" />
              <p className="text-green-400 text-xs font-bold">Password updated. Reloading...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Current Password *</label>
                <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="w-full bg-black border border-stone-800 rounded-lg px-4 py-3 text-sm text-stone-100 focus:outline-none focus:border-red-600 placeholder-stone-700" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">New Password *</label>
                <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="w-full bg-black border border-stone-800 rounded-lg px-4 py-3 text-sm text-stone-100 focus:outline-none focus:border-red-600 placeholder-stone-700" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Confirm New Password *</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full bg-black border border-stone-800 rounded-lg px-4 py-3 text-sm text-stone-100 focus:outline-none focus:border-red-600 placeholder-stone-700" />
              </div>
              <button type="submit" disabled={loading || !current || !next || !confirm} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-3.5 rounded-lg text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
