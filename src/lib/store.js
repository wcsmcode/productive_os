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

////////

// Khai báo danh sách bài hát bằng YouTube Video ID (Ví dụ lấy các bài French Cafe Jazz, Lofi)
const songs = [
  { id: "UM4mcdNMnss", title: "1940s Vintage Jazz", artist: "Lepreezy" },
  { id: "6H-PLF2CR18", title: "1 hr lofi", artist: "Lofi Keep You Safe" },
  { id: "akpLkQd8WnE", title: "White noise (wind and blur)", artist: "Nature" }
];

const useMusicStore = create((set, get) => {
  return {
    songs,
    currentSongIndex: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.4,
    youtubePlayer: null, // 👈 Nơi lưu trữ bộ điều khiển YouTube chạy ngầm

    // 1. Hàm nhận thực thể player từ component sinh ra
    setYoutubePlayer: (player) => set({ youtubePlayer: player }),
    
    // Đồng bộ thời gian thực từ YouTube lên Store để chạy thanh cuộn
    setTrackingTime: (curr, dur) => set({ currentTime: curr, duration: dur }),

    // 2. Bật / Tắt nhạc đồng bộ qua SDK YouTube
    togglePlay: () => {
      const { isPlaying, youtubePlayer } = get();
      if (!youtubePlayer) return;

      if (isPlaying) {
        youtubePlayer.pauseVideo();
      } else {
        youtubePlayer.playVideo();
      }
      set({ isPlaying: !isPlaying });
    },

    // Next Bài
    nextSong: () => {
      const { currentSongIndex, songs, youtubePlayer } = get();
      const nextIndex = (currentSongIndex + 1) % songs.length;
      set({ currentSongIndex: nextIndex, currentTime: 0, duration: 0 });
      if (youtubePlayer) {
        youtubePlayer.loadVideoById(songs[nextIndex].id);
      }
    },

    // Lùi Bài
    prevSong: () => {
      const { currentSongIndex, songs, youtubePlayer } = get();
      const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
      set({ currentSongIndex: prevIndex, currentTime: 0, duration: 0 });
      if (youtubePlayer) {
        youtubePlayer.loadVideoById(songs[prevIndex].id);
      }
    },

    // Click chọn thẳng 1 bài trong Playlist
    selectSong: (index) => {
      const { songs, youtubePlayer } = get();
      set({ currentSongIndex: index, currentTime: 0, duration: 0, isPlaying: true });
      if (youtubePlayer) {
        youtubePlayer.loadVideoById(songs[index].id);
      }
    },

    setVolume: (v) => {
      set({ volume: v });
      const { youtubePlayer } = get();
      if (youtubePlayer) {
        youtubePlayer.setVolume(v * 100); // API YouTube nhận từ 0 đến 100
      }
    },

    setCurrentTime: (time) => {
      set({ currentTime: time });
      const { youtubePlayer } = get();
      if (youtubePlayer) {
        youtubePlayer.seekTo(time, true);
      }
    }
  };
});

export { useAuthStore, useTrackingStore, useMusicStore };