import {React, useState, useEffect, use} from 'react';
import Items from './Items.jsx';
import {AuthService, supabase} from '/src/lib/supabase.js';
import { div } from 'framer-motion/client';

const Desktop = ({ onOpenApp }) => {
  const [Loading, setLoading] = useState(true);
  const [UserProfile, setUserProfile] = useState({ name: 'Solo Architect', avatar: 'S' });
  useEffect (() => {
    const initializeSystem = async () => {
        // 1. Lấy user hiện tại
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // 2. Lấy profile từ database
          const { data } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .single();
  
          if (data?.display_name) {
            setUserProfile({
              name: data.display_name,
              avatar: data.display_name.charAt(0).toUpperCase()
            });
          }
  
          // 3. Giả lập thời gian boot cho "ngầu" (như cái wait(2) của mày)
          setTimeout(() => setLoading(false), 2500);
        } else {
          // Nếu không có session thì đá về login
          window.location.href = './auth.html'; // Hoặc dùng navigate('/login') nếu xài React Router
        }
      };
  
      initializeSystem();
  },[]);
  const apps = [
    { id: 'settings', label: 'Settings', icon: 'Settings' },
    { id: 'tracking', label: 'Tracking', icon: 'AlarmClock' },
    { id: 'notes', label: 'Notes', icon: 'FileText' },
  ];
  return (
    <>
      <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[#D8D1B4] transition-all duration-800 
        ${!Loading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'}`}>
        <div className="w-12 h-12 border-4 border-dashed border-[#2A2820]/20 border-t-[#4A5D4E] rounded-full animate-spin"></div>
        <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 animate-pulse">Initializing System...</p>
      </div>
      <div className="flex-1 p-10 bg-[#D8D1B4] flex flex-col items-start gap-2">
        <Items.Toast message="Welcome back, Architect!" />
        {apps.map(app => (
          <Items.AppIcon 
            key={app.id}
            iconName={app.icon} 
            label={app.label} 
            onClick={() => onOpenApp(app.id)}
          />
        ))}
      </div>
    </>
    
  );
};

export default Desktop;