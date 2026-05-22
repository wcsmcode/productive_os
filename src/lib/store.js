import {create} from 'zustand';
import {supabase} from './supabase'
const useAuthStore = create((set) => ({
    currentState: 'Authorized',
    user: null,
    setcurrentState: (state) => set({ currentState: state }),
    setUser: (user) => set({ user }),
}));

const useTrackingStore = create((set, get) => ({
    tasks: [],
    loading: false,
    

    setTasks: (newTasks) => set({ tasks: newTasks }),

    fetchTasks: async () => {
        set({ loading: true });
        const { data, error } = await supabase.from('pomodoro_cycles').select('*');
        if (!error) set({ tasks: data || [], loading: false });
    },

    addTask: async (task) => {
        const newTask = {
            id: task?.id,
            title: task?.title || "Quick Focus Session",
            user_id: task?.user_id,
            duration_minutes: task?.duration_minutes || 25,
            status: task?.status || 'pending',
            created_at: task?.created_at || new Date().toISOString()
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
    }
}));

export { useAuthStore, useTrackingStore };