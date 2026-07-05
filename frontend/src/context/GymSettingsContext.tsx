import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'gym_settings';

export type MemberCodeType = 'qr' | 'barcode';

interface GymSettings {
  name: string;
  logo: string | null;
  /** Spoken on successful scan. Use {name} for member name. */
  welcomeMessage: string;
  /** Play click + voice when a member is scanned in. */
  scanSoundEnabled: boolean;
  /** What to print on member cards — QR code or linear barcode. */
  memberCodeType: MemberCodeType;
}

interface GymSettingsContextType {
  settings: GymSettings;
  updateSettings: (patch: Partial<GymSettings>) => void;
}

const DEFAULT_SETTINGS: GymSettings = {
  name: 'GYM',
  logo: null,
  welcomeMessage: 'Welcome coach',
  scanSoundEnabled: true,
  memberCodeType: 'qr',
};

function loadSettings(): GymSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<GymSettings>;
    return {
      name: parsed.name ?? DEFAULT_SETTINGS.name,
      logo: parsed.logo ?? DEFAULT_SETTINGS.logo,
      welcomeMessage: parsed.welcomeMessage ?? DEFAULT_SETTINGS.welcomeMessage,
      scanSoundEnabled: parsed.scanSoundEnabled ?? DEFAULT_SETTINGS.scanSoundEnabled,
      memberCodeType: parsed.memberCodeType ?? DEFAULT_SETTINGS.memberCodeType,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const GymSettingsContext = createContext<GymSettingsContextType | undefined>(undefined);

export function GymSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<GymSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (patch: Partial<GymSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  return (
    <GymSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </GymSettingsContext.Provider>
  );
}

export function useGymSettings() {
  const context = useContext(GymSettingsContext);
  if (!context) throw new Error('useGymSettings must be used within GymSettingsProvider');
  return context;
}
