import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music as MusicIcon, CircleAlert } from 'lucide-react';
import { useMusicStore } from '/src/lib/store.js';

const YoutubePlayerEngine = () => {
  const { currentSongIndex, songs, setYoutubePlayer, setTrackingTime, nextSong, volume } = useMusicStore();
  const playerRef = useRef(null);
  const intervalRef = useRef(null); // Dùng ref để quản lý setInterval, tránh bị leak bộ nhớ

  useEffect(() => {
    // 1. Tải thư viện IFrame Player API từ Google nếu chưa có
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }

    function initPlayer() {
      // Bảo vệ: Nếu player đã tồn tại thì phá hủy cái cũ trước khi tạo cái mới (tránh trùng lặp origin)
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch(e){}
      }

      playerRef.current = new window.YT.Player('hidden-youtube-dom', {
        height: '0',
        width: '0',
        videoId: songs[currentSongIndex].id,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          enablejsapi: 1,
          // 🔥 ĐÚT CÁI NÀY VÀO ĐỂ FIX LỖI postMessage CHÍ MẠNG
          origin: window.location.origin 
        },
        events: {
          onReady: (event) => {
            setYoutubePlayer(event.target);
            event.target.setVolume(volume * 100);

            // Dọn dẹp interval cũ nếu có
            if (intervalRef.current) clearInterval(intervalRef.current);

            // VÒNG LẶP KIỂM TRA QUẢNG CÁO & TRACKING TIME
            intervalRef.current = setInterval(() => {
              try {
                const player = event.target;
                
                // Đảm bảo player đã thực sự sẵn sàng nhận lệnh postMessage từ host
                if (typeof player.getDuration !== 'function') return;

                const duration = player.getDuration();
                const currentTime = player.getCurrentTime();

                // ⚡ AUTO-SKIP QUẢNG CÁO
                if (duration > 0 && duration < 300) {
                  console.log("Phát hiện quảng cáo, đang tiến hành nhảy cóc...");
                  player.seekTo(duration - 0.5, true);
                  return;
                }

                // Cập nhật cây kim đĩa than chạy thời gian thực
                if (player.getPlayerState() === window.YT.PlayerState.PLAYING) {
                  setTrackingTime(currentTime, duration);
                }
              } catch (err) {
                // Nuốt lỗi thông báo từ postMessage nếu có độ trễ kết nối ở 1-2 giây đầu
              }
            }, 500);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              nextSong();
            }
          },
          onError: (event) => {
            // Log lỗi để debug nếu video bị chết link hoặc không cho phép nhúng
            console.error("YouTube Player Error Code:", event.data);
            // Gợi ý: Nếu lỗi 101 hoặc 150 (Chủ sở hữu cấm nhúng app ngoài), tự động skip qua bài khác luôn
            if (event.data === 101 || event.data === 150) {
              nextSong();
            }
          }
        }
      });
    }

    // dọn dẹp khi unmount component
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    // Mẹo: Đổi w-0 h-0 thành w-1 h-1 để kiểm tra xem video có thực sự xuất hiện không khi debug
    <div className="absolute w-0 h-0 opacity-0 pointer-events-none overflow-hidden border-none m-0 p-0">
      <div id="hidden-youtube-dom"></div>
    </div>
  );
};


const Music = () => {
    // Gọi toàn bộ hàng nóng từ Store về xài
    const { 
        songs, currentSongIndex, isPlaying, currentTime, duration, volume,
        togglePlay, nextSong, prevSong, setVolume, setCurrentTime, selectSong 
    } = useMusicStore();

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
                <header className="flex items-center justify-center relative w-full border-b-2 border-[#2A2820]/10 pb-4">
                    {/* Cụm chữ tiêu đề căn giữa tuyệt đối */}
                    <div className="text-center">
                        <h1 className="text-lg font-black uppercase italic truncate max-w-[360px] mx-auto tracking-tight">
                            {currentSong?.title || "Loading Track..."}
                        </h1>
                        <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest mt-0.5">
                            {currentSong?.artist || "Unknown Artist"}
                        </p>
                    </div>

                    {/* ICON CREDIT BỌC THÉP PHÁP LÝ - Đặt lệch sang phải tinh tế, căn giữa theo trục dọc */}
                    <div className="absolute right-2 flex items-center">
                        <CircleAlert 
                            size={13} 
                            className="opacity-40 hover:opacity-100 transition-opacity cursor-help" 
                        />
                    </div>
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
export { YoutubePlayerEngine };
export default Music;