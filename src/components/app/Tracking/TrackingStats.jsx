import React, { useState, useEffect } from 'react';
import { supabase } from '/src/lib/supabase.js';
import { useAuthStore } from '/src/lib/store.js';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const TrackingStats = ({ onOpenApp }) => {
    const { user: storeUser } = useAuthStore(); // Lấy user từ store làm nền tảng
    const [stats, setStats] = useState({ finished: 0, skipped: 0 });
    const [loading, setLoading] = useState(true);

    const last7DaysData = [
        { date: 'Mon', finished: 3, skipped: 1 },
        { date: 'Tue', finished: 5, skipped: 0 },
        { date: 'Wed', finished: 2, skipped: 2 },
        { date: 'Thu', finished: 6, skipped: 1 },
        { date: 'Fri', finished: 4, skipped: 3 },
        { date: 'Sat', finished: 7, skipped: 0 },
        { date: 'Sun', finished: 1, skipped: 1 },
    ];

    const maxVal = Math.max(...last7DaysData.map(d => Math.max(d.finished, d.skipped)), 1);

    // 🔥 HỢP NHẤT LOGIC: FETCH DATA BAN ĐẦU + KHỞI TẠO REALTIME CHUẨN BACKEND
    useEffect(() => {
        let isMounted = true;
        let activeChannel = null;

        const initializeStatsSystem = async () => {
            // 1. Kiểm tra session trực tiếp từ Supabase để dự phòng tối đa việc Zustand chưa load kịp
            const { data: authData } = await supabase.auth.getUser();
            const currentUser = authData?.user || storeUser;

            if (!currentUser?.id) {
                //console.log("⏳ [Stats Backend] Chưa tìm thấy session user hợp lệ, đang chờ...");
                return;
            }

            //console.log("✅ [Stats Backend] Đã xác định User ID:", currentUser.id);

            // 2. FETCH DATA BAN ĐẦU: Đọc giá trị mới nhất từ ổ cứng DB nạp lên DOM
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('finishedTasks, skippedSession')
                    .eq('id', currentUser.id)
                    .maybeSingle();

                if (error) throw error;

                if (data && isMounted) {
                    setStats({
                        finished: data.finishedTasks || 0,
                        skipped: data.skippedSession || 0 
                    });
                }
            } catch (err) {
                console.error('🚨 [Stats Fetch Error]:', err.message);
            } finally {
                if (isMounted) setLoading(false);
            }

            // 3. KÍCH HOẠT REALTIME: Mở ống dẫn WebSocket lắng nghe thay đổi
            //console.log("🔌 [Realtime] Đang mở kết nối lắng nghe bảng profiles...");
            // Use a unique channel name per mount to avoid adding callbacks to an
            // already-subscribed channel (prevents "cannot add callbacks after subscribe" errors)
            const channelName = `stats-realtime-channel-${currentUser.id}-${Math.random().toString(36).slice(2,9)}`;
            activeChannel = supabase
                .channel(channelName)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE', // Chỉ nghe lệnh cải tiến giá trị dữ liệu
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${currentUser.id}`
                    },
                    (payload) => {
                        //console.log('🔔 [Realtime Stats] Nhận tín hiệu DB cập nhật:', payload);
                        const newData = payload.new;
                        if (!newData || !isMounted) return;

                        // ÉP REACT TỰ VẼ LẠI VIRTUAL DOM THỜI GIAN THỰC
                        setStats((prev) => {
                            const updated = { ...prev };
                            if (newData.finishedTasks !== undefined) {
                                updated.finished = newData.finishedTasks;
                            }
                            if (newData.skippedSession !== undefined) {
                                updated.skipped = newData.skippedSession;
                            }
                            return updated;
                        });
                    }
                );
                activeChannel.subscribe((status) => {
                //console.log(`📡 [Realtime Connection Status]: ${status}`);
            });    
        };

        initializeStatsSystem();

        // 📦 CLEANUP FUNCTION: Triệt tiêu rò rỉ bộ nhớ khi người dùng tắt tab stats
        return () => {
            isMounted = false;
            if (activeChannel) {
                //console.log("🔌 [Backend] Đã đóng đường truyền Realtime của màn Thống kê.");
                supabase.removeChannel(activeChannel);
            }
        };
    }, [storeUser?.id]); // Trọng tâm theo dõi ID người dùng thay đổi

    return (
        <div className="w-full h-full flex flex-col p-6 bg-[#E2E2E2] overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
            <div className="mb-6">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">System / Analytics</p>
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-[#2A2820]">Performance Stats</h2>
            </div>

            {loading ? (
                <div className="flex-grow flex flex-col items-center justify-center gap-2 py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[#2A2820]" />
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Syncing metrics...</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6 flex-grow justify-center max-w-2xl mx-auto w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        {/* CARD 1: COMPLETED */}
                        <div className="border-2 border-[#2A2820] rounded-2xl p-5 bg-[#F4F1E1] shadow-[4px_4px_0px_0px_rgba(42,40,32,1)] transition-all relative overflow-hidden">
                            <span className="text-5xl font-black leading-none italic tracking-tighter text-[#2A2820] block select-none">
                                {String(stats.finished).padStart(2, '0')}
                            </span>
                            <span className="text-[12px] font-black uppercase opacity-60 tracking-wider mt-3 block border-t border-[#2A2820]/10 pt-2">
                                Tasks I have completed so far
                            </span>
                        </div>

                        {/* CARD 2: SKIPPED */}
                        <div className="border-2 border-[#2A2820] rounded-2xl p-5 bg-[#2A2820] text-[#E2E2E2] shadow-[4px_4px_0px_0px_rgba(216,209,180,1)] transition-all relative overflow-hidden">
                            <span className="text-5xl font-black leading-none italic tracking-tighter text-[#D8D1B4] block select-none">
                                {String(stats.skipped).padStart(2, '0')}
                            </span>
                            <span className="text-[12px] font-black uppercase opacity-40 tracking-wider mt-3 block border-t border-white/10 pt-2">
                                Total tasks I skipped
                            </span>
                        </div>
                    </div>

                    {/* CHART AREA */}
                    <div className="border-2 border-[#2A2820] rounded-2xl p-5 bg-[#F0EDDE] shadow-[4px_4px_0px_0px_rgba(42,40,32,1)] w-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#2A2820]">7-Day Execution History</h3>
                            <div className="flex gap-3 text-[8px] font-black uppercase">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-[#4A5D4E] border border-[#2A2820]"></div>
                                    <span className="opacity-60">Done</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-red-400 border border-[#2A2820]"></div>
                                    <span className="opacity-60">Skip</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2 items-end h-28 border-b-2 border-[#2A2820] pb-1 px-2">
                            {last7DaysData.map((d, index) => (
                                <div key={index} className="flex flex-col items-center justify-end h-full w-full group relative">
                                    <div className="absolute -top-8 bg-[#2A2820] text-white font-mono text-[7px] px-1.5 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                                        ✓{d.finished} · ✕{d.skipped}
                                    </div>
                                    <div className="flex items-end gap-1 w-full justify-center h-full">
                                        <div className="w-2.5 sm:w-4 bg-[#4A5D4E] border border-[#2A2820] rounded-t-sm" style={{ height: `${(d.finished / maxVal) * 100}%` }}></div>
                                        <div className="w-2.5 sm:w-4 bg-red-400 border border-[#2A2820] rounded-t-sm" style={{ height: `${(d.skipped / maxVal) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* FIX ĐIỂM HIỂN THỊ THỨ: Đổi từ d.day sang d.date */}
                        <div className="grid grid-cols-7 gap-2 pt-2 text-center">
                            {last7DaysData.map((d, index) => (
                                <span key={index} className="text-[8px] font-black uppercase text-[#2A2820] opacity-50">
                                    {d.date} 
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            <div className="mt-auto text-center pt-4 border-t border-[#2A2820]/5 opacity-20 text-[8px] font-black uppercase tracking-[0.15em]">
                Aegis Core — Raw Efficiency.
            </div>
        </div>
    );
};

export default TrackingStats;