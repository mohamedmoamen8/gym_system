import React, { useState } from 'react';
import { Loader2, AlertTriangle, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGymSettings } from '../context/GymSettingsContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { settings } = useGymSettings();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setError(null);

    try {
      await login(username.trim(), password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4">
      {/* Background grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#dc2626 1px, transparent 1px), linear-gradient(90deg, #dc2626 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-xl shadow-2xl shadow-red-600/30 mx-auto">
            {settings.logo ? (
              <img
                src={settings.logo}
                alt="Logo"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Zap size={32} className="text-black" fill="currentColor" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase text-white">
              {settings.name}
            </h1>
            <p className="text-stone-500 text-xs tracking-widest uppercase mt-1">
              Owner Portal
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-stone-950 border border-stone-800 rounded-xl p-8 shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                placeholder="owner"
                autoComplete="username"
                autoFocus
                disabled={loading}
                className="w-full bg-black border border-stone-800 rounded-lg px-4 py-3 text-sm text-stone-100 focus:outline-none focus:border-red-600 placeholder-stone-700 transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
                className="w-full bg-black border border-stone-800 rounded-lg px-4 py-3 text-sm text-stone-100 focus:outline-none focus:border-red-600 placeholder-stone-700 transition-colors disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertTriangle size={14} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-xs font-bold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-3.5 rounded-lg text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-stone-700 text-[10px] tracking-wider">
            Default credentials: <span className="text-stone-500 font-mono">owner / gym1234</span>
          </p>
        </div>
      </div>
    </div>
  );
}
