import { React, useState, useEffect } from 'react';
import Items from './Items.jsx';
import { supabase } from '/src/lib/supabase.js';

const Desktop = ({ onOpenApp }) => {
  const [Loading, setLoading] = useState(true);
  const [UserProfile, setUserProfile] = useState({ name: 'Solo Architect', avatar: 'S' });

  useEffect(() => {
    const initializeSystem = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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
        setTimeout(() => setLoading(false), 2500);
      } else {
        window.location.href = './auth.html';
      }
    };
    initializeSystem();
  }, []);

  // Mảng danh mục cấu hình App hợp nhất
  const apps = [
    { id: 'settings', label: 'Settings', icon: 'Settings' },
    { id: 'tracking', label: 'Tracking', icon: 'AlarmClock' },
    { id: 'notes', label: 'Notes', icon: 'FileText' },
    { id: 'music', label: 'Music', icon: 'Music' }
  ];

  return (
    <>
      {/* Màn hình Booting */}
      <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[#D8D1B4] transition-all duration-800 
        ${!Loading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'}`}>
        <div className="w-12 h-12 border-4 border-dashed border-[#2A2820]/20 border-t-[#4A5D4E] rounded-full animate-spin"></div>
        <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 animate-pulse">Initializing System...</p>
      </div>

      {/* TOÀN BỘ GIAO DIỆN DESKTOP CHÍNH */}
      <div className="w-full h-full bg-[#D8D1B4] p-8 flex gap-8 relative overflow-hidden">
        <Items.Toast message="Welcome back, Architect!" />

        {/* ─── CỘT TRÁI (LEFT PANEL): CHUYÊN HIỂN THỊ HỆ THỐNG CÁC WIDGETS ─── */}
        

        {/* ─── VÙNG TRUNG TÂM (MAIN DESKTOP): RENDER HỆ THỐNG ICON KHỞI ĐỘNG NHANH ─── */}
        <main className="flex-1 flex flex-col items-start gap-4 z-10">
          
          <div className="flex flex-col gap-3">
            {apps.map(app => (
              <Items.AppLauncher
                key={`icon-${app.id}`}
                id={app.id}
                iconName={app.icon}
                label={app.label}
                variant="icon" // <--- Truyền tham số để lấy giao diện Icon 48x48 truyền thống
                onClick={() => onOpenApp(app.id)}
              />
            ))}
          </div>
        </main>

        <aside className="w-68 flex flex-col gap-4 shrink-0 z-10">
          {/* Khối User Profile Nhỏ */}
          <div className="flex items-center gap-3 p-2 border-2 border-black rounded-xl bg-white/20">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-sm">{UserProfile.avatar}</div>
            <span className="text-[10px] font-black uppercase tracking-tight truncate">{UserProfile.name}</span>
          </div>

          <span className="text-[8px] font-black opacity-30 uppercase tracking-[0.2em] px-1">Live Gadgets</span>
          
          {/* Lọc và Render các App muốn hiển thị dưới dạng Widget lớn */}
          {apps
            .filter(app => app.id === 'music' || app.id === 'tracking')
            .map(app => (
              <Items.AppLauncher
                key={`widget-${app.id}`}
                id={app.id}
                iconName={app.icon}
                label={app.label}
                variant="widget" // <--- Truyền tham số để kích hoạt giao diện Widget bự
                onClick={() => onOpenApp(app.id)}
              />
            ))}
        </aside>
      </div>
    </>
  );
};

export default Desktop;