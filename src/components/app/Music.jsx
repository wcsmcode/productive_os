import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music as MusicIcon } from 'lucide-react';
import { useMusicStore } from '/src/lib/store.js';

const Music = () => {
    // Gọi toàn bộ hàng nóng từ Store về xài
    const { 
        songs, currentSongIndex, isPlaying, currentTime, duration, volume,
        togglePlay, nextSong, prevSong, setVolume, setCurrentTime, selectSong 
    } = useMusicStore();

    const [curentTimeState, setCurentTimeState] = useState(0);

    const currentSong = songs[currentSongIndex];

    const formatTime = (time) => {
        if (isNaN(time)) return "00:00";
        const mins = Math.floor(time / 60).toString().padStart(2, '0');
        const secs = Math.floor(time % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className="flex h-[540px] w-[720px] bg-[#D8D1B4] text-[#2A2820] rounded-lg overflow-hidden font-mono">
            
            {/* CỘT TRÁI - PLAYLIST */}
            <aside className="w-64 border-r-2 border-[#2A2820]/10 p-4 flex flex-col bg-[#D2CBB0]">
                <div className="flex items-center gap-2 mb-4 px-1 border-b border-[#2A2820]/10 pb-2">
                    <MusicIcon size={14} />
                    <span className="text-[12px] font-black uppercase tracking-wider">Zen Playlist</span>
                </div>

                <div className="space-y-1 flex-grow overflow-y-auto">
                    {songs.map((song, index) => (
                        <div
                            key={song.id}
                            onClick={() => selectSong(index)}
                            className={`p-2 rounded cursor-pointer border text-left transition-all
                                ${currentSongIndex === index ? 'bg-[#2A2820] text-[#D8D1B4] border-[#2A2820]' : 'bg-white/10 border-transparent hover:bg-white/20'}`}
                        >
                            <p className="text-[12px] font-black uppercase truncate">{song.title}</p>
                            <p className="text-[10px] opacity-40 truncate">{song.artist}</p>
                        </div>
                    ))}
                </div>
            </aside>

            {/* VÙNG CHÍNH - ĐĨA THAN TO */}
            <main className="flex-1 p-6 flex flex-col justify-between items-center bg-[#F4F1E1]/30">
                <header className="w-full text-center">
                    <h1 className="text-lg font-black uppercase italic truncate max-w-[400px] mx-auto">{currentSong.title}</h1>
                    <p className="text-[10px] uppercase font-bold opacity-50 tracking-wider">{currentSong.artist}</p>
                </header>

                {/* ĐĨA THAN VÀ CẦN KIM CO CỨNG CHỐNG MÓP BIẾN DẠNG */}
                <div className="relative w-56 h-56 my-2 flex items-center justify-center shrink-0">
                    <div className={`absolute w-full h-full rounded-full bg-[#1A1A17] border-4 border-[#2A2820] flex items-center justify-center shadow-2xl transition-transform duration-1000 ease-linear ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }}>
                        <div className="w-16 h-16 rounded-full bg-[#D8D1B4] border-2 border-[#2A2820] flex flex-col items-center justify-center p-1 text-center">
                            <span className="text-[5px] font-black uppercase truncate w-full">{currentSong.title}</span>
                            <div className="w-2 h-2 rounded-full bg-[#F4F1E1] border border-[#2A2820] mt-1"></div>
                        </div>
                    </div>
                    {/* Cần kim gạt góc */}
                    <div className={`absolute top-0 right-2 w-4 h-24 origin-top transition-transform duration-700 ease-in-out pointer-events-none z-10 ${isPlaying ? 'rotate-[24deg]' : 'rotate-0'}`}>
                        <div className="w-3 h-3 rounded-full bg-[#2A2820]"></div>
                        <div className="w-0.5 h-16 bg-[#2A2820] mx-auto"></div>
                        <div className="w-2 h-3 bg-[#4A5D4E] rounded-sm transform -rotate-12 -mt-1 mx-auto"></div>
                    </div>
                </div>

                {/* THANH ĐIỀU KHIỂN SỐ GIÂY VÀ VOLUME */}
                <div className="w-full px-4 space-y-3">
                    <div>
                        <input 
                            type="range" min="0" max={duration || 0} value={currentTime} 
                            onChange={(e) => setCurrentTime(parseFloat(e.target.value))} 
                            className="w-full accent-[#2A2820] h-1 bg-[#2A2820]/10 appearance-none cursor-pointer" 
                        />
                        <div className="flex justify-between text-[9px] font-mono mt-1 opacity-60">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-[#E2E2E2]/60 p-2 rounded-lg border">
                        <div className="flex items-center gap-2 w-24">
                            <Volume2 size={10} />
                            <input 
                                type="range" min="0" max="1" step="0.05" value={volume} 
                                onChange={(e) => setVolume(parseFloat(e.target.value))} 
                                className="w-full accent-[#2A2820] h-0.5 bg-[#2A2820]/20 appearance-none cursor-pointer" 
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={prevSong} className="p-1.5 border rounded bg-white/60"><SkipBack size={10} /></button>
                            <button onClick={togglePlay} className="p-2 bg-[#2A2820] text-white rounded">{isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}</button>
                            <button onClick={nextSong} className="p-1.5 border rounded bg-white/60"><SkipForward size={10} /></button>
                        </div>
                        <div className="text-[6px] font-black opacity-30 text-right uppercase w-24">Hi-Fi Deck</div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Music;