import {react, useState, useEffect, useRef} from 'react';
import Items from '../../Items.jsx';
import { supabase } from '/src/lib/supabase.js';
import {AuthService} from '/src/lib/supabase.js';
import {useAuthStore, useTrackingStore} from '/src/lib/store.js';
import {SkipForward,Settings,RefreshCcw, Play, X} from 'lucide-react';

const Tracking = ({ activeTaskId, activeTaskName, onOpenApp, handleSelectTask }) => {

    // ==== STATES & STORES ====
    const [UserProfile, setUserProfile] = useState({ name: 'Solo Architect', avatar: 'S' });
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    
    const { user } = useAuthStore(); 
    // Lấy state và action từ store
    const { tasks, addTask, setTasks } = useTrackingStore();

    const [loading, setLoading] = useState(true);
    const alarmRef = useRef(new Audio('/assets/sfx/alarm1.mp3'));
    useEffect(() => {
        const fetchProfile = async () => {
            const profile = await AuthService.getCurrentUser();
            if (profile) {
                setUserProfile({
                    name: profile.name || 'User',
                    avatar: (profile.name?.[0] || 'U').toUpperCase(),
                    userEmail: profile.userEmail
                });
            }
        };

        const fetchTasksFromDB = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('pomodoro_cycles')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) setTasks(data); // Đồng bộ vào Zustand Store
            setLoading(false);
        };

        fetchProfile();
        fetchTasksFromDB();
    }, [setTasks]);

    // --- TIMER CORE ---
    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleTimerComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    // --- ACTIONS ---
    const handleTimerComplete = async () => {
        setIsActive(false);
        alarmRef.current.volume = 0.2;
        alarmRef.current.play();

        if (activeTaskId && user) {
            await supabase
                .from('pomodoro_cycles')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('task_id', activeTaskId);
        }
    };

    const toggleTimer = () => {
        // QUICK START LOGIC: Nếu không có task mà bấm Play
        if (!isActive && !activeTaskId) {
            const quickId = self.crypto.randomUUID();
            const quickTitle = `Quick Session ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            
            // Tự động tạo task "vô danh" và đưa vào luồng làm việc
            addTask(quickTitle, user?.id, 25, quickId); 
            handleSelectTask({ id: quickId, title: quickTitle }); 
        }
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        if (window.confirm("Mày có chắc muốn reset lại đồng hồ không?")) {
            setIsActive(false);
            setTimeLeft(25 * 60);
        }
    };

    const skipSession = () => {
        if (window.confirm("Bỏ qua phiên này nhé?")) {
            handleTimerComplete();
            setTimeLeft(25 * 60);
        }
    };

    const formatTime = () => {
        const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const secs = (timeLeft % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };


    return (
        <div className="flex h-[600px] w-[1000px] bg-[#D8D1B4] text-[#2A2820] border-2 border-[#2A2820] rounded-xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(42,40,32,0.1)] font-sans">   
            <aside className="w-64 border-r-2 border-[#2A2820]/10 p-5 flex flex-col bg-[#D2CBB0]">
                <div className="flex items-center gap-3 mb-8 px-1">
                    <div className="w-10 h-10 rounded-full border-2 border-[#2A2820] bg-white flex items-center justify-center font-bold text-lg">{UserProfile.avatar}</div>
                    <div className="overflow-hidden">
                        <div className="text-[10px] font-black uppercase tracking-tighter truncate">{UserProfile.name}</div>
                        <div className="text-[8px] opacity-60 truncate">{UserProfile.userEmail}</div>
                    </div>
                </div>

                <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar">
                    <div className="space-y-1">
                        <button id="tracking-today-btn" className="w-full flex justify-between items-center px-3 py-2 bg-[#2A2820] text-[#D8D1B4] rounded-lg text-[10px] font-bold uppercase tracking-widest">
                            Today <span className="opacity-50">3</span>
                        </button>
                        <button id="tracking-stats-btn" className="w-full text-left px-3 py-2 hover:bg-black/5 rounded-lg text-[10px] font-bold uppercase tracking-widest opacity-40 transition-all">
                            Stats
                        </button>
                    </div>

                    <div className="pt-4">
                        <p className="text-[9px] font-black uppercase opacity-40 mb-3 px-1 tracking-widest">Tasks</p>
                        <div id="task-list-container" className="space-y-1">
                            {loading ? (
                                <div className="p-2.5 text-[10px] opacity-50 animate-pulse uppercase">System fetching...</div>
                            ) : tasks.length > 0 ? (
                                tasks.map((task) => (
                                    <div 
                                        key={task.id}
                                        onClick={() => handleSelectTask(task)}
                                        className={`task-item group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all active:scale-[0.98] border 
                                            ${activeTaskId === task.id 
                                                ? 'bg-[#2A2820] text-white border-[#2A2820]' 
                                                : 'bg-white/20 border-transparent hover:border-[#2A2820]/30'
                                            } ${task.status === 'completed' ? 'opacity-50' : 'opacity-100'}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full border border-[#2A2820] 
                                            ${activeTaskId === task.id ? 'bg-[#4A5D4E] border-white' : 'group-hover:bg-[#4A5D4E]'}`}>
                                        </div>
                                        <span className="text-[10px] font-bold truncate uppercase tracking-tight">
                                            {task.title}
                                        </span>
                                        {task.status === 'completed' && (
                                            <span className="ml-auto text-[8px] font-black opacity-40">[DONE]</span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-2.5 text-[10px] opacity-30 italic uppercase text-center border border-dashed border-[#2A2820]/20 rounded-lg">
                                    No tasks available. Add some fuel.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => onOpenApp('addtaskpopup')} // Mở popup thêm task khi click
                    className="mt-4 w-full border-2 border-dashed border-[#2A2820]/20 py-3 rounded-xl hover:bg-white/50 transition-all text-xl font-light"
                >
                    +
                </button>
            </aside>
            <div className="flex-grow flex relative overflow-hidden">
                <main id="main-content" className="flex-grow p-12 flex flex-col bg-[#F4F1E1]/30 relative">
                    <header className="mb-8">
                        <div className="flex items-center gap-2 mb-2 opacity-30">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Notion Lite</span>
                            <span className="text-[9px]">/</span>
                            <span id="breadcrumb-date" className="text-[9px] font-bold uppercase">MAR 21, 2026</span>
                        </div>
                        <h1 id="active-task-title" className="text-4xl font-black tracking-tighter uppercase italic leading-none">Select a task to start</h1>
                    </header>

                    <section id="task-detail-view" className="flex-grow flex flex-col space-y-8 overflow-y-auto pr-2 custom-scrollbar">          
                        <div className="flex-grow flex flex-col">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-4">Task details / objects</p>
                            <textarea id="task-notes" className="flex-grow w-full bg-transparent border-none p-0 text-sm leading-relaxed resize-none focus:outline-none placeholder:italic font-serif" placeholder="Start writing your thoughts..."></textarea>
                        </div>
                    </section>

                    <footer className="mt-8 pt-6 border-t border-[#2A2820]/5 flex justify-between items-center">
                        <div className="flex gap-6 text-[9px] font-black uppercase opacity-20 hover:opacity-100 transition-all cursor-pointer">
                            <span>Research Doc</span>
                            <span>Assets</span>
                        </div>
                        <button className="px-6 py-3 bg-[#2A2820] text-[#D8D1B4] rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all">
                            ✨ AI Assist
                        </button>
                    </footer>
                </main>

                <aside className="w-72 bg-[#E2E2E2] p-8 flex flex-col border-l-2 border-[#2A2820]/10 relative">
                    <div id="pomo-header" className="mb-10 text-center">
                        <p id="timer-status-text" className="text-[9px] font-black uppercase opacity-40 tracking-[0.2em] mb-1">Action / Timer</p>
                        <div id="timer-set-for" className="text-[8px] font-bold text-[#4A5D4E] uppercase hidden">Timer set for: <span id="target-task-name">---</span></div>
                    </div>
                    
                    <div className="flex-grow flex flex-col items-center justify-center -mt-10">
                        <div id="main-timer-display" className="text-[85px] font-black tracking-tighter leading-none mb-12 tabular-nums">
                            {formatTime()}
                        </div>
                        
                        <div className="w-full space-y-4">
                            <button id="pomo-play-btn" onClick={()=>toggleTimer()} className="w-full py-5 bg-[#2A2820] text-white rounded-2xl shadow-[0px_4px_0px_0px_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center group">
                                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                            <div className="grid grid-cols-3 gap-3">
                                <button id="tracking-timer-skip-btn" onClick={()=>skipSession()} className="py-4 border-2 border-[#2A2820] rounded-2xl flex items-center justify-center hover:bg-white active:bg-black/5 transition-all group" title="Skip Session">
                                    <SkipForward className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </button>

                                <button id="tracking-timer-settings-btn" className="py-4 border-2 border-[#2A2820] rounded-2xl flex items-center justify-center hover:bg-white active:bg-black/5 transition-all group" title="Settings">
                                    <Settings className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                </button>

                                <button id="tracking-timer-reload-btn" onClick={()=>resetTimer()} className="py-4 border-2 border-[#2A2820] rounded-2xl flex items-center justify-center hover:bg-white active:bg-black/5 transition-all group" title="Reload Tasks">
                                    <RefreshCcw className="w-4 h-4 group-hover:rotate-[270deg] transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-8 border-t border-[#2A2820]/10">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">Sessions</p>
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#2A2820]"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-[#2A2820]/20"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-[#2A2820]/20"></div>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-[100px] overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between text-[10px] font-bold opacity-80 bg-white/40 p-2 rounded border border-black/5">
                                <span>Session 1: 25:00</span>
                                <span className="text-green-700 uppercase italic">Done</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold opacity-30 italic p-2">
                                <span>Session 2: 25:00</span>
                                <span>(Planned)</span>
                            </div>
                        </div>
                    </div>
                    <div id="pomo-settings-overlay" className="absolute inset-0 bg-[#E2E2E2] p-8 flex flex-col translate-y-full transition-transform duration-300 ease-in-out z-10">
                        <div className="text-center mb-8">
                            <p className="text-[9px] font-black uppercase opacity-40 tracking-[0.2em]">Configuration</p>
                        </div>

                        <div className="space-y-6 flex-grow">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase opacity-60 ml-1">Focus (Minutes)</label>
                                <input type="number" value="25" min="1" max="90" 
                                    className="w-full bg-white/50 border-2 border-[#2A2820] rounded-xl px-4 py-3 font-black text-xl focus:outline-none focus:bg-white transition-all"/>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase opacity-60 ml-1">Break (Minutes)</label>
                                <input type="number" value="5" min="1" max="30" 
                                    className="w-full bg-white/50 border-2 border-[#2A2820]/30 rounded-xl px-4 py-3 font-black text-xl focus:outline-none focus:bg-white transition-all"/>
                            </div>
                        </div>

                        <div className="space-y-3 mt-auto">
                            <button id="pomo-save-settings" className="w-full py-4 bg-[#2A2820] text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-[#4A5D4E] transition-all">Save Changes</button>
                            <button id="pomo-close-settings" className="w-full py-4 border-2 border-[#2A2820] rounded-xl font-black uppercase text-[10px] tracking-widest opacity-60 hover:opacity-100 transition-all">Cancel</button>
                        </div>
                    </div>

                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
                </aside>

                <div id="stats-overlay" className="absolute inset-0 bg-[#E2E2E2] z-20 translate-x-full transition-transform duration-500 ease-in-out flex flex-col p-12">
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">System / Analytics</p>
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Performance Stats</h2>
                        </div>
                        <button className="p-4 border-2 border-[#2A2820] rounded-2xl hover:bg-white transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-8 flex-grow">
                        <div className="border-2 border-[#2A2820] rounded-3xl p-8 flex flex-col justify-center bg-white/40">
                            <span className="text-[80px] font-black leading-none italic">12</span>
                            <span className="text-[10px] font-black uppercase opacity-40 tracking-widest mt-2">Tasks Completed Today</span>
                        </div>
                        <div className="border-2 border-[#2A2820] rounded-3xl p-8 flex flex-col justify-center bg-[#2A2820] text-[#E2E2E2]">
                            <span className="text-[80px] font-black leading-none italic">08</span>
                            <span className="text-[10px] font-black uppercase opacity-40 tracking-widest mt-2">Focus Sessions (Pomo)</span>
                        </div>
                        <div className="col-span-2 border-2 border-[#2A2820] rounded-3xl p-8 bg-white/20">
                            <p className="text-[10px] font-black uppercase opacity-40 mb-6">Efficiency Graph</p>
                            <div className="h-32 w-full flex items-end gap-2">
                                <div className="flex-1 bg-[#2A2820]/10 h-[40%] rounded-t-sm"></div>
                                <div className="flex-1 bg-[#2A2820]/20 h-[60%] rounded-t-sm"></div>
                                <div className="flex-1 bg-[#2A2820]/40 h-[90%] rounded-t-sm"></div>
                                <div className="flex-1 bg-[#2A2820] h-[75%] rounded-t-sm"></div>
                                <div className="flex-1 bg-[#2A2820]/60 h-[50%] rounded-t-sm"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
    
};




export default Tracking;