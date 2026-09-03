import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Loader2, AlertTriangle, CheckCircle2,
  Pencil, Trash2, X, UserPlus, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Captain {
  id: string;
  name: string;
  accessCode: string;
  photoPath: string | null;
  status: string;
}

interface FormState {
  name: string;
  accessCode: string;
  status: 'Active' | 'Inactive';
}

const EMPTY_FORM: FormState = { name: '', accessCode: '', status: 'Active' };

export default function StaffManagementTab() {
  const { authHeader } = useAuth();

  const [captains, setCaptains] = useState<Captain[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Captain | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchCaptains = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/staff', { headers: authHeader() });
      if (!res.ok) throw new Error('Failed to load staff');
      setCaptains(await res.json());
    } catch {
      setLoadError('Could not load staff list.');
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => { fetchCaptains(); }, [fetchCaptains]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, accessCode: '' });
    setShowForm(true);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const openEdit = (c: Captain) => {
    setEditing(c);
    setShowForm(true);
    setForm({
      name: c.name,
      accessCode: c.accessCode,
      status: c.status === 'Active' ? 'Active' : 'Inactive',
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
        accessCode: form.accessCode.trim(),
        status: form.status,
      };

      if (editing) {
        const res = await fetch(`/api/staff/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message ?? 'Update failed');
        }
        setSaveSuccess('Staff member updated.');
      } else {
        const formData = new FormData();
        formData.append('name', body.name);
        formData.append('accessCode', body.accessCode);

        const res = await fetch('/api/staff', {
          method: 'POST',
          headers: authHeader(),
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message ?? 'Create failed');
        }
        setSaveSuccess('Staff member created.');
        setForm(EMPTY_FORM);
      }

      setShowForm(false);
      setEditing(null);
      fetchCaptains();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Captain) => {
    if (!confirm(`Remove staff member "${c.name}"? This cannot be undone.`)) return;
    setDeleting(c.id);
    try {
      const res = await fetch(`/api/staff/${c.id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('Delete failed');
      setCaptains((prev) => prev.filter((x) => x.id !== c.id));
    } catch {
      setLoadError('Delete failed. Try again.');
    } finally {
      setDeleting(null);
    }
  };

  const toggleStatus = async (c: Captain) => {
    const next = c.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch(`/api/staff/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error('Toggle failed');
      setCaptains((prev) => prev.map((x) => x.id === c.id ? { ...x, status: next } : x));
    } catch {
      setLoadError('Status update failed.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-stone-100">Captain Station</h1>
          <p className="text-stone-500 text-xs tracking-wider uppercase mt-1">Manage staff members and their access codes.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-black font-black px-5 py-2.5 rounded text-xs tracking-widest uppercase transition-all"
        >
          <UserPlus size={14} /> Add Staff
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
      ) : captains.length === 0 ? (
        <div className="text-center py-20 text-stone-700">
          <Shield className="mx-auto mb-3 text-stone-800" size={36} />
          <p className="text-xs uppercase tracking-widest font-bold">No staff members yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {captains.map((c) => (
            <div key={c.id} className={`bg-stone-900 border rounded-xl p-4 flex gap-4 ${c.status === 'Active' ? 'border-stone-800' : 'border-stone-900 opacity-60'}`}>
              <div className="shrink-0">
                {c.photoPath ? (
                  <img src={`/uploads/${c.photoPath}`} alt={c.name} className="w-14 h-14 object-cover rounded-lg border border-stone-700" />
                ) : (
                  <div className="w-14 h-14 rounded-lg border border-stone-700 bg-stone-800 flex items-center justify-center">
                    <Shield size={18} className="text-stone-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-100">{c.name}</h3>
                <p className="text-[10px] text-stone-500 font-mono mt-0.5">CODE: {c.accessCode}</p>
                <span className={`inline-block mt-2 text-[10px] tracking-widest px-2 py-1 rounded font-black uppercase border ${c.status === 'Active' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-stone-800 border-stone-700 text-stone-500'}`}>
                  {c.status}
                </span>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => toggleStatus(c)} className="p-2 rounded text-stone-500 hover:text-stone-200 hover:bg-stone-800 transition-colors" title={c.status === 'Active' ? 'Deactivate' : 'Activate'}>
                  {c.status === 'Active' ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                </button>
                <button onClick={() => openEdit(c)} className="p-2 rounded text-stone-500 hover:text-stone-200 hover:bg-stone-800 transition-colors" title="Edit"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(c)} disabled={deleting === c.id} className="p-2 rounded text-stone-500 hover:text-red-400 hover:bg-stone-800 transition-colors disabled:opacity-40" title="Delete">
                  {deleting === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => { setEditing(null); setShowForm(false); setForm(EMPTY_FORM); }}>
          <div className="bg-stone-950 border border-stone-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-red-500">{editing ? 'Edit Staff' : 'Add Staff'}</h2>
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
                <label className="block text-[10px] font-bold mb-1 uppercase tracking-widest text-stone-400">Access Code *</label>
                <input type="text" value={form.accessCode} onChange={(e) => setForm((f) => ({ ...f, accessCode: e.target.value }))} disabled={!!editing} placeholder="Min 4 chars" className={`w-full bg-black border border-stone-800 rounded px-3 py-2.5 text-xs tracking-wider text-stone-200 focus:outline-none ${editing ? 'opacity-50' : 'focus:border-red-600'}`} />
                {!editing && <p className="text-[10px] text-stone-600 mt-1">Staff will use this code to clock in/out.</p>}
              </div>
              {editing && (
                <div>
                  <label className="block text-[10px] font-bold mb-1 uppercase tracking-widest text-stone-400">Status</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FormState['status'] }))} className="w-full bg-black border border-stone-800 rounded px-3 py-2.5 text-xs tracking-wider text-stone-300 focus:outline-none focus:border-red-600">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setEditing(null); setShowForm(false); setForm(EMPTY_FORM); setSaveError(null); setSaveSuccess(null); }} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-200 transition-colors">Cancel</button>
                <button type="submit" disabled={saving || !form.name.trim() || !form.accessCode.trim()} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-black font-black px-5 py-2 rounded text-xs tracking-widest uppercase transition-all flex items-center gap-2">
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
