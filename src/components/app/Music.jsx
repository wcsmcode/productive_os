import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music as MusicIcon } from 'lucide-react';

const MusicApp = () => {
    // ==== LIST NHẠC MẪU (Thay bằng link bài hát của mày) ====
    const [songs] = useState([
        {
            id: 1,
            title: "Midnight Lofi Chill",
            artist: "Zen Audio Studio",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" // Link mp3 chạy thử
        },
        {
            id: 2,
            title: "Coffee Shop Beats",
            artist: "Solo Architect",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
        },
        {
            id: 3,
            title: "Cyberpunk Coding Session",
            artist: "System Core",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
        }
    ]);

    // ==== STATES & REFS MẠNG BỌC THÉP ====
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.4);

    const audioRef = useRef(null);
    const currentSong = songs[currentSongIndex];

    // Khởi tạo audio khi đổi bài
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        audioRef.current = new Audio(currentSong.url);
        audioRef.current.volume = volume;

        // Lắng nghe sự kiện của Audio tag
        const audio = audioRef.current;
        
        const setAudioData = () => setDuration(audio.duration);
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => handleNext();

        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);

        if (isPlaying) {
            audio.play().catch(err => console.log("Chờ tương tác người dùng hoặc lỗi mạng:", err));
        }

        return () => {
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [currentSongIndex]);

    // Điều khiển Play/Pause
    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(err => console.log(err));
        }
        setIsPlaying(!isPlaying);
    };

    // Chuyển bài tiếp theo
    const handleNext = () => {
        setCurrentSongIndex((prevIndex) => (prevIndex + 1) % songs.length);
    };

    // Quay lại bài trước
    const handlePrev = () => {
        setCurrentSongIndex((prevIndex) => (prevIndex - 1 + songs.length) % songs.length);
    };

    // Điều chỉnh âm lượng
    const handleVolumeChange = (e) => {
        const v = parseFloat(e.target.value);
        setVolume(v);
        if (audioRef.current) audioRef.current.volume = v;
    };

    // Tua nhạc nhanh chậm bằng thanh progress
    const handleProgressChange = (e) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        if (audioRef.current) audioRef.current.currentTime = newTime;
    };

    // Hàm format thời gian (giây -> mm:ss)
    const formatTime = (time) => {
        if (isNaN(time)) return "00:00";
        const mins = Math.floor(time / 60).toString().padStart(2, '0');
        const secs = Math.floor(time % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className="flex h-[580px] w-[720px] bg-[#D8D1B4] text-[#2A2820] border-2 border-[#2A2820] rounded-xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(42,40,32,0.1)] font-sans">
            
            {/* THÀNH PHẦN 1: CỘT TRÁI - DANH SÁCH BÀI HÁT (PLAYLIST) */}
            <aside className="w-72 border-r-2 border-[#2A2820]/10 p-5 flex flex-col bg-[#D2CBB0] shrink-0">
                <div className="flex items-center gap-2 mb-6 px-1 border-b-2 border-[#2A2820]/10 pb-3">
                    <MusicIcon size={18} className="stroke-[2.5]" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Zen Playlist</span>
                </div>

                <div className="space-y-1 flex-grow overflow-y-auto custom-scrollbar">
                    {songs.map((song, index) => (
                        <div
                            key={song.id}
                            onClick={() => {
                                setCurrentSongIndex(index);
                                if(!isPlaying) setIsPlaying(true);
                            }}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all active:scale-[0.98] border
                                ${currentSongIndex === index 
                                    ? 'bg-[#2A2820] text-[#D8D1B4] border-[#2A2820]' 
                                    : 'bg-white/10 border-transparent hover:border-[#2A2820]/30 hover:bg-white/20'
                                }`}
                        >
                            <div className={`w-2 h-2 rounded-full border ${currentSongIndex === index ? 'bg-[#4A5D4E] border-white animate-pulse' : 'bg-transparent border-[#2A2820]'}`}></div>
                            <div className="overflow-hidden flex-1">
                                <p className="text-[10px] font-black uppercase tracking-tight truncate">{song.title}</p>
                                <p className={`text-[8px] truncate mt-0.5 ${currentSongIndex === index ? 'opacity-60' : 'opacity-40'}`}>{song.artist}</p>
                            </div>
                            {currentSongIndex === index && isPlaying && (
                                <span className="text-[8px] font-bold text-[#4A5D4E] bg-white px-1.5 py-0.5 rounded animate-bounce">[PLAYING]</span>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-4 p-3 border-2 border-dashed border-[#2A2820]/20 rounded-xl text-center text-[9px] font-bold opacity-40 uppercase">
                    Drag mp3 files here to load
                </div>
            </aside>

            {/* THÀNH PHẦN 2: VÙNG CHÍNH - MÔ PHỎNG ĐĨA THAN XOAY MOCKUP */}
            <main className="flex-1 p-8 flex flex-col justify-between items-center relative bg-[#F4F1E1]/30">
                
                {/* Header Tiêu Đề Bài Hát Đang Chạy */}
                <header className="w-full text-center">
                    <span className="text-[7px] font-black bg-[#2A2820] text-[#D8D1B4] px-2 py-0.5 rounded uppercase tracking-widest">
                        Vinyl Deck Active
                    </span>
                    <h1 className="text-xl font-black tracking-tighter uppercase italic mt-2 truncate max-w-[450px] mx-auto">
                        {currentSong.title}
                    </h1>
                    <p className="text-[9px] uppercase font-bold opacity-50 tracking-wider -mt-0.5">{currentSong.artist}</p>
                </header>

                {/* KHU VỰC ĐĨA NHẠC CHẠY ĐỘNG (VINYL MECHANISM) */}
                <div className="relative w-60 h-60 my-2 flex items-center justify-center">
                    
                    {/* Thân Đĩa Đen Ngoài Cùng */}
                    <div className={`absolute w-full h-full rounded-full bg-[#1A1A17] border-4 border-[#2A2820] flex items-center justify-center shadow-2xl transition-transform duration-1000 ease-linear
                        ${isPlaying ? 'animate-spin' : ''}`}
                        style={{ animationDuration: '4s' }}
                    >
                        {/* Rãnh âm thanh giả lập (Grooves) */}
                        <div className="absolute w-[88%] h-[88%] rounded-full border border-white/5"></div>
                        <div className="absolute w-[75%] h-[75%] rounded-full border border-white/5"></div>
                        <div className="absolute w-[60%] h-[60%] rounded-full border border-white/10"></div>
                        
                        {/* Nhãn Đĩa Tâm Tròn (Màu Beige) */}
                        <div className="w-20 h-20 rounded-full bg-[#D8D1B4] border-2 border-[#2A2820] flex flex-col items-center justify-center p-2 text-center overflow-hidden">
                            <span className="text-[6px] font-black tracking-tight uppercase leading-none truncate w-full">{currentSong.title}</span>
                            <div className="w-2.5 h-2.5 rounded-full bg-[#F4F1E1] border-2 border-[#2A2820] mt-1"></div>
                        </div>
                    </div>

                    {/* Cần Kim Đọc Nhạc Cơ Khí (Tonearm) - Tự động nghiêng vào mặt đĩa khi Play */}
                    <div className={`absolute top-0 right-2 w-4 h-28 origin-top transition-transform duration-700 ease-in-out pointer-events-none z-10
                        ${isPlaying ? 'rotate-[24deg]' : 'rotate-0'}`}
                    >
                        {/* Ổ trục giữ kim */}
                        <div className="w-4 h-4 rounded-full bg-[#2A2820] border border-white/20"></div>
                        {/* Thanh kim đọc mạ kim loại giả lập */}
                        <div className="w-0.5 h-20 bg-[#2A2820] mx-auto"></div>
                        {/* Đầu kim hạ xuống đĩa */}
                        <div className="w-2 h-4 bg-[#4A5D4E] border border-[#2A2820] rounded-sm transform -rotate-12 -mt-1 mx-auto"></div>
                    </div>
                </div>

                {/* THANH ĐIỀU CHỈNH TIẾN TRÌNH & ĐIỀU KHIỂN (PLAYER DECK) */}
                <div className="w-full px-6 space-y-4">
                    
                    {/* Thanh trượt tiến trình bài hát */}
                    <div className="w-full">
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleProgressChange}
                            className="w-full accent-[#2A2820] h-1 bg-[#2A2820]/10 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between items-center text-[9px] font-mono mt-1 opacity-60">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Cụm nút cơ khí & Thanh Volume điều phối âm thanh */}
                    <div className="flex justify-between items-center bg-[#E2E2E2]/60 p-2.5 rounded-xl border border-[#2A2820]/10">
                        
                        {/* 1. Bộ điều chỉnh âm lượng bên trái */}
                        <div className="flex items-center gap-2 w-28">
                            <Volume2 size={12} className="opacity-60" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="w-full accent-[#2A2820] h-0.5 bg-[#2A2820]/20 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* 2. Cụm nút bấm chuyển bài ở tâm */}
                        <div className="flex items-center gap-2">
                            <button onClick={handlePrev} className="p-2 border border-[#2A2820] rounded-lg bg-white/60 hover:bg-white active:scale-95 transition-all">
                                <SkipBack size={12} className="stroke-[2.5]" />
                            </button>

                            <button onClick={togglePlay} className="p-2.5 bg-[#2A2820] text-white rounded-lg shadow-[0px_3px_0px_0px_rgba(42,40,32,0.2)] active:shadow-none active:translate-y-[3px] transition-all flex items-center justify-center">
                                {isPlaying ? <Pause size={14} className="stroke-[2.5]" /> : <Play size={14} className="stroke-[2.5] ml-0.5" />}
                            </button>

                            <button onClick={handleNext} className="p-2 border border-[#2A2820] rounded-lg bg-white/60 hover:bg-white active:scale-95 transition-all">
                                <SkipForward size={12} className="stroke-[2.5]" />
                            </button>
                        </div>

                        {/* 3. Đánh nhãn Engine bên phải */}
                        <div className="text-[7px] font-black opacity-30 text-right uppercase tracking-wider w-28">
                            Hi-Fi Lofi Deck
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default MusicApp;