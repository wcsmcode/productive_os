import React, { useState, useEffect } from 'react';
import { 
  Home, User, Monitor, Cloud, MousePointer, 
  AppWindow, Sparkles, Settings as SettingsIcon,
  ChevronRight, Activity, FileText, Bell, Cpu, Shield, HardDrive, LogOut,Trash2
} from 'lucide-react';
import {supabase} from '../../lib/supabase';
import { AuthService } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

// --- PHẦN 1: CÁC LINH KIỆN NHỎ (COMPONENTS) ---

export const SidebarItem = ({ id, label, icon: Icon, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center gap-3 px-3 py-2 text-[11px] font-black uppercase transition-all border w-full text-left
      ${active 
        ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
        : 'border-transparent hover:border-black bg-transparent'}`}
  >
    <Icon size={16} /> {label}
  </button>
);

export const SettingCard = ({ icon: Icon, title, subtitle, action }) => (
  <div className="group flex items-center justify-between p-4 bg-white border border-black hover:bg-zinc-50 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]">
    <div className="flex items-center gap-4">
      <Icon size={20} className="opacity-60" />
      <div>
        <div className="text-xs font-black italic uppercase">{title}</div>
        {subtitle && <div className="text-[10px] opacity-50 italic">{subtitle}</div>}
      </div>
    </div>
    {action ? action : <ChevronRight size={16} className="opacity-30" />}
  </div>
);

export const StatBox = ({ label, value, subValue, icon: Icon, variant = "dark" }) => (
  <div className="p-4 border border-black bg-white flex items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    <div className={`w-12 h-10 border border-black flex items-center justify-center font-bold italic 
      ${variant === "dark" ? 'bg-black text-white' : 'bg-white text-black rounded-full'}`}>
      {Icon ? <Icon size={18} /> : value.substring(0, 3)}
    </div>
    <div>
      <div className="text-[10px] opacity-50 uppercase font-bold text-zinc-500">{label}</div>
      <div className={`text-xs font-black uppercase ${subValue === 'Connected' ? 'text-green-600' : ''}`}>
        {value}
      </div>
    </div>
  </div>
);

// --- PHẦN 2: TÁCH NỘI DUNG TỪNG TAB ---

// 1. Giao diện của Tab Home
const HomeTab = () => (
  <div className="space-y-6 animate-in fade-in duration-200">
    <div className="grid grid-cols-2 gap-4">
      <StatBox label="Device Name" value="DEEPWORK-STATION" />
      <StatBox label="Cloud Sync" value="Connected" icon={Cloud} variant="light" />
    </div>

    <div className="space-y-3">
      <h3 className="text-sm font-black opacity-80 px-1 uppercase tracking-wider italic underline">Recommended settings</h3>
      <div className="flex flex-col gap-2">
        <SettingCard 
          icon={Sparkles} 
          title="Primary mouse button: Right" 
          subtitle="Quick access optimization"
          action={<button className="px-4 py-1.5 bg-black text-white text-[10px] font-black uppercase hover:bg-zinc-800 transition-all shadow-[2px_2px_0px_0px_rgba(100,100,100,1)]">Apply</button>}
        />
        <SettingCard icon={MousePointer} title="Mouse settings" />
        <SettingCard icon={AppWindow} title="Installed apps" />
      </div>
    </div>
  </div>
);

// 2. Giao diện của Tab Account
const AccountTab = () => (
  <div className="space-y-6 animate-in fade-in duration-200">
    <div className="grid grid-cols-2 gap-4">
      <StatBox label="Subscription" value="None" />
      <StatBox label="Security Tier" value="Maximum" icon={Shield} variant="dark" />
    </div>

    <div className="space-y-3">
      <h3 className="text-sm font-black opacity-80 px-1 uppercase tracking-wider italic underline">Account Management</h3>
      <div className="flex flex-col gap-2">
        <SettingCard icon={User} title="Edit Profile credentials" subtitle="Change avatar, username and email" />
        <SettingCard icon={Bell} title="Notification Preferences" subtitle="Manage alerts and database pings" />
      </div>
      <h3 className="text-sm font-bold text-red-700 opacity-80 px-1 uppercase tracking-wider italic underline">Danger Zone</h3>
      <div className="flex flex-col gap-2">
        <SettingCard icon={Trash2} title="Delete Account" subtitle="Delete your data and account permanently" />
      </div>
    </div>
  </div>
);

// 3. Giao diện của Tab System
const SystemTab = () => (
  <div className="space-y-6 animate-in fade-in duration-200">
    <div className="grid grid-cols-2 gap-4">
      <StatBox label="CPU Load" value="12% Active" icon={Cpu} variant="light" />
      <StatBox label="Storage" value="45 GB Free" icon={HardDrive} variant="dark" />
    </div>

    <div className="space-y-3">
      <h3 className="text-sm font-black opacity-80 px-1 uppercase tracking-wider italic underline">Core Engine Configuration</h3>
      <div className="flex flex-col gap-2">
        <SettingCard icon={Activity} title="Performance Mode" subtitle="High efficiency focus state allocation" />
        <SettingCard icon={FileText} title="System Logs" subtitle="Inspect WebSocket and local cache state" />
      </div>
    </div>
  </div>
);

// --- PHẦN 3: GIAO DIỆN CHÍNH (MAIN APP) ---

const SettingsApp = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [userProfile, setUserProfile] = useState(null);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
        return;
      }
      const user = await AuthService.getCurrentUser();
      setUserProfile(user);
    };

    fetchUserProfile();
  }, []);
  const handleLogOut = async() => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
    else {
      window.location.href = '/app/auth.html';  
    }
  }
  // Hàm helper quyết định component nào được vẽ dựa trên tab đang kích hoạt
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'account':
        return <AccountTab />;
      case 'system':
        return <SystemTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="flex h-[550px] w-[850px] bg-[#f8f6f0] text-black overflow-hidden rounded-lg border border-black font-mono select-none">
      {/* Sidebar */}
      <aside className="w-64 border-r border-black p-4 flex flex-col gap-2 bg-[#ededed]">
        <div className="flex items-center gap-3 p-2 mb-6 border border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-10 h-10 border border-black flex items-center justify-center bg-black text-white font-bold text-[10px]">AVT</div>
          <div className="overflow-hidden">
            <div className="text-[10px] font-black truncate uppercase">
              {userProfile?.name || 'User'}
            </div>
            <div className="text-[9px] opacity-50 truncate italic underline">
              {userProfile?.userEmail || 'user@deepwork.os'}
            </div>
          </div>
          <LogOut onClick={()=>handleLogOut()} size={16} className="ml-auto opacity-50 hover:opacity-100 hover:cursor-pointer"/>
        </div>

        <nav className="flex flex-col gap-1 w-full">
          <SidebarItem id="home" label="Home" icon={Home} active={activeTab === 'home'} onClick={setActiveTab} />
          <SidebarItem id="account" label="Account" icon={User} active={activeTab === 'account'} onClick={setActiveTab} />
          <SidebarItem id="system" label="System" icon={Cpu} active={activeTab === 'system'} onClick={setActiveTab} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col bg-white/30">
        <header className="p-8 pb-4">
          <h1 className="text-3xl font-black tracking-tight uppercase italic text-black">{activeTab}</h1>
        </header>

        <div className="px-8 pb-8 overflow-y-auto flex-grow">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default SettingsApp;