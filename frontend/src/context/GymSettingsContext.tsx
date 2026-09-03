import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export type MemberCodeType = 'qr' | 'barcode';

export interface GymSettings {
  name: string;
  logo: string | null;
  welcomeMessage: string;
  scanSoundEnabled: boolean;
  memberCodeType: MemberCodeType;
}

interface GymSettingsContextType {
  settings: GymSettings;
  updateSettings: (patch: Partial<GymSettings>) => Promise<void>;
  loading: boolean;
}

const DEFAULT_SETTINGS: GymSettings = {
  name: 'GYM',
  logo: null,
  welcomeMessage: 'Welcome coach',
  scanSoundEnabled: true,
  memberCodeType: 'qr',
};

function coerce(raw: Record<string, string | null> | null): GymSettings {
  const src = raw ?? {};
  return {
    name: src.name ?? DEFAULT_SETTINGS.name,
    logo: src.logo ?? DEFAULT_SETTINGS.logo,
    welcomeMessage: src.welcomeMessage ?? DEFAULT_SETTINGS.welcomeMessage,
    scanSoundEnabled: src.scanSoundEnabled ? src.scanSoundEnabled !== 'false' : DEFAULT_SETTINGS.scanSoundEnabled,
    memberCodeType: src.memberCodeType === 'barcode' ? 'barcode' : 'qr',
  };
}

const GymSettingsContext = createContext<GymSettingsContextType | undefined>(undefined);

export function GymSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<GymSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const { authHeader } = useAuth();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/settings', { headers: authHeader() })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((rows: { key: string; value: string | null }[]) => {
        if (!cancelled) {
          const map: Record<string, string | null> = {};
          rows.forEach((r) => { map[r.key] = r.value; });
          setSettings(coerce(map));
        }
      })
      .catch(() => setSettings(coerce(null)))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [authHeader]);

  const updateSettings = async (patch: Partial<GymSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void persist(next);
      return next;
    });
  };

  async function persist(next: GymSettings) {
    const entries: [string, string | null][] = [
      ['name', next.name],
      ['logo', next.logo],
      ['welcomeMessage', next.welcomeMessage],
      ['scanSoundEnabled', String(next.scanSoundEnabled)],
      ['memberCodeType', next.memberCodeType],
    ];
    await Promise.all(
      entries.map(([key, value]) =>
        fetch(`/api/settings/${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify({ value }),
        }).catch(() => {}),
      ),
    );
  }

  return (
    <GymSettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </GymSettingsContext.Provider>
  );
}

export function useGymSettings() {
  const context = useContext(GymSettingsContext);
  if (!context) throw new Error('useGymSettings must be used within GymSettingsProvider');
  return context;
}
