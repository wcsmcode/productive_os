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

const songs = [
  { id: 1, title: "Midnight Lofi Chill", artist: "Zen Audio Studio", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "Coffee Shop Beats", artist: "Solo Architect", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "Cyberpunk Coding Session", artist: "System Core", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

// Khởi tạo một đối tượng Audio ĐƠN NHIỆM trên RAM (Chống tràn bộ nhớ)
let globalAudio;

const createAudio = (url, set, get) => {
  const audio = new Audio(url);

  audio.addEventListener('timeupdate', () => {
    try {
      set({ currentTime: audio.currentTime });
      console.log("Current Time:", audio.currentTime);
    } catch (error) {
      console.error("Error updating current time:", error);
    }
  });

  audio.addEventListener('loadeddata', () => {
    set({ duration: audio.duration });
  });

  audio.addEventListener('ended', () => {
    get().nextSong();
  });

  return audio;
};

const useMusicStore = create((set, get) => {
  const initAudio = () => {
    globalAudio = createAudio(songs[0].url, set, get);
    globalAudio.volume = 0.4;
  };

  initAudio();

  const changeSong = (index, shouldPlay = false) => {
    const { volume, isPlaying } = get();
    if (globalAudio) {
      globalAudio.pause();
    }

    globalAudio = createAudio(songs[index].url, set, get);
    globalAudio.volume = volume;

    set({ currentSongIndex: index, currentTime: 0, duration: 0, isPlaying: shouldPlay || isPlaying });

    if (shouldPlay || isPlaying) {
      globalAudio.play().catch(err => console.log(err));
    }
  };

  return {
    songs,
    currentSongIndex: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.4,

    // Bật / Tắt nhạc đồng bộ
    togglePlay: () => {
      const { isPlaying, volume } = get();
      globalAudio.volume = volume;
      console.log("play toggled, curr:", globalAudio.currentTime);
      if (isPlaying) {
        globalAudio.pause();
      } else {
        globalAudio.play().catch(err => console.log("Chờ tương tác người dùng:", err));
      }
      set({ isPlaying: !isPlaying });
    },

    // Hàm "Tử Thần" - Tắt hẳn nhạc khi đóng cửa sổ App
    stopMusic: () => {
      globalAudio.pause();
      set({ isPlaying: false });
    },

    // Next Bài
    nextSong: () => {
      const { currentSongIndex, songs } = get();
      const nextIndex = (currentSongIndex + 1) % songs.length;
      changeSong(nextIndex);
    },

    // Lùi Bài
    prevSong: () => {
      const { currentSongIndex, songs } = get();
      const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
      changeSong(prevIndex);
    },

    // Click chọn thẳng 1 bài trong Playlist
    selectSong: (index) => {
      changeSong(index, true);
    },

    setVolume: (v) => {
      globalAudio.volume = v;
      set({ volume: v });
    },

    setCurrentTime: (time) => {
      globalAudio.currentTime = time;
      set({ currentTime: time });
    }
  };
});


export { useAuthStore, useTrackingStore, useMusicStore };