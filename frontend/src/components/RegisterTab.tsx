import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, Loader2, CheckCircle2, AlertTriangle, ImageIcon, X } from 'lucide-react';
import { useGymSettings } from '../context/GymSettingsContext';
import MemberPrintCard from './MemberPrintCard';

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
}

interface FormState {
  name: string;
  phoneNumber: string;
  barcodeCode: string;
  membershipTier: string;
  subscriptionEndDate: string;
}

interface FormErrors {
  name?: string;
  phoneNumber?: string;
  barcodeCode?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!form.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required';
  if (!form.barcodeCode.trim()) errors.barcodeCode = 'Barcode / ID is required';
  else if (form.barcodeCode.trim().length < 3)
    errors.barcodeCode = 'Barcode must be at least 3 characters';
  return errors;
}

function dataURLtoFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

/** Compute subscription end date from today + durationDays */
function calcEndDate(durationDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + durationDays);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

const EMPTY_FORM: FormState = {
  name: '',
  phoneNumber: '',
  barcodeCode: '',
  membershipTier: '',
  subscriptionEndDate: '',
};

export default function RegisterTab() {
  const { settings, updateSettings } = useGymSettings();
  const webcamRef = useRef<Webcam>(null);

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [registeredMember, setRegisteredMember] = useState<{
    name: string;
    barcodeCode: string;
    membershipTier: string | null;
  } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load active membership plans
  useEffect(() => {
    fetch('/api/memberships/active')
      .then((r) => r.json())
      .then((data: MembershipPlan[]) => {
        setPlans(data);
        if (data.length > 0) {
          setForm((f) => ({
            ...f,
            membershipTier: data[0].name,
            subscriptionEndDate: calcEndDate(data[0].durationDays),
          }));
        }
      })
      .catch(() => { /* plans stay empty, user can still type a tier */ })
      .finally(() => setPlansLoading(false));
  }, []);

  // When the selected plan changes, auto-update the end date
  const handlePlanChange = (planName: string) => {
    const plan = plans.find((p) => p.name === planName);
    setForm((f) => ({
      ...f,
      membershipTier: planName,
      subscriptionEndDate: plan ? calcEndDate(plan.durationDays) : f.subscriptionEndDate,
    }));
    setApiError(null);
  };

  const setField = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((err) => ({ ...err, [key]: undefined }));
    setApiError(null);
  };

  const captureSnapshot = () => {
    const src = webcamRef.current?.getScreenshot();
    if (src) setCapturedPhoto(src);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => updateSettings({ logo: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setRegisteredMember(null);
    setApiError(null);

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('phoneNumber', form.phoneNumber.trim());
      formData.append('barcodeCode', form.barcodeCode.trim());
      if (form.membershipTier) formData.append('membershipTier', form.membershipTier);
      if (form.subscriptionEndDate) formData.append('subscriptionEndDate', form.subscriptionEndDate);

      if (capturedPhoto) {
        formData.append('photo', dataURLtoFile(capturedPhoto, 'photo.jpg'));
      }

      const res = await fetch('/api/customers/register', {
        method: 'POST',
        body: formData,
      });

      const body = await res.json().catch(() => ({}));

      if (res.status === 409) {
        setApiError(`Barcode "${form.barcodeCode}" is already registered.`);
        return;
      }
      if (!res.ok) {
        setApiError(
          Array.isArray(body.message)
            ? body.message.join(' · ')
            : (body.message ?? 'Registration failed. Please try again.'),
        );
        return;
      }

      setSuccess(`${body.name} registered successfully!`);
      setRegisteredMember({
        name: body.name,
        barcodeCode: body.barcodeCode,
        membershipTier: body.membershipTier ?? null,
      });
      // Reset form but keep the first plan selected
      const firstPlan = plans[0];
      setForm({
        ...EMPTY_FORM,
        membershipTier: firstPlan?.name ?? '',
        subscriptionEndDate: firstPlan ? calcEndDate(firstPlan.durationDays) : '',
      });
      setCapturedPhoto(null);
    } catch {
      setApiError('Could not reach the server. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (err?: string) =>
    `w-full bg-black border rounded px-4 py-3 text-xs tracking-wider text-stone-200 focus:outline-none placeholder-stone-700 transition-colors ${
      err ? 'border-red-500 focus:border-red-400' : 'border-stone-800 focus:border-red-600'
    }`;

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Brand settings */}
      <section className="bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-xs font-black tracking-widest text-red-500 uppercase">Gym Brand Settings</h2>
          <p className="text-[11px] text-stone-500 uppercase tracking-wider mt-0.5">
            Set the gym name and logo shown in the sidebar.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Gym Name</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => updateSettings({ name: e.target.value })}
              className="w-full bg-black border border-stone-800 rounded px-4 py-2.5 text-xs tracking-wider text-stone-200 focus:outline-none focus:border-red-600 uppercase font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Logo Image</label>
            <label className="flex items-center justify-center gap-2 w-full bg-black border border-stone-800 rounded px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-stone-400 cursor-pointer hover:border-stone-700 transition-colors">
              <ImageIcon size={14} className="text-red-500" />
              {settings.logo ? 'Replace Logo' : 'Upload Logo'}
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone-800">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">
              Scan Welcome Message
            </label>
            <input
              type="text"
              value={settings.welcomeMessage}
              onChange={(e) => updateSettings({ welcomeMessage: e.target.value })}
              placeholder="Welcome coach"
              className="w-full bg-black border border-stone-800 rounded px-4 py-2.5 text-xs tracking-wider text-stone-200 focus:outline-none focus:border-red-600"
            />
            <p className="text-[10px] text-stone-600 mt-1">
              Spoken when a member scans in. Use {'{name}'} for their name.
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                Member Card Code Type
              </label>
              <select
                value={settings.memberCodeType}
                onChange={(e) => updateSettings({ memberCodeType: e.target.value as 'qr' | 'barcode' })}
                className="w-full bg-black border border-stone-800 rounded px-4 py-2.5 text-xs tracking-wider text-stone-300 focus:outline-none focus:border-red-600"
              >
                <option value="qr">QR Code (recommended)</option>
                <option value="barcode">Linear Barcode</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.scanSoundEnabled}
                onChange={(e) => updateSettings({ scanSoundEnabled: e.target.checked })}
                className="accent-red-600 w-3.5 h-3.5"
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                Click sound + voice on scan
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* Registration form */}
      <section className="space-y-4">
        <header>
          <h1 className="text-2xl font-black tracking-tighter uppercase text-stone-100">New Member Registration</h1>
          <p className="text-stone-500 text-xs tracking-wider uppercase mt-1">
            Capture photo and fill in member details to issue a membership.
          </p>
        </header>

        {success && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded p-4">
              <CheckCircle2 size={16} className="text-green-400 shrink-0" />
              <p className="text-green-400 text-xs font-bold tracking-wider">{success}</p>
            </div>
            {registeredMember && (
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-4 text-center">
                  Print member card — scan at front desk
                </h3>
                <MemberPrintCard
                  name={registeredMember.name}
                  barcodeCode={registeredMember.barcodeCode}
                  membershipTier={registeredMember.membershipTier}
                />
              </div>
            )}
          </div>
        )}
        {apiError && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded p-4">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-xs font-bold tracking-wider">{apiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Photo column */}
            <div className="md:col-span-1 space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400">Member Photo</label>
              <div className="relative aspect-square w-full bg-black border border-stone-800 rounded-xl overflow-hidden flex items-center justify-center">
                {capturedPhoto ? (
                  <>
                    <img src={capturedPhoto} className="w-full h-full object-cover" alt="Captured" />
                    <button
                      type="button"
                      onClick={() => setCapturedPhoto(null)}
                      className="absolute top-2 right-2 bg-black/80 rounded-full p-1 text-stone-400 hover:text-red-400"
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    onUserMedia={() => setWebcamReady(true)}
                    onUserMediaError={() => setWebcamReady(false)}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              {!capturedPhoto && (
                <button
                  type="button"
                  onClick={captureSnapshot}
                  disabled={!webcamReady}
                  className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-200 border border-stone-800 font-bold tracking-wider py-2.5 rounded text-[10px] uppercase flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Camera size={12} className="text-red-500" /> Capture Photo
                </button>
              )}
              <p className="text-[10px] text-stone-600 text-center">Optional but recommended.</p>
            </div>

            {/* Fields column */}
            <div className="md:col-span-2 space-y-4 bg-stone-900 border border-stone-800 rounded-xl p-6">
              <div>
                <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest text-stone-400">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className={inputClass(errors.name)}
                />
                {errors.name && <p className="text-red-400 text-[10px] mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest text-stone-400">WhatsApp / Phone *</label>
                <input
                  type="tel"
                  placeholder="+20 1XX XXX XXXX"
                  value={form.phoneNumber}
                  onChange={(e) => setField('phoneNumber', e.target.value)}
                  className={inputClass(errors.phoneNumber)}
                />
                {errors.phoneNumber && <p className="text-red-400 text-[10px] mt-1">{errors.phoneNumber}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest text-stone-400">
                  Barcode / Member ID *
                </label>
                <p className="text-[10px] text-stone-600 mb-1.5">
                  This value is encoded on the printed card (QR or barcode).
                </p>
                <input
                  type="text"
                  placeholder="e.g. GYM-00123"
                  value={form.barcodeCode}
                  onChange={(e) => setField('barcodeCode', e.target.value)}
                  className={inputClass(errors.barcodeCode)}
                />
                {errors.barcodeCode && <p className="text-red-400 text-[10px] mt-1">{errors.barcodeCode}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest text-stone-400">
                    Membership Plan
                  </label>
                  {plansLoading ? (
                    <div className="flex items-center gap-2 text-stone-600 py-2 text-xs">
                      <Loader2 size={12} className="animate-spin" /> Loading plans...
                    </div>
                  ) : plans.length === 0 ? (
                    <input
                      type="text"
                      placeholder="No plans — type manually"
                      value={form.membershipTier}
                      onChange={(e) => setField('membershipTier', e.target.value)}
                      className={inputClass()}
                    />
                  ) : (
                    <select
                      value={form.membershipTier}
                      onChange={(e) => handlePlanChange(e.target.value)}
                      className="w-full bg-black border border-stone-800 rounded px-4 py-3 text-xs tracking-wider text-stone-300 focus:outline-none focus:border-red-600"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} — {Number(p.price).toLocaleString('en-EG')} EGP / {p.durationDays}d
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-widest text-stone-400">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={form.subscriptionEndDate}
                    onChange={(e) => setField('subscriptionEndDate', e.target.value)}
                    className="w-full bg-black border border-stone-800 rounded px-4 py-3 text-xs tracking-wider text-stone-300 focus:outline-none focus:border-red-600"
                  />
                  <p className="text-[10px] text-stone-600 mt-1">Auto-set from plan duration.</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-4 rounded text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/10"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {submitting ? 'Registering...' : 'Register Member'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
