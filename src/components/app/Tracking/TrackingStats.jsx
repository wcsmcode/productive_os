import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '/src/lib/supabase.js';
import { useAuthStore } from '/src/lib/store.js';
import { Loader2, Flame } from 'lucide-react';

const TrackingStats = ({ onOpenApp }) => {
    const { user: storeUser } = useAuthStore(); // Lấy user từ store làm nền tảng
    const [stats, setStats] = useState({ finished: 0, skipped: 0});
    const [heatmapData, setHeatmapData] = useState([]); // Mảng lưu trữ dữ liệu ô vuông [date, total_minutes]
    const [loading, setLoading] = useState(true);
    const [currentStreak, setCurrentStreak] = useState(0); // Chuỗi ngày hiện tại để làm tính năng kích thích

    // 🌟 HELPER BỌC THÉP: Tự động tính toán mảng 365 ngày trước tính từ hôm nay đổ ngược về (Đã sửa để canh chỉnh tuần)

    // Định nghĩa bảng màu Brutalism đồng bộ với hệ sinh thái Productive OS
    const getColorClass = (minutes) => {
        if (!minutes) return 'bg-[#EAE6DF] border-[#C8C2B7]/40'; // Ngày lười biếng, xám mộc
        if (minutes < 25) return 'bg-[#C2F0C2] border-[#2A2820]'; // Cấp 1
        if (minutes < 75) return 'bg-[#70DB70] border-[#2A2820]'; // Cấp 2
        if (minutes < 150) return 'bg-[#33CC33] border-[#2A2820]'; // Cấp 3
        return 'bg-[#1F991F] border-[#2A2820]'; // Cấp 4: Thần sấm năng suất
    };

    const monthlyHeatmap = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const monthsStructure = [];

        // Ép dữ liệu thô về Object Map { 'YYYY-MM-DD': total_minutes }
        const statsMap = heatmapData.reduce((acc, record) => {
            acc[record.date] = record.total_minutes;
            return acc;
        }, {});

        // Chạy vòng lặp qua 12 tháng trong năm hiện tại
        for (let m = 0; m < 12; m++) {
            const daysInMonth = [];
            const firstDay = new Date(currentYear, m, 1);
            const lastDay = new Date(currentYear, m + 1, 0); // Lấy ngày cuối cùng của tháng m

            // Quét tất cả các ngày trong tháng đó
            for (let d = 1; d <= lastDay.getDate(); d++) {
                const currentDate = new Date(currentYear, m, d);
                const dateStr = currentDate.toLocaleDateString('sv-SE'); // Lấy YYYY-MM-DD chuẩn múi giờ địa phương

                daysInMonth.push({
                    date: dateStr,
                    dayOfWeek: currentDate.getDay(), // 0: Chủ Nhật, 1: Thứ Hai...
                    total_minutes: statsMap[dateStr] || 0
                });
            }

            monthsStructure.push({
                monthName: firstDay.toLocaleString('en-US', { month: 'short' }),
                days: daysInMonth
            });
        }
        return monthsStructure;
    }, [heatmapData]);

    // 🌟 HELPER TÍNH STREAK: Chuẩn múi giờ địa phương, loại bỏ hoàn toàn .toISOString() gây lệch giờ
    const calculateLocalStreak = (rawRecords) => {
        const activeDates = new Set(rawRecords.filter(d => d.total_minutes > 0).map(d => d.date));
        
        const todayStr = new Date().toLocaleDateString('sv-SE');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('sv-SE');

        // Nếu cả hôm nay và hôm qua đều rỗng -> Sập xích về 0
        if (!activeDates.has(todayStr) && !activeDates.has(yesterdayStr)) return 0;

        let streak = 0;
        let checkDate = new Date(); // Quét ngược về quá khứ

        while (true) {
            const checkStr = checkDate.toLocaleDateString('sv-SE');
            if (activeDates.has(checkStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // Tha bổng cho ngày hôm nay nếu user chưa kịp hoàn thành phiên nào nhưng hôm qua cày trâu
                if (checkStr === todayStr) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    continue;
                }
                break; // Đứt chuỗi thật sự trong quá khứ
            }
        }
        return streak;
    };
    
    // 🔥 HỢP NHẤT LOGIC: FETCH DATA TỔNG + DATA HEATMAP + LẮNG NGHE REALTIME SONG SONG
    useEffect(() => {
        let isMounted = true;
        let activeChannels = []; // Quản lý mảng các kênh tránh rò rỉ bộ nhớ

        const initializeAnalyticsSystem = async () => {
            const { data: authData } = await supabase.auth.getUser();
            const currentUser = authData?.user || storeUser;

            if (!currentUser?.id) return;

            try {
                // 1. FETCH BAN ĐẦU: Gom hai lệnh truy vấn chạy song song bằng Promise.all tối ưu tốc độ
                const [profilesResponse, heatmapResponse] = await Promise.all([
                    supabase.from('profiles').select('finishedTasks, skippedSession, focusStreaks').eq('id', currentUser.id).maybeSingle(),
                    supabase.from('focus_stats').select('date, total_minutes').eq('user_id', currentUser.id)
                ]);

                if (profilesResponse.error) throw profilesResponse.error;
                if (heatmapResponse.error) throw heatmapResponse.error;

                if (isMounted) {
                    // Nạp số liệu tổng
                    setStats({
                        finished: profilesResponse.data?.finishedTasks || 0,
                        skipped: profilesResponse.data?.skippedSession || 0,
                    });
                    setCurrentStreak(profilesResponse.data?.focusStreaks || 0);

                    // Nạp mảng dữ liệu lịch sử cho Heatmap
                    if (heatmapResponse.data) {
                        setHeatmapData(heatmapResponse.data);
                        
                        // Tính toán nhanh chuỗi ngày liên tiếp (Streak)
                        const activeDates = new Set(heatmapResponse.data.filter(d => d.total_minutes > 0).map(d => d.date));
                        let streak = 0;
                        let checkDate = new Date();
                        
                        while (activeDates.has(checkDate.toISOString().split('T')[0])) {
                            streak++;
                            checkDate.setDate(checkDate.getDate() - 1);
                        }
                        setCurrentStreak(streak);
                    }
                }
            } catch (err) {
                console.error('[Analytics Engine Error]:', err.message);
            } finally {
                if (isMounted) setLoading(false);
            }

            // 2. MỞ ỐNG DẪN REALTIME 1: Theo dõi biến động bảng Profiles (Số liệu tổng)
            const profileChannelName = `stats-profile-${currentUser.id}-${Math.random().toString(36).slice(2,7)}`;
            const profileChannel = supabase
                .channel(profileChannelName)
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${currentUser.id}` },
                    (payload) => {
                        const newData = payload.new;
                        if (!newData || !isMounted) return;
                        setStats((prev) => ({
                            ...prev,
                            finished: newData.finishedTasks !== undefined ? newData.finishedTasks : prev.finished,
                            skipped: newData.skippedSession !== undefined ? newData.skippedSession : prev.skipped
                        }));
                    }
                ).subscribe();
            activeChannels.push(profileChannel);

            // 3. MỞ ỐNG DẪN REALTIME 2: Theo dõi biến động bảng Focus Stats (Kích nổ ô vuông thời gian thực)
            const heatmapChannelName = `stats-heatmap-${currentUser.id}-${Math.random().toString(36).slice(2,7)}`;
            const heatmapChannel = supabase
                .channel(heatmapChannelName)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'focus_stats', filter: `user_id=eq.${currentUser.id}` },
                    (payload) => {
                        if (!isMounted) return;
                        const eventType = payload.eventType;
                        const row = payload.new || payload.old;

                        if (eventType === 'INSERT' || eventType === 'UPDATE') {
                            setHeatmapData((prev) => {
                                const index = prev.findIndex(item => item.date === row.date);
                                if (index !== -1) {
                                    const updated = [...prev];
                                    updated[index] = { date: row.date, total_minutes: row.total_minutes };
                                    return updated;
                                } else {
                                    return [...prev, { date: row.date, total_minutes: row.total_minutes }];
                                }
                            });
                        }
                    }
                ).subscribe();
            activeChannels.push(heatmapChannel);
        };

        initializeAnalyticsSystem();

        // CLEANUP: Quét sạch rác, đóng toàn bộ cổng WebSocket khi chuyển trang
        return () => {
            isMounted = false;
            activeChannels.forEach(ch => supabase.removeChannel(ch));
        };
    }, [storeUser?.id]);

    // Chuyển mảng dữ liệu sang Object Map để tối ưu thuật toán render O(1)
    const statsMap = heatmapData.reduce((acc, record) => {
        acc[record.date] = record.total_minutes;
        return acc;
    }, {});

    return (
        <div className="w-full h-full flex flex-col p-6 bg-[#E2E2E2] overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">System / Analytics</p>
                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-[#2A2820]">Performance Stats</h2>
                </div>
                
                {/* HIỂN THỊ CHUỖI STREAK CHUẨN ĐÔ THỊ */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#2A2820] bg-[#FFEB99] shadow-[2px_2px_0px_0px_rgba(42,40,32,1)] font-mono text-[10px] font-black uppercase text-[#2A2820]">
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
                    <span>{currentStreak} Day Streak</span>
                </div>
            </div>

            {loading ? (
                <div className="flex-grow flex flex-col items-center justify-center gap-2 py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[#2A2820]" />
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Syncing metrics...</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6 flex-grow justify-center max-w-4xl mx-auto w-full">
                    {/* KHỐI HIỂN THỊ TỔNG QUAN HAI BÊN */}
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

                    {/* 🔥 KHU VỰC BẢN ĐỒ NHIỆT 365 NGÀY (HEATMAP AREA) */}
                    <div className="border-2 border-[#2A2820] rounded-2xl p-5 bg-[#F0EDDE] shadow-[4px_4px_0px_0px_rgba(42,40,32,1)] w-full flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#2A2820]">Focus Contribution Matrix</h3>
                            <span className="text-[8px] font-bold opacity-50 uppercase font-mono">12-Month Distributed Analytics</span>
                        </div>

                        {/* LƯỚI TỔNG CHỨA 12 THÁNG RESPONSIVE CHUẨN ĐÔ THỊ */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-3 bg-white border-2 border-[#2A2820] rounded-xl overflow-y-auto max-h-[340px] custom-scrollbar">
                            {monthlyHeatmap.map((month, idx) => (
                                <div key={idx} className="flex flex-col p-2.5 bg-[#FDFDFB] border-2 border-[#2A2820] rounded-lg shadow-[2px_2px_0px_0px_rgba(42,40,32,1)]">
                                    {/* TÊN THÁNG CHỮ ĐẬM BRUTALISM */}
                                    <span className="text-[10px] font-black uppercase tracking-wider mb-2 text-[#2A2820] border-b border-[#2A2820]/10 pb-1 block">
                                        {month.monthName}
                                    </span>

                                    {/* MA TRẬN Ô VUÔNG: Cấu trúc CSS Grid 7 hàng, chảy theo cột */}
                                    <div className="grid grid-rows-7 grid-flow-col gap-1 auto-cols-max">
                                        {/* THUẬT TOÁN OFFSET ĐỆM Ô TRỐNG ĐẦU THÁNG ĐỂ THẲNG HÀNG THỨ */}
                                        {Array.from({ length: (month.days[0].dayOfWeek + 6) % 7 }).map((_, i) => (
                                            <div key={`empty-${i}`} className="w-2.5 h-2.5 bg-transparent" />
                                        ))}

                                        {/* VẼ CÁC Ô NGÀY THỰC TẾ TRONG THÁNG */}
                                        {month.days.map((day) => {
                                            const mins = day.total_minutes;
                                            return (
                                                <div
                                                    key={day.date}
                                                    title={`${day.date} · ${mins} mins focus`}
                                                    className={`w-2.5 h-2.5 border rounded-[1px] transition-all duration-100 hover:scale-125 cursor-crosshair ${getColorClass(mins)}`}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CHÚ THÍCH CẤP ĐỘ MÀU (LEGEND) CHUẨN BRUTALISM */}
                        <div className="flex justify-between items-center mt-3 text-[8px] font-black uppercase opacity-70">
                            <span>* Hover to view minutes</span>
                            <div className="flex items-center gap-1">
                                <span>Less</span>
                                <div className="w-2.5 h-2.5 border rounded-[1px] bg-[#EAE6DF] border-[#C8C2B7]/40"></div>
                                <div className="w-2.5 h-2.5 border rounded-[1px] bg-[#C2F0C2] border-[#2A2820]"></div>
                                <div className="w-2.5 h-2.5 border rounded-[1px] bg-[#70DB70] border-[#2A2820]"></div>
                                <div className="w-2.5 h-2.5 border rounded-[1px] bg-[#33CC33] border-[#2A2820]"></div>
                                <div className="w-2.5 h-2.5 border rounded-[1px] bg-[#1F991F] border-[#2A2820]"></div>
                                <span>More</span>
                            </div>
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