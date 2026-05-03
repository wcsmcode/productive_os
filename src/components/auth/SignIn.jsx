import React, { useState, useEffect, use } from 'react';
import { AuthService } from '/src/lib/supabase'; // Nhớ import client của mày
import {UserRound} from 'lucide-react';
import {useAuthStore} from '/src/lib/store.js';
const SignIn = () => {
    const setcurrentState = useAuthStore((state) => state.setcurrentState);
    const [now, setnow] = useState(new Date());
    useEffect(() => {
    // 2. Thiết lập bộ đếm giây
        const timer = setInterval(() => {
        setnow(new Date());
        }, 1000); // Cập nhật mỗi giây để chính xác tuyệt đối

        // 3. Quan trọng: Dọn dẹp bộ nhớ khi tắt component
        return () => clearInterval(timer);
    }, []);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const dateString = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
    });

    // 1. Quản lý trạng thái màn hình (Locked -> Login)
    const [isLocked, setIsLocked] = useState(true);
    
    // 2. Quản lý input đăng nhập
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // 3. Hàm xử lý đăng nhập với Supabase
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const { error } = await AuthService.signIn(email, password);

        if (error) alert(error.message);
        else{
            setcurrentState('Authorized');
        }
        setLoading(false);
        
    };

    return (
    <div className="relative h-screen w-full bg-[#E4DFC8] text-[#2A2820] overflow-hidden flex items-center justify-center font-mono">
      
      {/* MÀN HÌNH KHÓA (Lock Screen) */}
      <div 
        className={`absolute inset-0 z-20 flex flex-col justify-between p-12 transition-all duration-700 cursor-pointer
          ${!isLocked ? 'opacity-0 pointer-events-none translate-y-[-20px]' : 'opacity-100'}`}
        onClick={() => setIsLocked(false)}
      >
        <div className="flex justify-between items-start opacity-60">
          <div className="text-[10px] tracking-[0.3em] uppercase">
            System: Productive_OS_v1.0.4<br/>Status: Awaiting_Initialization
          </div>
          <div className="text-right text-[10px] tracking-[0.3em] uppercase">
            Uptime: 99.9% <br/>Secure_Node: SEA-01
          </div>
        </div>

        <div className="text-center select-none">
          <h1 className="font-sans text-[12rem] font-black tracking-tighter leading-none">
            {hours}:{minutes < 10 ? `0${minutes}` : minutes}
          </h1>
          <p className="text-xl font-bold uppercase tracking-[0.4em] opacity-40 mt-4">
            {dateString.toUpperCase()}
          </p>
        </div>

        <div className="text-center space-y-6">
          <p className="max-w mx-auto italic text-sm opacity-50">
            "He who has a why to live can bear almost any how."
          </p>
          <p className="max-w-md mx-auto italic text-sm opacity-50">
            — F. Nietzsche —
          </p>
          <div className="text-[10px] font-[1000] font-sans uppercase tracking-[0.5em] animate-pulse">
            Click to Initialize System
          </div>
        </div>
      </div>

      {/* GIAO DIỆN ĐĂNG NHẬP (Login Interface) */}
      <div className={`relative z-10 transition-all duration-500 flex flex-col items-center
        ${isLocked ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
        
        <div className="w-24 h-24 bg-[#2A2820] rounded-full flex items-center justify-center mb-6 shadow-2xl border-4 border-[#E4DFC8]">
          <UserRound size={50} strokeWidth={2} color="var(--accent-soft)"/>
        </div>

        <h2 className="text-2xl font-sans font-black uppercase tracking-tighter mb-8 italic">Solo Architect</h2>
        
        <form onSubmit={handleLogin} className="flex flex-col space-y-4">
          <input 
            type="email" 
            placeholder="ACCESS_ID"
            className="w-80 p-3 bg-white/50 border border-[#2A2820] rounded text-xs font-bold uppercase focus:outline-none focus:bg-white transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="SECURE_PASS"
            className="w-80 p-3 bg-white/50 border border-[#2A2820] rounded text-xs font-bold uppercase focus:outline-none focus:bg-white transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button 
            
            disabled={loading}
            className="w-full p-3 bg-[#2A2820] text-[#D8D1B4] font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-1 active:translate-y-1"
          >
            {loading ? 'AUTHENTICATING...' : 'INITIALIZE_SESSION'}
          </button>
        </form>
        <div className="mt-6 flex gap-4 opacity-40 text-[10px] font-bold uppercase tracking-widest">
            <button onClick={() => setcurrentState('Register')} className="hover:opacity-100 transition cursor-pointer" >Create an account</button>
            <span>|</span>
            <button className="hover:opacity-100 transition cursor-pointer">Forgot Key</button>
        </div>
      </div>

    </div>
  );
};

export default SignIn;