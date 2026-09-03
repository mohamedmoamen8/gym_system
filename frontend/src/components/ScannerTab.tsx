import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  QrCode, ShieldCheck, ShieldAlert, ShieldOff,
  AlertTriangle, Loader2, CalendarDays, Phone, Tag, Volume2, Camera, X,
} from 'lucide-react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { useGymSettings } from '../context/GymSettingsContext';
import { useAuth } from '../context/AuthContext';
import { handleScanResult } from '../utils/scanFeedback';

interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  barcodeCode: string;
  membershipTier: string | null;
  subscriptionEndDate: string | null;
  photoPath: string | null;
  status: 'Active' | 'Suspended' | 'Expired';
  /** Server-derived status (e.g. Expired by date even if column is stale). */
  effectiveStatus?: Customer['status'];
  /** Server-derived access decision. */
  accessAllowed?: boolean;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function daysLeft(endDate: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Customer['status'] }) {
  const cfg = {
    Active:    { bg: 'bg-green-500/10 border-green-500/20 text-green-400',  icon: <ShieldCheck size={12} /> },
    Suspended: { bg: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400', icon: <ShieldAlert size={12} /> },
    Expired:   { bg: 'bg-red-500/10 border-red-500/20 text-red-400',        icon: <ShieldOff size={12} /> },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 border text-[10px] tracking-widest px-3 py-1 rounded font-black uppercase ${cfg.bg}`}>
      {cfg.icon}
      {status}
    </span>
  );
}

function DaysLeftBadge({ days }: { days: number | null }) {
  if (days === null) return null;

  const isExpired = days < 0;
  const isWarning = days >= 0 && days <= 7;
  const color = isExpired ? 'text-red-500' : isWarning ? 'text-yellow-400' : 'text-green-400';
  const label = isExpired
    ? `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`
    : days === 0
    ? 'Expires today'
    : `${days} day${days !== 1 ? 's' : ''} left`;

  return (
    <div className="bg-black p-4 rounded border border-stone-800">
      <div className="text-[10px] uppercase tracking-widest font-bold text-stone-500 flex items-center gap-1">
        <CalendarDays size={10} /> Days Remaining
      </div>
      <div className={`text-3xl font-black mt-1 ${color}`}>{label}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ScannerTab() {
  const { settings } = useGymSettings();
  const { authHeader } = useAuth();
  const [manualCode, setManualCode] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [usingCamera, setUsingCamera] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const lastScannedCodeRef = useRef<string | null>(null);

  // Keep input focused for physical barcode scanners
  useEffect(() => {
    if (!loading && !usingCamera) inputRef.current?.focus();
  }, [loading, customer, usingCamera]);

  const scanCode = useCallback(async (code: string) => {
    if (!code || code === lastScannedCodeRef.current) return;
    lastScannedCodeRef.current = code;
    setManualCode('');
    setLoading(true);
    setError(null);
    setCustomer(null);

    try {
      const res = await fetch(`/api/customers/barcode/${encodeURIComponent(code)}`, {
        headers: authHeader(),
      });
      if (res.status === 401) {
        setError('Session expired. Please sign in again.');
        handleScanResult({ success: false, welcomeMessage: settings.welcomeMessage, soundEnabled: settings.scanSoundEnabled });
        return;
      }
      if (res.status === 404) {
        setError(`No member found with barcode "${code}"`);
        handleScanResult({ success: false, welcomeMessage: settings.welcomeMessage, soundEnabled: settings.scanSoundEnabled });
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Server error. Please try again.');
        handleScanResult({ success: false, welcomeMessage: settings.welcomeMessage, soundEnabled: settings.scanSoundEnabled });
        return;
      }
      const data: Customer = await res.json();
      setCustomer(data);
      const isAllowed = data.accessAllowed ?? data.status === 'Active';
      handleScanResult({ success: isAllowed, welcomeMessage: settings.welcomeMessage, memberName: data.name, soundEnabled: settings.scanSoundEnabled });
    } catch {
      setError('Could not reach the server. Check your connection.');
      handleScanResult({ success: false, welcomeMessage: settings.welcomeMessage, soundEnabled: settings.scanSoundEnabled });
    } finally {
      setLoading(false);
    }
  }, [settings, authHeader]);

  const startCamera = () => {
    setUsingCamera(true);
    setScanError(null);
  };

  const stopCamera = () => {
    setUsingCamera(false);
    if (scanIntervalRef.current) {
      cancelAnimationFrame(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const processVideoFrame = useCallback(() => {
    if (!usingCamera || !webcamRef.current) {
      scanIntervalRef.current = requestAnimationFrame(processVideoFrame);
      return;
    }

    const screenshot = webcamRef.current.getScreenshot({ width: 320, height: 240 });
    if (screenshot) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          scanIntervalRef.current = requestAnimationFrame(processVideoFrame);
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // Use the data directly - jsQR accepts Uint8Array-like
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
        if (code) {
          scanCode(code.data);
          stopCamera();
          return;
        }
      };
      img.src = screenshot;
    }
    scanIntervalRef.current = requestAnimationFrame(processVideoFrame);
  }, [usingCamera, scanCode]);

  useEffect(() => {
    if (usingCamera) {
      scanIntervalRef.current = requestAnimationFrame(processVideoFrame);
    }
    return () => {
      if (scanIntervalRef.current) {
        cancelAnimationFrame(scanIntervalRef.current);
      }
    };
  }, [usingCamera, processVideoFrame]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;

    lastScannedCodeRef.current = null;
    setLoading(true);
    setError(null);
    setCustomer(null);
    setManualCode('');

    try {
      const res = await fetch(`/api/customers/barcode/${encodeURIComponent(code)}`, {
        headers: authHeader(),
      });
      if (res.status === 401) {
        setError('Session expired. Please sign in again.');
        handleScanResult({
          success: false,
          welcomeMessage: settings.welcomeMessage,
          soundEnabled: settings.scanSoundEnabled,
        });
        return;
      }
      if (res.status === 404) {
        setError(`No member found with barcode "${code}"`);
        handleScanResult({
          success: false,
          welcomeMessage: settings.welcomeMessage,
          soundEnabled: settings.scanSoundEnabled,
        });
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Server error. Please try again.');
        handleScanResult({
          success: false,
          welcomeMessage: settings.welcomeMessage,
          soundEnabled: settings.scanSoundEnabled,
        });
        return;
      }
      const data: Customer = await res.json();
      setCustomer(data);

      const isAllowed = data.accessAllowed ?? data.status === 'Active';
      handleScanResult({
        success: isAllowed,
        welcomeMessage: settings.welcomeMessage,
        memberName: data.name,
        soundEnabled: settings.scanSoundEnabled,
      });
    } catch {
      setError('Could not reach the server. Check your connection.');
      handleScanResult({
        success: false,
        welcomeMessage: settings.welcomeMessage,
        soundEnabled: settings.scanSoundEnabled,
      });
    } finally {
      setLoading(false);
    }
  };

  const days = customer ? daysLeft(customer.subscriptionEndDate) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-stone-100">
          Attendance Scanner
        </h1>
        <p className="text-stone-500 text-xs tracking-wider uppercase mt-1">
          Scan or type a member barcode / QR to verify access.
        </p>
        {settings.scanSoundEnabled && (
          <p className="text-stone-600 text-[10px] tracking-wider uppercase mt-2 flex items-center gap-1.5">
            <Volume2 size={10} className="text-red-500/70" />
            Sound on — "{settings.welcomeMessage.replace(/\{name\}/gi, '…')}"
          </p>
        )}
      </header>

      {/* Camera scanner */}
      {!customer && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
          {!usingCamera ? (
            <button
              type="button"
              onClick={startCamera}
              className="w-full flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold py-4 text-xs uppercase tracking-widest transition-colors"
            >
              <Camera size={16} className="text-red-500" />
              Use Camera Scanner
            </button>
          ) : (
            <div className="relative">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                onUserMediaError={() => {
                  setScanError('Camera not available. Please use manual input.');
                  setUsingCamera(false);
                }}
                className="w-full h-64 object-cover"
              />
              <button
                type="button"
                onClick={stopCamera}
                className="absolute top-2 right-2 bg-black/80 rounded-full p-1 text-stone-400 hover:text-red-400"
              >
                <X size={14} />
              </button>
              <div className="p-3 text-center text-[10px] text-stone-400 uppercase tracking-wider">
                Point camera at QR/barcode
              </div>
              {scanError && (
                <p className="p-2 text-red-400 text-[10px]">{scanError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Scan or type barcode..."
          disabled={loading}
          className="flex-1 bg-stone-900 border border-stone-800 rounded font-mono px-4 py-3.5 text-sm tracking-widest focus:outline-none focus:border-red-600 text-stone-100 placeholder-stone-700 disabled:opacity-50"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !manualCode.trim()}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black uppercase tracking-wider text-xs px-8 rounded transition-colors flex items-center gap-2"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          VALIDATE
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded p-4">
          <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-red-400 text-xs font-bold tracking-wider">{error}</p>
        </div>
      )}

      {/* Member card */}
      {customer && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-2xl">
          {/* Top colored strip based on status */}
            <div
              className={`h-1 w-full ${
                (customer.effectiveStatus ?? customer.status) === 'Active' ? 'bg-green-500' :
                (customer.effectiveStatus ?? customer.status) === 'Suspended' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            />

          <div className="p-6 flex gap-6 items-start">
            {/* Photo */}
            <div className="shrink-0">
              {customer.photoPath ? (
                <img
                  src={`/uploads/${customer.photoPath}`}
                  alt={customer.name}
                  className="w-36 h-36 object-cover rounded-xl border border-stone-700 shadow-lg"
                />
              ) : (
                <div className="w-36 h-36 rounded-xl border border-stone-700 bg-stone-800 flex items-center justify-center">
                  <QrCode size={36} className="text-stone-600" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Name + status */}
              <div>
                <StatusBadge status={customer.effectiveStatus ?? customer.status} />
                <h2 className="text-4xl font-black tracking-tighter text-stone-100 uppercase mt-2 truncate">
                  {customer.name}
                </h2>
              </div>

              {/* Detail chips */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
                  <Tag size={12} className="text-stone-600 shrink-0" />
                  {customer.barcodeCode}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
                  <Phone size={12} className="text-stone-600 shrink-0" />
                  {customer.phoneNumber}
                </div>
                {customer.membershipTier && (
                  <div className="flex items-center gap-1.5 text-xs text-stone-400">
                    <QrCode size={12} className="text-stone-600 shrink-0" />
                    {customer.membershipTier}
                  </div>
                )}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <DaysLeftBadge days={days} />

                <div className="bg-black p-4 rounded border border-stone-800">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-stone-500 flex items-center gap-1">
                    <CalendarDays size={10} /> Expiry Date
                  </div>
                  <div className="text-base font-black text-stone-300 mt-1">
                    {customer.subscriptionEndDate
                      ? formatDate(customer.subscriptionEndDate)
                      : <span className="text-stone-600">Not set</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Idle placeholder */}
      {!customer && !error && !loading && (
        <div className="border border-dashed border-stone-900 rounded-xl p-16 text-center text-stone-600">
          <QrCode className="mx-auto text-stone-800 mb-4" size={48} />
          <p className="text-xs uppercase tracking-widest font-bold">
            Awaiting barcode scan
          </p>
        </div>
      )}
    </div>
  );
}