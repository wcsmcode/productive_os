import {React, useState} from 'react';
import { supabase } from '/src/lib/supabase'; // Đường dẫn file khởi tạo supabase của mày
import { div } from 'framer-motion/client';
import {useAuthStore} from '/src/lib/store.js';

const Register = () => {
    const setcurrentState = useAuthStore((state) => state.setcurrentState);
    return (
        <div className="paper-bg text-[#2A2820] font-sans h-screen flex items-center justify-center p-6">

            <div className="max-w-md w-full">
                <div className="mb-12 text-center">
                    <div className="inline-block w-12 h-12 bg-[#2A2820] rounded mb-6 flex items-center justify-center">
                        <div className="w-2 h-2 bg-[#D8D1B4] animate-pulse"></div>
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Create New Identity</h1>
                    <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Protocol: User_Initialization_v1</p>
                </div>

                <form action="#" className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest">Full Name</label>
                        <input type="text" placeholder="e.g. Marcus Aurelius" 
                            className="w-full bg-transparent border-2 border-[#2A2820]/10 rounded-xl px-5 py-4 text-sm font-bold outline-none border-[#2A2820] focus:border-[#4A5D4E] transition-all"/>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest">Architecture ID (Email)</label>
                        <input type="email" placeholder="dev@productive-os.com" 
                            className="w-full bg-transparent border-2 border-[#2A2820]/10 rounded-xl px-5 py-4 text-sm font-bold outline-none focus:border-[#4A5D4E] transition-all"/>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest">Access Key (Password)</label>
                        <input type="password" placeholder="••••••••••••" 
                            className="w-full bg-transparent border-2 border-[#2A2820]/10 rounded-xl px-5 py-4 text-sm font-bold outline-none focus:border-[#4A5D4E] transition-all"/>
                    </div>

                    <div className="pt-4">
                        <button type="submit" className="w-full bg-[#2A2820] text-[#D8D1B4] py-5 rounded-xl font-black text-xs uppercase tracking-[0.3em] hover:bg-[#4A5D4E] transition-all shadow-lg">
                            Deploy Identity
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
                        Already registered? <a onClick={() => setcurrentState('SignIn')} className="text-[#2A2820] underline font-black hover:cursor-pointer">Authorize Session</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;