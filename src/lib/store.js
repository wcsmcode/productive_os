import {create} from 'zustand';

const useAuthStore = create((set) => ({
    currentState: 'Authorized',
    setcurrentState: (state) => set({ currentState: state }),
}));



// Tracking app state management
// src/lib/store.js
const useTrackingStore = create((set, get) => ({
    tasks: [],
    loading: false,
    
    // Thêm hàm fetch để đồng bộ dữ liệu từ Supabase khi App khởi chạy
    fetchTasks: async () => {
        set({ loading: true });
        const { data } = await supabase.from('pomodoro_cycles').select('*');
        set({ tasks: data || [], loading: false });
    },

    addTask: async (title, userId, duration, task_id) => {
        // 1. Tạo object task chuẩn
        const newTask = {
        task_id: task_id || self.crypto.randomUUID(), // Nếu không có ID thì tự tạo
        title: title || "Quick Focus Session", // Tiêu đề mặc định nếu để trống[cite: 2]
        user_id: userId,
        duration_minutes: duration || 25, // Mặc định 25p nếu không set[cite: 2]
        status: 'pending',
        created_at: new Date().toISOString()
    };

        // 2. Optimistic Update: Cập nhật UI ngay lập tức để user thấy mượt
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
    }
}));

export { useAuthStore, useTrackingStore };