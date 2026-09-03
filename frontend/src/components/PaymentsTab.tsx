import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Loader2, AlertTriangle, CheckCircle2,
  Plus, Pencil, Trash2, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Payment {
  id: string;
  customerId: string;
  customerName?: string;
  amount: number;
  method: string | null;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  note: string | null;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
}

interface FormState {
  customerId: string;
  amount: string;
  method: string;
  note: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
}

const EMPTY_FORM: FormState = { customerId: '', amount: '', method: '', note: '', status: 'pending' };

export default function PaymentsTab() {
  const { authHeader } = useAuth();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [paymentsRes, customersRes] = await Promise.all([
        fetch('/api/payments', { headers: authHeader() }),
        fetch('/api/customers', { headers: authHeader() }),
      ]);
      if (!paymentsRes.ok) throw new Error('Failed to load payments');
      if (!customersRes.ok) throw new Error('Failed to load customers');
      setPayments(await paymentsRes.json());
      const custList = await customersRes.json() as Customer[];
      setCustomers(custList);
    } catch {
      setLoadError('Could not load payment data.');
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name ?? 'Unknown';

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const openEdit = (p: Payment) => {
    setEditing(p);
    setShowForm(true);
    setForm({
      customerId: p.customerId,
      amount: String(p.amount),
      method: p.method ?? '',
      note: p.note ?? '',
      status: p.status,
    });
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setSaveError('Enter a valid amount.');
      setSaving(false);
      return;
    }

    try {
      const body = {
        customerId: form.customerId,
        amount,
        method: form.method || null,
        note: form.note || null,
      };

      if (editing) {
        const res = await fetch(`/api/payments/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify({ status: form.status }),
        });
        if (!res.ok) throw new Error('Update failed');
        setSaveSuccess('Payment updated.');
      } else {
        const res = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message ?? 'Create failed');
        }
        setSaveSuccess('Payment recorded.');
        setForm(EMPTY_FORM);
      }

      setShowForm(false);
      setEditing(null);
      fetchAll();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Payment) => {
    if (!confirm(`Delete payment record ${p.id.slice(0, 8)}? This cannot be undone.`)) return;
    setDeleting(p.id);
    try {
      const res = await fetch(`/api/payments/${p.id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('Delete failed');
      setPayments((prev) => prev.filter((x) => x.id !== p.id));
    } catch {
      setLoadError('Delete failed. Try again.');
    } finally {
      setDeleting(null);
    }
  };

  const currencyFmt = (v: number) => v.toLocaleString('en-EG') + ' EGP';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-stone-100">Payments</h1>
          <p className="text-stone-500 text-xs tracking-wider uppercase mt-1">Record and review membership payments.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-black font-black px-5 py-2.5 rounded text-xs tracking-widest uppercase transition-all">
          <Plus size={14} /> Record Payment
        </button>
      </header>

      {saveSuccess && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded p-4">
          <CheckCircle2 size={16} className="text-green-400 shrink-0" />
          <p className="text-green-400 text-xs font-bold">{saveSuccess}</p>
        </div>
      )}

      {loadError && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded p-3">
          <AlertTriangle size={14} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-[10px] font-bold">{loadError}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-stone-600">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-xs uppercase tracking-widest">Loading...</span>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-20 text-stone-700">
          <DollarSign className="mx-auto mb-3 text-stone-800" size={36} />
          <p className="text-xs uppercase tracking-widest font-bold">No payments recorded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-center gap-4">
              <div className="shrink-0 w-10 h-10 rounded bg-black border border-stone-800 flex items-center justify-center">
                <DollarSign size={16} className="text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-stone-100 truncate">{getCustomerName(p.customerId)}</h3>
                  <span className={`text-[10px] tracking-widest px-2 py-0.5 rounded font-black uppercase border ${
                    p.status === 'paid' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                    p.status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                    p.status === 'refunded' ? 'bg-stone-800 border-stone-700 text-stone-400' :
                    'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>{p.status}</span>
                </div>
                <p className="text-[10px] text-stone-500 font-mono mt-0.5">{new Date(p.createdAt).toLocaleString('en-GB')} {p.method ? `· ${p.method}` : ''}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-base font-black text-stone-200">{currencyFmt(p.amount)}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => openEdit(p)} className="p-2 rounded text-stone-500 hover:text-stone-200 hover:bg-stone-800 transition-colors" title="Update status"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(p)} disabled={deleting === p.id} className="p-2 rounded text-stone-500 hover:text-red-400 hover:bg-stone-800 transition-colors disabled:opacity-40" title="Delete">
                  {deleting === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => { setEditing(null); setShowForm(false); setForm(EMPTY_FORM); }}>
          <div className="bg-stone-950 border border-stone-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-red-500">{editing ? 'Update Payment' : 'Record Payment'}</h2>
              <button onClick={() => { setEditing(null); setShowForm(false); setForm(EMPTY_FORM); setSaveError(null); setSaveSuccess(null); }} className="text-stone-500 hover:text-stone-200"><X size={16} /></button>
            </div>

            {saveError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded p-3">
                <AlertTriangle size={14} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-[10px] font-bold">{saveError}</p>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3">
              {!editing && (
                <div>
                  <label className="block text-[10px] font-bold mb-1 uppercase tracking-widest text-stone-400">Member *</label>
                  <select value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))} required className="w-full bg-black border border-stone-800 rounded px-3 py-2.5 text-xs tracking-wider text-stone-300 focus:outline-none focus:border-red-600">
                    <option value="">Select member...</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {!editing && (
                <div>
                  <label className="block text-[10px] font-bold mb-1 uppercase tracking-widest text-stone-400">Amount (EGP) *</label>
                  <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required className="w-full bg-black border border-stone-800 rounded px-3 py-2.5 text-xs tracking-wider text-stone-200 focus:outline-none focus:border-red-600" />
                </div>
              )}
              {!editing && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 uppercase tracking-widest text-stone-400">Method</label>
                    <input type="text" value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))} placeholder="Cash / Card / Transfer" className="w-full bg-black border border-stone-800 rounded px-3 py-2.5 text-xs tracking-wider text-stone-200 focus:outline-none focus:border-red-600" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1 uppercase tracking-widest text-stone-400">Note</label>
                    <input type="text" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className="w-full bg-black border border-stone-800 rounded px-3 py-2.5 text-xs tracking-wider text-stone-200 focus:outline-none focus:border-red-600" />
                  </div>
                </>
              )}
              {editing && (
                <div>
                  <label className="block text-[10px] font-bold mb-1 uppercase tracking-widest text-stone-400">Status</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FormState['status'] }))} className="w-full bg-black border border-stone-800 rounded px-3 py-2.5 text-xs tracking-wider text-stone-300 focus:outline-none focus:border-red-600">
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setEditing(null); setShowForm(false); setForm(EMPTY_FORM); setSaveError(null); setSaveSuccess(null); }} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-200 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-black font-black px-5 py-2 rounded text-xs tracking-widest uppercase transition-all flex items-center gap-2">
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  {saving ? 'Saving...' : editing ? 'Save' : 'Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
