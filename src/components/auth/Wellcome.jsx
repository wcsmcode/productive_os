import React, { useState, useEffect } from 'react';
import { supabase } from '/src/lib/supabase'; // Đường dẫn file khởi tạo supabase của mày
import {useAuthStore} from '/src/lib/store.js';

const WelcomeScreen = () => {
const setcurrentState = useAuthStore((state) => state.setcurrentState);
  // --- STATES ---
  const [loading, setLoading] = useState(true); // Trạng thái booting ban đầu
  const [userProfile, setUserProfile] = useState({ name: 'Solo Architect', avatar: 'S' });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isExiting, setIsExiting] = useState(false); // Hiệu ứng khi nhấn Resume

  // --- LOGIC: ĐỒNG HỒ ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- LOGIC: AUTH & BOOTING ---
  useEffect(() => {
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
        setcurrentState('Login');
      }
    };

    initializeSystem();
  }, []);

  // --- ACTIONS ---
  const handleResume = () => {
    setIsExiting(true);
    setTimeout(() => {
      window.location.href = './home.html'; // Hoặc dùng navigate('/home') nếu xài React Router
    }, 1000);
  };

  // Format thời gian
  const timeStr = currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative h-screen w-full bg-[#D8D1B4] text-[#2A2820] font-mono overflow-hidden">
      
      {/* 1. BOOTING SCREEN (Overlay) */}
      <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[#D8D1B4] transition-all duration-800 
        ${!loading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'}`}>
        <div className="w-12 h-12 border-4 border-dashed border-[#2A2820]/20 border-t-[#4A5D4E] rounded-full animate-spin"></div>
        <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 animate-pulse">Initializing System...</p>
      </div>

      {/* 2. MAIN LOCK CONTENT */}
      <div className={`absolute inset-0 p-12 flex flex-col justify-between transition-all duration-1000 ease-in-out
        ${isExiting ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        
        {/* Top Meta */}
        <div className="flex justify-between items-start opacity-40 text-[10px] tracking-[0.3em] uppercase">
          <div>User_Session: Active<br />Environment: Deep_Work_V1</div>
          <div className="text-right">Local_Time: {timeStr}<br />System_Integrity: Nominal</div>
        </div>

        {/* Center Welcome */}
        <div className="flex flex-col items-center text-center">
          <h1 className="font-sans text-[10rem] md:text-[14rem] font-black tracking-tighter leading-none mb-4">
            {timeStr}
          </h1>
          
          <div className="bg-[#E4DFC8]/40 backdrop-blur-md px-8 py-6 rounded-2xl flex items-center gap-6 shadow-2xl border border-[#2A2820]/10 mt-4">
            <div className="w-16 h-16 bg-[#2A2820] rounded-full flex items-center justify-center text-[#D8D1B4] font-black text-xl border-2 border-white/20">
              {userProfile.avatar}
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Welcome Back</p>
              <h2 className="text-2xl font-bold tracking-tight">{userProfile.name}</h2>
            </div>
          </div>

          <button 
            onClick={handleResume}
            className="mt-12 bg-[#2A2820] text-[#D8D1B4] px-12 py-4 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-[#4A5D4E] hover:scale-105 transition-all shadow-xl active:scale-95"
          >
            Resume Workspace
          </button>
        </div>

        {/* Bottom Status */}
        <div className="flex justify-center gap-12 opacity-30 text-[9px] font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#4A5D4E] rounded-full"></div> 2 Tasks Pending
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div> System Synced
          </div>
        </div>
      </div>
      
      {/* Background Texture (Radial Gradient) */}
      <div className="absolute inset-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: 'radial-gradient(#C2BC9E 0.8px, transparent 0.8px)', backgroundSize: '24px 24px' }}>
      </div>
    </div>
  );
};

export default WelcomeScreen;