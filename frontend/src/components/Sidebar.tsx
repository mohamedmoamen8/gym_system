import React from 'react';
import { QrCode, MessageSquare, UserPlus, Shield, CreditCard, LogOut } from 'lucide-react';
import { useGymSettings } from '../context/GymSettingsContext';
import { useAuth } from '../context/AuthContext';

type Tab = 'scan' | 'register' | 'broadcast' | 'captains' | 'subscriptions';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'scan',          label: 'Front Desk Scanner', icon: <QrCode size={16} /> },
  { id: 'register',      label: 'Register Member',    icon: <UserPlus size={16} /> },
  { id: 'subscriptions', label: 'Membership Plans',   icon: <CreditCard size={16} /> },
  { id: 'broadcast',     label: 'Broadcast',          icon: <MessageSquare size={16} /> },
  { id: 'captains',      label: 'Captain Station',    icon: <Shield size={16} /> },
];

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { settings } = useGymSettings();
  const { auth, logout } = useAuth();

  return (
    <nav className="w-60 bg-stone-950 border-r border-stone-900 flex flex-col p-4">
      {/* Branding */}
      <div className="flex items-center gap-3 px-2 py-4 border-b border-stone-900 mb-5">
        {settings.logo ? (
          <img
            src={settings.logo}
            alt="Gym Logo"
            className="w-9 h-9 object-cover rounded border border-stone-800 shrink-0"
          />
        ) : (
          <div className="bg-red-600 w-9 h-9 rounded flex items-center justify-center text-black font-black text-sm shrink-0">
            ⚡
          </div>
        )}
        <span className="text-base font-black tracking-tighter text-red-500 uppercase truncate">
          {settings.name}
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-bold tracking-wider uppercase transition-all ${
              activeTab === id
                ? 'bg-red-600 text-black shadow-lg shadow-red-600/20'
                : 'text-stone-400 hover:bg-stone-900 hover:text-stone-100'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Footer — logged-in user + logout */}
      <div className="border-t border-stone-900 pt-4 space-y-3">
        <div className="px-3">
          <p className="text-[10px] text-stone-600 uppercase tracking-widest">Signed in as</p>
          <p className="text-xs font-bold text-stone-300 truncate">{auth.username}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-bold tracking-wider uppercase text-stone-500 hover:bg-stone-900 hover:text-red-400 transition-all"
        >
          <LogOut size={14} />
          Sign Out
        </button>
        <p className="text-[9px] font-mono tracking-widest text-stone-800 px-3">
          v2.0.0
        </p>
      </div>
    </nav>
  );
}
