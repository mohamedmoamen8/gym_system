import { useState } from 'react';
import { GymSettingsProvider } from './context/GymSettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ScannerTab from './components/ScannerTab';
import RegisterTab from './components/RegisterTab';
import BroadcastTab from './components/BroadcastTab';
import CaptainTab from './components/CaptainTab';
import SubscriptionsTab from './components/SubscriptionsTab';
import LoginPage from './components/LoginPage';

type Tab = 'scan' | 'register' | 'broadcast' | 'captains' | 'subscriptions';

function AppShell() {
  const { auth } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('scan');

  if (!auth.token) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-black text-stone-100 font-sans antialiased select-none">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 bg-stone-950 p-8 overflow-y-auto">
        {activeTab === 'scan' && <ScannerTab />}
        {activeTab === 'register' && <RegisterTab />}
        {activeTab === 'broadcast' && <BroadcastTab />}
        {activeTab === 'captains' && <CaptainTab />}
        {activeTab === 'subscriptions' && <SubscriptionsTab />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <GymSettingsProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </GymSettingsProvider>
  );
}
