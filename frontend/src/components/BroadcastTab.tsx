import React, { useState, useEffect } from 'react';
import { MessageSquare, Loader2, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  status: string;
}

interface BroadcastResult {
  sent: number;
  failed: number;
  skipped: number;
  gateway: 'openwa' | 'mock';
}

export default function BroadcastTab() {
  const { authHeader } = useAuth();

  const [message, setMessage] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/customers', { headers: authHeader() });
        if (!res.ok) throw new Error('Failed to load members');
        const data: Customer[] = await res.json();
        const active = data.filter((c) => c.status === 'Active');
        setCustomers(active);
        setSelected(new Set(active.map((c) => c.id)));
      } catch {
        setFetchError('Could not load member list.');
      } finally {
        setLoadingCustomers(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(customers.map((c) => c.id)));
  const clearAll  = () => setSelected(new Set());

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || selected.size === 0) return;

    setSending(true);
    setResult(null);
    setSendError(null);

    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          message: message.trim(),
          recipientIds: [...selected],
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSendError(body.message ?? 'Broadcast failed');
        return;
      }

      setResult(body as BroadcastResult);
      setMessage('');
    } catch {
      setSendError('Could not reach the server. Check your connection.');
    } finally {
      setSending(false);
    }
  };

  const recipientCount = selected.size;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-stone-100">
          Broadcast Message
        </h1>
        <p className="text-stone-500 text-xs tracking-wider uppercase mt-1">
          Send a WhatsApp message to selected active members.
        </p>
      </header>

      {result && (
        <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded p-4">
          <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-green-400 text-xs font-bold">
              Broadcast complete — {result.sent} sent
              {result.failed > 0 ? `, ${result.failed} failed` : ''}
              {result.skipped > 0 ? `, ${result.skipped} skipped` : ''}
            </p>
            {result.gateway === 'mock' && (
              <p className="text-stone-500 text-[10px]">
                Running in mock mode — no real messages were sent. Set{' '}
                <span className="font-mono text-stone-400">OPENWA_URL</span>,{' '}
                <span className="font-mono text-stone-400">OPENWA_API_KEY</span>, and{' '}
                <span className="font-mono text-stone-400">OPENWA_SESSION</span> in your .env to enable delivery.
              </p>
            )}
          </div>
        </div>
      )}

      {sendError && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded p-4">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-xs font-bold">{sendError}</p>
        </div>
      )}

      <form onSubmit={handleSend} className="bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-[10px] font-bold mb-2 uppercase tracking-widest text-stone-400">
            Message
          </label>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => { setMessage(e.target.value); setResult(null); }}
            className="w-full bg-black border border-stone-800 rounded p-4 text-xs tracking-wider text-stone-200 focus:outline-none focus:border-red-600 placeholder-stone-700 resize-none"
            placeholder="Type your announcement here..."
          />
          <p className="text-[10px] text-stone-600 mt-1 text-right">{message.length} chars</p>
        </div>

        <button
          type="submit"
          disabled={sending || !message.trim() || selected.size === 0}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-4 rounded text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
          {sending ? 'Sending...' : `Send to ${recipientCount} Member${recipientCount !== 1 ? 's' : ''}`}
        </button>
      </form>

      {/* Recipient selector */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-red-500" />
            <span className="text-xs font-black uppercase tracking-widest text-stone-300">Recipients</span>
            <span className="text-[10px] text-stone-500 font-mono">
              ({selected.size}/{customers.length})
            </span>
          </div>
          <div className="flex gap-3">
            <button onClick={selectAll} className="text-[10px] text-stone-400 hover:text-red-400 uppercase tracking-wider font-bold transition-colors">All</button>
            <button onClick={clearAll}  className="text-[10px] text-stone-400 hover:text-stone-200 uppercase tracking-wider font-bold transition-colors">None</button>
          </div>
        </div>

        {fetchError && <p className="text-red-400 text-[10px] font-bold">{fetchError}</p>}

        {loadingCustomers ? (
          <div className="flex items-center justify-center py-8 text-stone-600">
            <Loader2 size={16} className="animate-spin mr-2" />
            <span className="text-xs uppercase tracking-widest">Loading members...</span>
          </div>
        ) : customers.length === 0 ? (
          <p className="text-center text-stone-700 text-xs py-6 uppercase tracking-widest">
            No active members found
          </p>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {customers.map((c) => (
              <label
                key={c.id}
                className={`flex items-center gap-3 p-2.5 rounded border cursor-pointer transition-colors ${
                  selected.has(c.id)
                    ? 'border-red-600/30 bg-red-600/5'
                    : 'border-stone-800 hover:border-stone-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggleSelect(c.id)}
                  className="accent-red-600 w-3 h-3 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-stone-200 uppercase truncate">{c.name}</p>
                  <p className="text-[10px] text-stone-500 font-mono">{c.phoneNumber}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
