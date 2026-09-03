import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Loader2, AlertTriangle, CheckCircle2,
  Pencil, Trash2, X, UserPlus, ShieldCheck, ShieldOff, ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  barcodeCode: string;
  membershipTier: string | null;
  subscriptionEndDate: string | null;
  photoPath: string | null;
  status: 'Active' | 'Suspended' | 'Expired';
  effectiveStatus: 'Active' | 'Suspended' | 'Expired';
  accessAllowed: boolean;
}

interface FormState {
  name: string;
  phoneNumber: string;
  barcodeCode: string;
  membershipTier: string;
  subscriptionEndDate: string;
  status: 'Active' | 'Suspended' | 'Expired';
}

const EMPTY_FORM: FormState = {
  name: '',
  phoneNumber: '',
  barcodeCode: '',
  membershipTier: '',
  subscriptionEndDate: '',
  status: 'Active',
};

export default function MembersListTab() {
  const { authHeader } = useAuth();

  const [members, setMembers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [editing, setEditing] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}&status=${encodeURIComponent(statusFilter)}`, {
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('Failed to load members');
      setMembers(await res.json());
    } catch {
      setLoadError('Could not load members.');
    } finally {
      setLoading(false);
    }
  }, [q, statusFilter, authHeader]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, barcodeCode: '' });
    setShowForm(true);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const openEdit = (m: Customer) => {
    setEditing(m);
    setShowForm(true);
    setForm({
      name: m.name,
      phoneNumber: m.phoneNumber,
      barcodeCode: m.barcodeCode,
      membershipTier: m.membershipTier ?? '',
      subscriptionEndDate: m.subscriptionEndDate ? m.subscriptionEndDate.slice(0, 10) : '',
      status: m.effectiveStatus === 'Suspended' ? 'Suspended' : m.effectiveStatus === 'Expired' ? 'Expired' : 'Active',
    });
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const body = {
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
        membershipTier: form.membershipTier.trim() || undefined,
        subscriptionEndDate: form.subscriptionEndDate || undefined,
        status: form.status,
      };

      if (editing) {
        const res = await fetch(`/api/customers/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message ?? 'Update failed');
        }
        setSaveSuccess('Member updated.');
        setShowForm(false);
        setEditing(null);
      } else {
        const formData = new FormData();
        formData.append('name', body.name);
        formData.append('phoneNumber', body.phoneNumber);
        if (body.membershipTier) formData.append('membershipTier', body.membershipTier);
        if (body.subscriptionEndDate) formData.append('subscriptionEndDate', body.subscriptionEndDate);
        formData.append('status', body.status);

        const res = await fetch('/api/customers/register', {
          method: 'POST',
          headers: authHeader(),
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message ?? 'Registration failed');
        }
        setSaveSuccess('Member registered.');
        setForm(EMPTY_FORM);
        setShowForm(false);
        setEditing(null);
      }

      fetchMembers();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: Customer) => {
    if (!confirm(`Remove member "${m.name}" (${m.barcodeCode})? This cannot be undone.`)) return;
    setDeleting(m.id);
    try {
      const res = await fetch(`/api/customers/${m.id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('Delete failed');
      setMembers((prev) => prev.filter((x) => x.id !== m.id));
    } catch {
      setLoadError('Delete failed. Try again.');
    } finally {
      setDeleting(null);
    }
  };

  const badge = (s: Customer['effectiveStatus']) => {
    const cfg = {
      Active:    { cls: 'bg-green-500/10 border-green-500/20 text-green-400', icon: <ShieldCheck size={12} /> },
      Suspended: { cls: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400', icon: <ShieldAlert size={12} /> },
      Expired:   { cls: 'bg-red-500/10 border-red-500/20 text-red-400', icon: <ShieldOff size={12} /> },
    }[s];
    return (
      <span className={`inline-flex items-center gap-1.5 border text-[10px] tracking-widest px-2 py-1 rounded font-black uppercase ${cfg.cls}`}>
        {cfg.icon} {s}
        {s === 'Active' && !true ? '' : ''}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-stone-100">Members</h1>
          <p className="text-stone-500 text-xs tracking-wider uppercase mt-1">Manage memberships and member access.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-black font-black px-5 py-2.5 rounded text-xs tracking-widest uppercase transition-all"
        >
          <UserPlus size={14} /> New Member
        </button>
      </header>

      {saveSuccess && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded p-4">
          <CheckCircle2 size={16} className="text-green-400 shrink-0" />
          <p className="text-green-400 text-xs font-bold">{saveSuccess}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-3 text-stone-600" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, phone, barcode, plan..."
            className="w-full bg-black border border-stone-800 rounded pl-9 pr-4 py-2.5 text-xs tracking-wider text-stone-200 focus:outline-none focus:border-red-600 placeholder-stone-700"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-black border border-stone-800 rounded px-3 py-2.5 text-xs tracking-wider text-stone-300 focus:outline-none focus:border-red-600"
        >
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded p-3">
          <AlertTriangle size={14} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-[10px] font-bold">{loadError}</p>
        </div>
      )}

      {/* Member cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-stone-600">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-xs uppercase tracking-widest">Loading...</span>
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 text-stone-700">
          <p className="text-xs uppercase tracking-widest font-bold">No members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {members.map((m) => (
            <div key={m.id} className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex gap-4">
              <div className="shrink-0">
                {m.photoPath ? (
                  <img src={`/uploads/${m.photoPath}`} alt={m.name} className="w-16 h-16 object-cover rounded-lg border border-stone-700" />
                ) : (
                  <div className="w-16 h-16 rounded-lg border border-stone-700 bg-stone-800 flex items-center justify-center text-stone-600 font-black text-xs">NO PHOTO</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-stone-100 truncate">{m.name}</h3>
                  {badge(m.effectiveStatus)}
                </div>
                <p className="text-[10px] text-stone-500 font-mono mb-1">{m.phoneNumber} · {m.barcodeCode}</p>
                <p className="text-[10px] text-stone-500 uppercase tracking-wider">
                  {m.membershipTier ?? 'No plan'}
                  {m.subscriptionEndDate ? ` · Expires ${new Date(m.subscriptionEndDate).toLocaleDateString('en-GB')}` : ''}
                </p>
                {!m.accessAllowed && (
                  <p className="text-[10px] text-red-400 uppercase tracking-wider font-bold mt-1">Access denied</p>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => openEdit(m)} className="p-2 rounded text-stone-500 hover:text-stone-200 hover:bg-stone-800 transition-colors" title="Edit">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(m)} disabled={deleting === m.id} className="p-2 rounded text-stone-500 hover:text-red-400 hover:bg-stone-800 transition-colors disabled:opacity-40" title="Delete">
                  {deleting === m.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => { setEditing(null); setShowForm(false); setForm(EMPTY_FORM); }}>
          <div className="bg-stone-950 border border-stone-800 rounded-xl p-6 w-full max-w-lg space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-red-500">{editing ? 'Edit Member' : 'New Member'}</h2>
              <button onClick={() => { setEditing(null); setShowForm(false); setForm(EMPTY_FORM); setSaveError(null); setSaveSuccess(null); }} className="text-stone-500 hover:text-stone-200"><X size={16} /></button>
            </div>

            {saveError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded p-3">
                <AlertTriangle size={14} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-[10px] font-bold">{saveError}</p>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold mb-1 uppercase tracking-widest text-stone-400">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full bg-black border border-stone-800 rounded px-3 py-2.5 text-xs tracking-wider text-stone-200 focus:outline-none focus:border-red-600" />
              </div>
              <div>
                <label className="block text-[10px] font-bold mb-1 uppercase tracking-widest text-stone-400">Phone *</label>
                <input type="tel" value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} className="w-full bg-black border border-stone-800 rounded px-3 py-2.5 text-xs tracking-wider text-stone-200 focus:outline-none focus:border-red-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold mb-1 uppercase tracking-widest text-stone-400">Barcode</label>
                  <input type="text" value={form.barcodeCode} disabled={!!editing} onChange={(e) => setForm((f) => ({ ...f, barcodeCode: e.target.value }))} className={`w-full bg-black border border-stone-800 rounded px-3 py-2.5 text-xs tracking-wider text-stone-200 focus:outline-none ${editing ? 'opacity-50' : 'focus:border-red-600'}`} />
                  {!editing && <p className="text-[10px] text-stone-600 mt-1">Leave blank to auto-assign.</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 uppercase tracking-widest text-stone-400">Expiry Date</label>
                  <input type="date" value={form.subscriptionEndDate} onChange={(e) => setForm((f) => ({ ...f, subscriptionEndDate: e.target.value }))} className="w-full bg-black border border-stone-800 rounded px-3 py-2.5 text-xs tracking-wider text-stone-300 focus:outline-none focus:border-red-600" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold mb-1 uppercase tracking-widest text-stone-400">Membership Tier</label>
                <input type="text" value={form.membershipTier} onChange={(e) => setForm((f) => ({ ...f, membershipTier: e.target.value }))} placeholder="e.g. Monthly Basic" className="w-full bg-black border border-stone-800 rounded px-3 py-2.5 text-xs tracking-wider text-stone-200 focus:outline-none focus:border-red-600" />
              </div>
              <div>
                <label className="block text-[10px] font-bold mb-1 uppercase tracking-widest text-stone-400">Status</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FormState['status'] }))} className="w-full bg-black border border-stone-800 rounded px-3 py-2.5 text-xs tracking-wider text-stone-300 focus:outline-none focus:border-red-600">
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setEditing(null); setShowForm(false); setForm(EMPTY_FORM); setSaveError(null); setSaveSuccess(null); }} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-200 transition-colors">Cancel</button>
                <button type="submit" disabled={saving || !form.name.trim() || !form.phoneNumber.trim()} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-black font-black px-5 py-2 rounded text-xs tracking-widest uppercase transition-all flex items-center gap-2">
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
