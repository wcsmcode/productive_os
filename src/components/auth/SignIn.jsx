import {react, useSate, useEffect, UseRef} from 'react';

const SignIn = () => {
    return(
        <>
            <div id="lock-screen"  className="absolute inset-0 z-20 flex flex-col justify-between p-12 transition-all duration-700 cursor-pointer">
            
            <div  className="flex justify-between items-start opacity-60">
                <div  className="font-mono text-[10px] tracking-[0.3em] uppercase">
                    System: Productive_OS_v1.0.4
                    Status: Awaiting_Initialization
                </div>
                <div  className="text-right font-mono text-[10px] tracking-[0.3em] uppercase">
                    Uptime: 99.9% 
                    Secure_Node: SEA-01
                </div>
            </div>

            <div  className="text-center select-none">
                <h1 id="clock"  className="text-[12rem] font-black tracking-tighter leading-none">08:26</h1>
                <p id="date"  className="text-xl font-bold uppercase tracking-[0.4em] opacity-40 mt-4">Thursday, March 19</p>
            </div>

            <div  className="text-center space-y-6">
                <p  className="max-w-md mx-auto italic text-sm opacity-50">
                    "He who has a why to live can bear almost any how." — F. Nietzsche
                </p>
                <div  className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">
                    Click to Initialize System
                </div>
            </div>
        </div>

        <div id="login-interface"  className="relative z-10 opacity-0 scale-95 transition-all duration-500 pointer-events-none flex flex-col items-center">
            
            <div  className="w-24 h-24 bg-[#2A2820] rounded-full flex items-center justify-center mb-6 shadow-2xl border-4 border-[#E4DFC8]">
                <span  className="text-[#D8D1B4] font-black text-2xl tracking-tighter">DEV</span>
            </div>

            <h2  className="text-2xl font-black uppercase tracking-tighter mb-8">Solo Architect</h2>
            <div  className="glass-panel p-2 rounded-lg flex items-center w-80 shadow-xl">
                
            </div>
             
            <div  className="glass-panel p-2 rounded-lg flex items-center w-80 shadow-xl">
               
            
            </div>

            <div  className="mt-6 flex gap-4 opacity-40 text-[10px] font-bold uppercase tracking-widest">
                
            </div>
        </div>

        <div  className="absolute bottom-6 right-8 flex items-center gap-6 opacity-30 pointer-events-none">
            <div  className="w-4 h-4 bg-[#2A2820] rounded-full"></div>
            <div  className="w-4 h-4 bg-[#2A2820] rounded-full opacity-50"></div>
        </div>
        </>
    )
}

export default SignIn;