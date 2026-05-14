import {react, useState, useEffect, useRef} from 'react';
import Items from '../../Items.jsx';
import { supabase } from '/src/lib/supabase.js';
import {AuthService} from '/src/lib/supabase.js';
import {useAuthStore, useTrackingStore} from '/src/lib/store.js';
import {SkipForward,Settings,RefreshCcw, Play, X} from 'lucide-react';

const AddTaskPopup = ({onOpenApp}) => {
    const [title, setTitle] = useState('');
    const [SetTime, setSetTime] = useState('');
    const { isAddTaskOpen, setAddTaskOpen, addTask } = useTrackingStore(); // Lấy "đồ" từ store[cite: 5, 7]
    const [profile, setProfile] = useState(null); // State để chứa data sử dụng cho UI

    useEffect(() => {
        const getFullProfile = async () => {
            // 1. Lấy user từ Auth
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
            // 2. Dùng ID đó để lấy các cột cụ thể trong bảng profiles
            const { data, error } = await supabase
                .from('profiles')
                .select('display_name, id') // Liệt kê các cột mày đã tạo
                .eq('id', user.id)
                .single();

            if (!error) {
                setProfile(data); // Đưa data vào state để dùng
            }
            }
        };

        getFullProfile();
    }, []);

    // TRONG handleExecute của AddTaskPopup.jsx
    const handleExecute = async () => {
        if (!title.trim()) return alert("Task name is mandatory.");
        if (!profile?.id) return alert('User profile not loaded yet. Please try again in a moment.');

        const finalTime = SetTime && !isNaN(SetTime) ? parseInt(SetTime) : 25;

        const taskPayload = {
            title: title.trim(),
            user_id: profile.id,
            duration_minutes: finalTime,
            status: 'pending'
        };

        const { data, error } = await supabase
            .from('pomodoro_cycles')
            .insert([taskPayload])
            .select()
            .single();

        if (error) {
            console.error('Failed to insert pomodoro cycle:', error);
            alert(error.message || 'Failed to create task. Please try again.');
            return;
        }

        addTask(data);
        setTitle('');
        setSetTime('');
        onOpenApp('tracking', false);
    };

    return (
        <div className="flex items-center justify-center h-full w-full bg-[#D8D1B4]">
            <div className="p-6 w-full relative">         
                <h2 className="text-[14px] font-black uppercase mb-4 text-[#2A2820]">
                    Initialize New Task
                </h2>
                <input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border-2 border-[#2A2820] rounded-lg px-4 py-2 mb-4 bg-white/50 focus:outline-none focus:bg-white text-[#2A2820] placeholder:opacity-30" 
                    placeholder="New task" 
                />
                <h2 className="text-[12px] font-bold uppercase mb-2 text-[#2A2820]">
                    Time Allocation (minutes)
                </h2>
                <input 
                    type="number" // Chuyển sang kiểu number cho chuẩn UX[cite: 10]
                    value={SetTime}
                    onChange={(e) => setSetTime(e.target.value)}
                    className="w-full border-2 border-[#2A2820] rounded-lg px-4 py-2 mb-4 bg-white/50 focus:outline-none focus:bg-white text-[#2A2820] placeholder:opacity-30" 
                    placeholder="25" 
                />
                <button 
                    className="w-full bg-[#2A2820] text-[#D8D1B4] py-3 rounded-lg font-bold uppercase hover:bg-[#4A5D4E] transition-all"
                    onClick={handleExecute}
                >
                    Execute_Add
                </button>
            </div>
        </div>
    );
};

export default AddTaskPopup;