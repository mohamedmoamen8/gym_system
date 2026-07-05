import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Plus, Pencil, Trash2, Loader2,
  AlertTriangle, CheckCircle2, X, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  isActive: boolean;
}

interface PlanForm {
  name: string;
  description: string;
  price: string;
  durationDays: string;
  isActive: boolean;
}

const EMPTY_FORM: PlanForm = {
  name: '',
  description: '',
  price: '',
  durationDays: '',
  isActive: true,
};

function durationLabel(days: number): string {
  if (days === 30) return '1 Month';
  if (days === 60) return '2 Months';
  if (days === 90) return '3 Months';
  if (days === 180) return '6 Months';
  if (days === 365) return '1 Year';
  return `${days} days`;
}

export default function SubscriptionsTab() {
  const { authHeader } = useAuth();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<PlanForm>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/memberships', {
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('Failed to load plans');
      setPlans(await res.json());
    } catch {
      setLoadError('Could not load membership plans.');
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSaveError(null);
    setSaveSuccess(null);
    setShowForm(true);
  };

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      description: plan.description ?? '',
      price: String(plan.price),
      durationDays: String(plan.durationDays),
      isActive: plan.isActive,
    });
    setFormErrors({});
    setSaveError(null);
    setSaveSuccess(null);
    setShowForm(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<PlanForm> = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    const p = parseFloat(form.price);
    if (isNaN(p) || p <= 0) errors.price = 'Enter a valid price';
    const d = parseInt(form.durationDays, 10);
    if (isNaN(d) || d < 1) errors.durationDays = 'Enter a valid duration (min 1 day)';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const body = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: parseFloat(form.price),
      durationDays: parseInt(form.durationDays, 10),
      isActive: form.isActive,
    };

    try {
      const url = editing
        ? `/api/memberships/${editing.id}`
        : '/api/memberships';
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(
          Array.isArray(data.message)
            ? data.message.join(' · ')
            : (data.message ?? 'Save failed'),
        );
        return;
      }

      setSaveSuccess(editing ? 'Plan updated.' : `"${data.name}" plan created.`);
      setShowForm(false);
      fetchPlans();
    } catch {
      setSaveError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Delete plan "${plan.name}"? This cannot be undone.`)) return;
    setDeleting(plan.id);
    try {
      await fetch(`/api/memberships/${plan.id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      fetchPlans();
    } catch {
      // Silently refresh — if it failed the plan will still be there
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (plan: Plan) => {
    try {
      await fetch(`/api/memberships/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      fetchPlans();
    } catch { /* ignore */ }
  };

  const inputClass = (err?: string) =>
    `w-full bg-black border rounded px-3 py-2.5 text-xs text-stone-200 focus:outline-none transition-colors ${
      err ? 'border-red-500' : 'border-stone-800 focus:border-red-600'
    }`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-stone-100">
            Membership Plans
          </h1>
          <p className="text-stone-500 text-xs tracking-wider uppercase mt-1">
            Create and manage the plans offered to members.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-black font-black px-5 py-2.5 rounded text-xs tracking-widest uppercase transition-all"
        >
          <Plus size={14} /> New Plan
        </button>
      </header>

      {saveSuccess && !showForm && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded p-4">
          <CheckCircle2 size={16} className="text-green-400 shrink-0" />
          <p className="text-green-400 text-xs font-bold">{saveSuccess}</p>
        </div>
      )}

      {/* Form panel */}
      {showForm && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-red-500">
              {editing ? 'Edit Plan' : 'New Membership Plan'}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-stone-500 hover:text-stone-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded p-3">
              <AlertTriangle size={14} className="text-red-400 shrink-0" />
              <p className="text-red-400 text-xs font-bold">{saveError}</p>
            </div>
          )}

          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">
                Plan Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(err => ({ ...err, name: undefined })); }}
                placeholder="e.g. Monthly Basic"
                className={inputClass(formErrors.name)}
              />
              {formErrors.name && <p className="text-red-400 text-[10px] mt-1">{formErrors.name}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional short description..."
                className="w-full bg-black border border-stone-800 rounded px-3 py-2.5 text-xs text-stone-200 focus:outline-none focus:border-red-600 resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">
                Price (EGP) *
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.price}
                onChange={(e) => { setForm(f => ({ ...f, price: e.target.value })); setFormErrors(err => ({ ...err, price: undefined })); }}
                placeholder="e.g. 350"
                className={inputClass(formErrors.price)}
              />
              {formErrors.price && <p className="text-red-400 text-[10px] mt-1">{formErrors.price}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">
                Duration (days) *
              </label>
              <input
                type="number"
                min="1"
                value={form.durationDays}
                onChange={(e) => { setForm(f => ({ ...f, durationDays: e.target.value })); setFormErrors(err => ({ ...err, durationDays: undefined })); }}
                placeholder="e.g. 30"
                className={inputClass(formErrors.durationDays)}
              />
              {formErrors.durationDays && <p className="text-red-400 text-[10px] mt-1">{formErrors.durationDays}</p>}
              <p className="text-[10px] text-stone-600 mt-1">30 = monthly · 90 = quarterly · 365 = annual</p>
            </div>

            <div className="sm:col-span-2 flex items-center justify-between pt-1">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className="text-stone-400 transition-colors"
                >
                  {form.isActive
                    ? <ToggleRight size={24} className="text-red-500" />
                    : <ToggleLeft size={24} className="text-stone-600" />}
                </button>
                <span className="text-xs font-bold uppercase tracking-widest text-stone-400">
                  {form.isActive ? 'Active — visible to members' : 'Inactive — hidden'}
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-black font-black px-5 py-2 rounded text-xs tracking-widest uppercase transition-all"
                >
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Plans list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-stone-600">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-xs uppercase tracking-widest">Loading plans...</span>
        </div>
      ) : loadError ? (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded p-4">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-xs font-bold">{loadError}</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 text-stone-700">
          <CreditCard className="mx-auto mb-3 text-stone-800" size={40} />
          <p className="text-xs uppercase tracking-widest font-bold">No plans yet — create one above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-stone-900 border rounded-xl p-5 flex flex-col gap-3 transition-colors ${
                plan.isActive ? 'border-stone-800' : 'border-stone-900 opacity-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black uppercase tracking-wider text-stone-100 truncate">
                    {plan.name}
                  </h3>
                  {plan.description && (
                    <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">
                      {plan.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggleActive(plan)}
                  className="ml-2 shrink-0 text-stone-500 hover:text-stone-300 transition-colors"
                  title={plan.isActive ? 'Deactivate' : 'Activate'}
                >
                  {plan.isActive
                    ? <ToggleRight size={20} className="text-red-500" />
                    : <ToggleLeft size={20} />}
                </button>
              </div>

              <div className="flex items-end justify-between mt-auto pt-3 border-t border-stone-800">
                <div>
                  <p className="text-2xl font-black text-red-500">
                    {Number(plan.price).toLocaleString('en-EG')}
                    <span className="text-sm text-stone-500 font-bold ml-1">EGP</span>
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">
                    {durationLabel(plan.durationDays)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(plan)}
                    className="p-2 rounded text-stone-500 hover:text-stone-200 hover:bg-stone-800 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(plan)}
                    disabled={deleting === plan.id}
                    className="p-2 rounded text-stone-500 hover:text-red-400 hover:bg-stone-800 transition-colors disabled:opacity-40"
                    title="Delete"
                  >
                    {deleting === plan.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
