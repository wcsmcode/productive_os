import {React, useState, useEffect} from 'react';
import * as Lucide from 'lucide-react';
import { supabase } from '/src/lib/supabase.js';
import { AuthService } from '/src/lib/supabase.js';
import { useAuthStore } from '/src/lib/store.js';

// 1. Khuôn cho Icon App (App Icon Template)
const AppLauncher = ({ id, iconName, label, onClick, variant = "icon" }) => {
  const IconComponent = Lucide[iconName] || Lucide.AppWindow;
  
  // Trạng thái cục bộ cho widget stats (nếu id là tracking)
  const [stats, setStats] = useState({ completed: 0, skipped: 0 });
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (variant === "widget" && id === "tracking") {
      const fetchStats = async () => {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('finished_tasks, skippedSession')
            .eq('id', authData.user.id)
            .single();
          if (data) {
            setStats({
              completed: data.finished_tasks ?? 0,
              skipped: data.skippedSession ?? 0
            });
          }
        }
      };
      fetchStats();
    }
  }, [variant, id]);

  // TRƯỜNG HỢP 1: RENDER DẠNG ICON TRUYỀN THỐNG
  if (variant === "icon") {
    return (
      <div 
        onClick={onClick}
        className="group flex flex-col items-center gap-1 w-16 cursor-pointer"
      >
        <div className="w-12 h-12 bg-[#f0f0f0] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-none transition-all flex items-center justify-center">
          <IconComponent size={20} strokeWidth={2} color="black" />
        </div>
        <span className="text-[9px] font-black uppercase tracking-tighter text-black opacity-70 group-hover:opacity-100 text-center">
          {label}
        </span>
      </div>
    );
  }

  // TRƯỜNG HỢP 2: RENDER DẠNG WIDGET (NHẠC LOFI HOẶC STATS THEO ẢNH MOCKUP)
  if (variant === "widget") {
    if (id === 'music') {
      return (
        <div className="w-48 bg-[#E2E2E2] border-2 border-black rounded-xl p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-2 relative">
          <span className="text-[8px] font-black opacity-40 uppercase tracking-widest">Zen Audio</span>
          
          {/* Đĩa Vinyl Mini mô phỏng mockup */}
          <div 
            onClick={onClick} /* Bấm vào widget vẫn mở app cài đặt hệ thống */
            className="w-20 h-20 rounded-full bg-[#1A1A17] border-2 border-black flex items-center justify-center cursor-pointer group relative"
          >
            <div className={`w-full h-full rounded-full border border-white/5 absolute ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}></div>
            <div className="w-7 h-7 rounded-full bg-[#D8D1B4] border border-black flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
            </div>
          </div>

          {/* Nút bấm chơi nhạc nhanh */}
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Ngăn mở app cửa sổ khi chỉ muốn bấm Play nhạc nhanh
              setIsPlaying(!isPlaying);
            }}
            className="w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center active:scale-95 transition-transform"
          >
            {isPlaying ? <Lucide.Pause size={12} strokeWidth={2.5} /> : <Lucide.Play size={12} strokeWidth={2.5} className="ml-0.5" />}
          </button>
        </div>
      );
    }

    // ─── PHÂN HỆ WIDGET 2B: THÔNG SỐ STATS COMPLETED / SKIPPED ───
    if (id === 'tracking') {
      const { user: storeUser } = useAuthStore(); // Lấy user từ store làm nền tảng
      const [stats, setStats] = useState({ finished: 0, skipped: 0 });
      // 🔥 HỢP NHẤT LOGIC: FETCH DATA BAN ĐẦU + KHỞI TẠO REALTIME CHUẨN BACKEND
      useEffect(() => {
          let activeChannel = null;

          const initializeStatsSystem = async () => {
              // 1. Kiểm tra session trực tiếp từ Supabase để dự phòng tối đa việc Zustand chưa load kịp
              const { data: authData } = await supabase.auth.getUser();
              const currentUser = authData?.user || storeUser;

              if (!currentUser?.id) {
                  //console.log("⏳ [Stats Backend] Chưa tìm thấy session user hợp lệ, đang chờ...");
                  return;
              }

              try {
                  const { data, error } = await supabase
                      .from('profiles')
                      .select('finishedTasks, skippedSession')
                      .eq('id', currentUser.id)
                      .maybeSingle();

                  if (error) throw error;

                  if (data) {
                      setStats({
                          finished: data.finishedTasks || 0,
                          skipped: data.skippedSession || 0 
                      });
                  }
              } catch (err) {
                  console.error('🚨 [Stats Fetch Error]:', err.message);
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
                          if (!newData) return;

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
              if (activeChannel) {
                  //console.log("🔌 [Backend] Đã đóng đường truyền Realtime của màn Thống kê.");
                  supabase.removeChannel(activeChannel);
              }
          };
      }, [storeUser?.id]); // Trọng tâm theo dõi ID người dùng thay đổi
      return (
        <div 
          onClick={onClick}
          className="w-64 bg-[#F4F1E1] border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:bg-[#eae7d7] transition-colors flex flex-col justify-between"
        >
          <span className="text-[8px] font-black opacity-40 uppercase tracking-widest mb-2 block">System Metric</span>
          <div className="grid grid-cols-2 gap-4">
            <div className="border-r border-black/10">
              <p className="text-[12px] font-black uppercase text-green-700 leading-none">Tasks Completed</p>
              <p className="text-3xl font-black tabular-nums mt-1">{stats.finished.toString().padStart(2, '0')}</p>
            </div>
            <div className="pl-2">
              <p className="text-[12px] font-black uppercase text-red-700 leading-none">Tasks Skipped</p>
              <p className="text-3xl font-black tabular-nums mt-1">{stats.skipped.toString().padStart(2, '0')}</p>
            </div>
          </div>
        </div>
      );
    }

    // Fallback cho các app khác nếu truyền variant="widget"
    return (
      <div onClick={onClick} className="p-4 border-2 border-black bg-white rounded-xl cursor-pointer font-bold text-xs uppercase">
        {label} Widget
      </div>
    );
  }
};

// 2. Thông báo Toast (cách xài: <Items.Toast message="App opened!" />)
const Toast = ({ message, icon: Icon = Lucide.Bell }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsExpanded(true), 100); // Delay nhỏ để trigger animation
    setTimeout(() => setIsExpanded(false), 3000); // Tự ẩn sau 3 giây
  }, []);
  <div 
    className={`fixed top-4 left-1/2 z-[9999] transition-all duration-500 ease-out origin-top
      ${isExpanded 
        ? '-translate-x-1/2 translate-y-0 scale-100 opacity-100' 
        : '-translate-x-1/2 -translate-y-8 scale-75 opacity-0'
      }
    `}
  >
    <div className="bg-black text-white px-4 py-2 rounded-full flex items-center gap-3 min-w-[200px] shadow-lg">
      <Icon size={16} className="text-yellow-400 shrink-0" />
      <span className="text-xs font-bold tracking-tight whitespace-nowrap">{message}</span>
    </div>
  </div>
};

// 3. Nút bấm (Brutal Button)
const Button = ({ children, onClick, variant = "primary" }) => {
  const styles = variant === "primary" ? "bg-white" : "bg-cyan-400";
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 border-2 border-black font-black uppercase text-xs shadow-neo active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all ${styles}`}
    >
      {children}
    </button>
  );
};

// 4. Input & Select
const Input = (props) => (
  <input 
    {...props}
    className="border-2 border-black p-2 text-xs font-bold outline-none focus:bg-yellow-50 w-full"
  />
);

const Select = ({ options = [], ...props }) => (
  <select 
    {...props}
    className="border-2 border-black p-2 text-xs font-bold outline-none bg-white cursor-pointer"
  >
    {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
  </select>
);

// 5. Dropdown Menu
const Dropdown = ({ label, items = [] }) => (
  <div className="relative group inline-block">
    <Button>{label} ▾</Button>
    <div className="absolute left-0 mt-1 hidden group-hover:block min-w-[150px] bg-white border-2 border-black z-50">
      {items.map((item, i) => (
        <div 
          key={i} 
          onClick={item.onClick}
          className="p-2 text-xs font-black border-b last:border-none border-black hover:bg-black hover:text-white cursor-pointer uppercase"
        >
          {item.label}
        </div>
      ))}
    </div>
  </div>
);

const Items = {
  AppLauncher,
  Toast,
  Button,
  Input,
  Select,
  Dropdown
};

export default Items;