import {react, useState, useEffect, useRef} from 'react';
import Items from '../../Items.jsx';
import { supabase } from '/src/lib/supabase.js';
import {AuthService} from '/src/lib/supabase.js';
import {useAuthStore, useTrackingStore} from '/src/lib/store.js';
import {SkipForward,Settings,RefreshCcw, Play, X, Pause} from 'lucide-react';
import { div } from 'framer-motion/client';

const Tracking = ({onOpenApp}) => {
    //CONFIGURATION
    const PRODUCTIVE_OS_EXT_ID = "daanfikdjingdknbgmfgkdaedgblajen";
    //User
    const [countSkip, setcountSkip] = useState(0);
    const [countFinish, setCountFinish] = useState(0);
    const [countStreaks, setCountStreaks] = useState(0);
    // ==== STATES & STORES ====
    const [UserProfile, setUserProfile] = useState({ name: 'Solo Architect', avatar: 'S' });
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const { user } = useAuthStore(); 
    // Lấy state và action từ store
    const { tasks, setTasks, addTask } = useTrackingStore();
    const [activeTask, setActiveTask] = useState({ id: null, title: "Select a task to start" });

    const [loading, setLoading] = useState(true);
    const alarmRef = useRef(null);
    const timerRef = useRef(null);
    const endTimeRef = useRef(null);
    // hover
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, taskId: null });

    const handleContextMenu = (e, task) => {
        e.preventDefault(); // Ngăn menu mặc định của trình duyệt hiện lên
        
        // Tính toán tọa độ để panel hiện ngay đầu con trỏ
        setContextMenu({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            taskId: task.id
        });
    };

    const closeContextMenu = () => setContextMenu({ ...contextMenu, visible: false });


    // IMPORTANT: SUPABASE REALTIME
    useEffect(() => {
        let channel = null;
        let isMounted = true;

        const initRealtime = async () => {
            let activeUserId = user?.id;
            if (!activeUserId) {
                const { data: authData } = await supabase.auth.getUser();
                activeUserId = authData?.user?.id;
            }
            if (!activeUserId || !isMounted) return;

            console.log("Realtime started on unified channel for user:", activeUserId);

            // 1. Khởi tạo một Channel hợp nhất duy nhất
            channel = supabase
                .channel('schema-db-changes') 
                
                // ─── SỰ KIỆN 1: THEO DÕI BẢNG PROFILES (STATS CHÍNH) ───
                .on(
                    'postgres_changes', 
                    {
                        event: 'UPDATE', 
                        schema: 'public', 
                        table: 'profiles', 
                        filter: `id=eq.${activeUserId}`
                    },
                    (payload) => {
                        console.log('🔔 [Realtime Profiles]:', payload);
                        
                        const newData = payload.new;
                        if (!newData) return;

                        // Coerce undefined/null values to 0 to keep state deterministic
                        const updatedFinished = newData.finishedTasks ?? 0;
                        const updatedSkipped = newData.skippedSession ?? 0;
                        const updatedStreaks = newData.streaks ?? 0;

                        setCountFinish(updatedFinished);
                        setcountSkip(updatedSkipped);
                        setCountStreaks(updatedStreaks);
                    }
                )
                
                // ─── SỰ KIỆN 2: THEO DÕI BẢNG POMODORO_CYCLES (TASKS LIST) ───
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'pomodoro_cycles',
                        filter: `user_id=eq.${activeUserId}`
                    },
                    (payload) => {
                        console.log('🔔 [Realtime Tasks]:', payload);
                        
                        const newData = payload.new;
                        
                        if (!newData) {
                            console.log('🗑️ Một tác vụ vừa bị xóa hoàn toàn khỏi hệ thống.');
                            return; 
                        }

                        if (newData.status === 'completed') {
                            setLoading(true);
                            useTrackingStore.getState().fetchTasks()
                            setTimeout(() => setLoading(false), 500);
                        }
                    }
                )
                .subscribe(); // 3. Bật công tắc kích hoạt đường truyền công nghệ WebSocket
        };

        initRealtime();

        return () => {
            isMounted = false;
            if (channel) {
                console.log("🔌 [Backend] Đã đóng đường truyền Realtime Channel.");
                supabase.removeChannel(channel);
            }
        };
    }, [user?.id]); // Chỉ phụ thuộc vào ID duy nhất của user



    // Đóng menu khi click ra ngoài
    useEffect(() => {
        window.addEventListener('click', closeContextMenu);
        return () => window.removeEventListener('click', closeContextMenu);
    }, []);

    useEffect(() => {
        const audioUrl = `${import.meta.env.BASE_URL}sfx/alarm1.mp3`;
        const audio = new Audio(audioUrl);
        audio.volume = 0.2;
        audio.preload = 'auto';

        audio.addEventListener('error', (event) => {
            console.error('Alarm audio load error:', event);
            console.error('Alarm src:', audio.src);
            console.error('canPlayType:', audio.canPlayType('audio/mpeg'));
        });

        alarmRef.current = audio;
        return () => {
            audio.pause();
            audio.src = '';
        };
    }, []);

    // core logic 
    useEffect(() => {
        const fetchProfile = async () => {
            // 1. Lấy profile cơ bản
            const profile = await AuthService.getCurrentUser();
            if (profile) {
                setUserProfile({
                    name: profile.name || 'User',
                    avatar: (profile.name?.[0] || 'U').toUpperCase(),
                    userEmail: profile.userEmail,
                });
            }

            // 2. Lấy session hiện tại để lấy ID an toàn
            const { data: authData } = await supabase.auth.getUser();
            const currentUser = authData?.user; // Dùng optional chaining để tránh lỗi

            if (currentUser) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('skippedSession, finishedTasks, focusStreaks')
                    .eq('id', currentUser.id) // Dùng currentUser.id thay vì user.id
                    .single();

                if (!error && data) {
                    const finishedVal = data?.finishedTasks ?? 0;
                    const skippedVal = data?.skippedSession ?? 0;
                    const streaksVal = data?.focusStreaks ?? 0;

                    setcountSkip(skippedVal);
                    setCountFinish(finishedVal);
                    setCountStreaks(streaksVal);

                    // debug log with coerced values to avoid showing `undefined`
                    console.log('profile load', {
                        finishedTasks: finishedVal,
                        skippedSession: skippedVal,
                        focusStreaks: streaksVal,
                        stateCountFinish: finishedVal,
                        stateCountSkip: skippedVal,
                    });
                } else {
                    console.error("Lỗi fetch profiles:", error?.message);
                }
            } else {
                console.warn("Chưa tìm thấy user session, Architect!");
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
        if (!isActive) {
            endTimeRef.current = null;
            return;
        }

        if (!endTimeRef.current) {
            endTimeRef.current = Date.now() + timeLeft * 1000;
        }

        const tick = () => {
            const remainingMs = Math.max(0, endTimeRef.current - Date.now());
            const nextTimeLeft = Math.ceil(remainingMs / 1000);

            setTimeLeft((prev) => {
                if (prev === nextTimeLeft) return prev;
                return nextTimeLeft;
            });

            if (remainingMs <= 0) {
                endTimeRef.current = null;
                setIsActive(false);
                handleTimerComplete();
                return;
            }

            timerRef.current = window.setTimeout(tick, 250);
        };

        timerRef.current = window.setTimeout(tick, 250);
        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, [isActive]);

    // --- ACTIONS ---
    const handleTimerComplete = async () => {
        setIsActive(false);
        stopFocusSession(); // Gọi extension để dừng session
        if (alarmRef.current) {
            alarmRef.current.volume = 0.2;
            alarmRef.current.play().catch((error) => {
                console.error('Alarm playback failed:', error);
            });
        }

        // --- ĐOẠN ĐÃ SỬA: TÁCH BIỆT ĐỂ BẢO VỆ DATA ---
        const { data: authData } = await supabase.auth.getUser();
        const activeUser = authData?.user || user; // Nếu lấy từ DB không kịp thì fallback về store
        // 1. Kiểm tra User trước (Điều kiện bắt buộc để đụng vào DB)
        if (!activeUser) {
            console.error('🚨 [Backend] Không tìm thấy User session. Hủy toàn bộ tiến trình lưu DB.');
            return;
        }

        // 2. Cập nhật UI trước cho mượt
        const currentCount = Number.isFinite(countFinish) ? countFinish : 0;
        const currentStreaksCount = Number.isFinite(countStreaks) ? countStreaks : 0;
        const nextCount = currentCount + 1;
        const nextStreaks = currentStreaksCount + 1;
        setCountFinish(nextCount);
        setCountStreaks(nextStreaks);
        console.log('session updated ->', nextCount, '(previous countFinish:', countFinish, ')');
        
        try {
            // Tạo mảng chứa các Promise cần chạy
            const promises = [];

            // Nếu có gắn với Task cụ thể -> Thêm lệnh cập nhật chu kỳ vào hàng đợi
            if (activeTask && activeTask.id) {
                console.log(`[Backend] Ghi nhận hoàn thành cho task ID: ${activeTask.id}`);
                promises.push(
                    supabase
                        .from('pomodoro_cycles')
                        .update({ status: 'completed', completed_at: new Date().toISOString() })
                        .eq('id', activeTask.id)
                );
            } else {
                console.warn('⚠️ [Backend] Chạy Timer tự do (Không có Task ID). Bỏ qua update pomodoro_cycles.');
            }

            // Luôn luôn thêm lệnh cập nhật Profile của User
            promises.push(
                supabase
                    .from('profiles')
                    .update({ finishedTasks: nextCount, focusStreaks: nextStreaks }) // Tăng streaks lên 1 mỗi khi hoàn thành
                    .eq('id', activeUser.id)
            );

            // Chạy song song các lệnh hợp lệ
            const results = await Promise.all(promises);

            // Kiểm tra xem có lệnh nào bị lỗi không
            results.forEach((res, index) => {
                if (res.error) throw new Error(`Lệnh thứ ${index + 1} thất bại: ${res.error.message}`);
            });

            console.log(`Updated DB successfully for user ${activeUser.id}. Total finished tasks: ${nextCount}`);
            logFocusTime(activeUser.id, 25); // Gọi hàm log thời gian tập trung vào bảng focus_stats


        } catch (dbError) {
            // Hoàn tác (Rollback) UI nếu lỗi rớt mạng/DB sập
            setCountFinish(Number.isFinite(countFinish) ? countFinish : 0);
            console.error(dbError.message);
            alert('An error occurred');
        }
    };

    const toggleTimer = () => {
        // QUICK START LOGIC: Nếu không có task mà bấm Play
        startFocusSession(); // Gọi extension để bắt đầu session
        if (!isActive && !activeTask.id) {
            const quickId = self.crypto.randomUUID();
            const quickTitle = `Quick Session ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            
            // Tự động tạo task "vô danh" và đưa vào luồng làm việc
            addTask({
                id: quickId,
                title: quickTitle,
                user_id: user?.id,
                duration_minutes: 25,
                status: 'pending',
                created_at: new Date().toISOString()
            });
            handleSelectTask({ id: quickId, title: quickTitle }); 
        }
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        if (window.confirm("Mày có chắc muốn reset lại đồng hồ không?")) {
            setIsActive(false);
            stopFocusSession(); // Gọi extension để dừng session
            // Tìm cái task có ID trùng với task đang active
            const currentTask = tasks.find(t => t.id === activeTask.id);

            if (currentTask) {
                // Nếu tìm thấy, lấy duration của nó nhân 60 giây
                setTimeLeft(currentTask.duration_minutes * 60);
            } else {
                // Nếu không thấy (hoặc chưa chọn task), về mặc định 25p
                setTimeLeft(25 * 60);
            }
        }
    };

    const skipSession = async () => {
        if (window.confirm("Bỏ qua phiên này nhé?")) {
            setIsActive(false);
            console.log('prev: ',countSkip);
            const nextCount = countSkip + 1;
            setcountSkip(nextCount);
            console.log('session skipped', countSkip);
            setTimeLeft(25 * 60);

            // Lấy lại user một lần nữa cho chắc
            const { data: { user: currentUser } } = await supabase.auth.getUser();


            if (currentUser) {
                try{
                    const promise = [
                        supabase
                            .from('profiles')
                            .update({ skippedSession: nextCount }) // Cột trong ảnh là skippedSession
                            .eq('id', currentUser.id),
                        supabase
                            .from('pomodoro_cycles')
                            .update({ status: 'completed', completed_at: new Date().toISOString() })
                            .eq('id', activeTask.id)
                    ]

                    const results = await Promise.all(promise);
                    results.forEach((res, index) => {
                        if (res.error) throw new Error(`Lệnh thứ ${index + 1} thất bại: ${res.error.message}`);
                    });

                    console.log("✅ Cập nhật cả 2 bảng thành công!");
                }catch(error){
                    console.error(error.message);
                }
            } else {
                console.error("Lỗi: Không tìm thấy user để update DB");
            }
        }
    };

    const formatTime = () => {
        
        const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const secs = (timeLeft % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const handleSelectTask = (task) => {
        setActiveTask({
            id: task.id || task.task_id,
            title: task.title
        });
        setTimeLeft(task.duration_minutes ? task.duration_minutes * 60 : 25 * 60);
        setIsActive(false);
    };

    // Danger zone

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Xóa bản ghi này khỏi hệ thống, Architect?")) return;

        try {
            // 2. Xóa trên Database (Supabase)
            const { error } = await supabase
                .from('pomodoro_cycles')
                .delete()
                .eq('id', taskId);

            if (error) throw error;

            // 3. Xóa trên UI thông qua Store
            useTrackingStore.getState().fetchTasks()

            // 4. Nếu xóa trúng task đang chọn thì reset hiển thị chính
            if (activeTask.id === taskId) {
                handleSelectTask({ id: null, title: "Select a task to start" });
            }
            setTimeLeft(25 * 60);
            // 5. Đóng context menu sau khi xóa xong
            setContextMenu({ ...contextMenu, visible: false });

        } catch (error) {
            console.error("Lỗi hệ thống khi xóa:", error.message);
            alert("Không thể xóa task. Kiểm tra lại kết nối!");
        }
    };

    // Extension communicate
    const startFocusSession = () => {
        if (window.chrome && chrome.runtime) {
            chrome.runtime.sendMessage(PRODUCTIVE_OS_EXT_ID, { action: "START_FOCUS" }, (response) => {
            console.log("Extension phản hồi:", response?.status);
            });
        } else {
            console.warn("User chưa cài Chrome Extension chặn tab rác của Productive OS.");
        }
    };

    const stopFocusSession = () => {
        if (window.chrome && chrome.runtime) {
            chrome.runtime.sendMessage(PRODUCTIVE_OS_EXT_ID, { action: "STOP_FOCUS" }, (response) => {
            console.log("Extension phản hồi:", response?.status);
            });
        }
    };

    const logFocusTime = async (userId, minutes) => {
        const today = new Date().toISOString().split('T')[0]; // Lấy ngày dạng YYYY-MM-DD

        // Chiêu thức UPSERT bọc thép
        const { data, error } = await supabase
            .from('focus_stats')
            .upsert(
            { user_id: userId, date: today, total_minutes: minutes },
            { onConflict: 'user_id,date' }
            )
            .select();
            
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
                        <button 
                            onClick={() => onOpenApp('addtrackingstats')}
                            className="w-full text-left px-3 py-2 hover:bg-black/5 rounded-lg text-[10px] font-bold uppercase tracking-widest opacity-40 transition-all">
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
                                        onContextMenu={(e) => handleContextMenu(e, task)}
                                        onClick={() => {
                                            if (task.status === 'completed') return; // Chặn đứng chuột trái tại đây!
                                            handleSelectTask(task);
                                        }}
                                        className={`task-item group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all active:scale-[0.98] border 
                                            ${activeTask.id === task.id 
                                                ? 'bg-[#2A2820] text-white border-[#2A2820]' 
                                                : 'bg-white/20 border-transparent hover:border-[#2A2820]/30'
                                            } ${task.status === 'completed' ? 'opacity-50' : 'opacity-100'}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full border border-[#2A2820] 
                                            ${activeTask.id === task.id ? 'bg-[#4A5D4E] border-white' : 'group-hover:bg-[#4A5D4E]'}`}>
                                        </div>
                                        <span className="text-[10px] font-bold truncate uppercase tracking-tight">
                                            {task.title}
                                        </span>
                                        {task.status === 'completed' && (
                                            <span className="ml-auto text-[8px] font-black opacity-40 ">[DONE]</span>
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
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-[0.9] break-words line-clamp-2 max-w-full">
                            {activeTask.title}
                        </h1>
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
                        <div id="timer-set-for" className="text-[8px] font-bold text-[#4A5D4E] uppercase hidden">
                            Timer set for: {activeTask.title}
                        </div>
                    </div>
                    
                    <div className="flex-grow flex flex-col items-center justify-center -mt-10">
                        <div id="main-timer-display" className="text-[85px] font-black tracking-tighter leading-none mb-12 tabular-nums min-w-[240px] text-center">
                            {formatTime()}
                        </div>
                        
                        <div className="w-full space-y-4">
                            <button 
                                id="pomo-play-btn" 
                                onClick={() => toggleTimer()} 
                                className="w-full py-5 bg-[#2A2820] text-white rounded-2xl shadow-[0px_4px_0px_0px_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center group"
                            >
                                {/* ĐỔI ICON ĐỘNG DỰA VÀO STATE ISACTIVE */}
                                {isActive ? (
                                    <Pause className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                ) : (
                                    <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                )}
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
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
                </aside>
            </div>
            {/* ==== FLOATING CONTEXT MENU ==== */}
            {contextMenu.visible && (
                <div 
                    className="fixed z-[1000] bg-[#2A2820] border border-white/10 rounded-lg shadow-2xl py-1.5 w-36 overflow-hidden animate-in fade-in zoom-in duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <div className="px-3 py-1 border-b border-white/5 mb-1">
                        <p className="text-[7px] font-black opacity-40 uppercase tracking-widest">Task Action</p>
                    </div>
                    
                    <button 
                        onClick={() => { /* Logic Edit */ }}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold text-[#D8D1B4] hover:bg-white/10 transition-colors uppercase"
                    >
                        Rename Task
                    </button>
                    
                    <button 
                        onClick={() => handleDeleteTask(contextMenu.taskId)}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold text-red-400 hover:bg-red-500/20 transition-colors uppercase"
                    >
                        Delete Task
                    </button>
                </div>
            )}
        </div>
    );   
};




export default Tracking;