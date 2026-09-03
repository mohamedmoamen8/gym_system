import { useState } from 'react';
import { GymSettingsProvider } from './context/GymSettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ScannerTab from './components/ScannerTab';
import RegisterTab from './components/RegisterTab';
import BroadcastTab from './components/BroadcastTab';
import CaptainTab from './components/CaptainTab';
import SubscriptionsTab from './components/SubscriptionsTab';
import DashboardTab from './components/DashboardTab';
import MembersListTab from './components/MembersListTab';
import StaffManagementTab from './components/StaffManagementTab';
import PaymentsTab from './components/PaymentsTab';
import LoginPage from './components/LoginPage';
import ForcePasswordChange from './components/ForcePasswordChange';

type Tab = 'dashboard' | 'scan' | 'register' | 'broadcast' | 'captains' | 'subscriptions' | 'members' | 'staff' | 'payments';

function AppShell() {
  const { auth } = useAuth();

  if (!auth.token) {
    return <LoginPage />;
  }

  if (auth.mustChangePassword) {
    return <ForcePasswordChange />;
  }

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <div className="flex h-screen bg-black text-stone-100 font-sans antialiased select-none">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 bg-stone-950 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'scan' && <ScannerTab />}
        {activeTab === 'register' && <RegisterTab />}
        {activeTab === 'broadcast' && <BroadcastTab />}
        {activeTab === 'captains' && <CaptainTab />}
        {activeTab === 'subscriptions' && <SubscriptionsTab />}
        {activeTab === 'members' && <MembersListTab />}
        {activeTab === 'staff' && <StaffManagementTab />}
        {activeTab === 'payments' && <PaymentsTab />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GymSettingsProvider>
        <AppShell />
      </GymSettingsProvider>
    </AuthProvider>
  );
}
