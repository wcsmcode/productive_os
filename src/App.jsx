import React, { useState } from 'react';
import Desktop from './components/Desktop';
import Taskbar from './components/Taskbar';
import SettingsApp from './components/app/Settings';
import { motion } from 'framer-motion';
import Tracking from './components/app/Tracking/Tracking';
//popups
import AddTaskPopup from './components/app/Tracking/TrackingAddTask';

function App() {
  
  const [windows, setWindows] = useState([]); // Mảng chứa các app đang mở
  const [topZ, setTopZ] = useState(100);      // Biến để quản lý z-index

  const openApp = (type,status) => {
    const isOpened = windows.find(win => win.type === type);
    if (isOpened) {
      focusWindow(isOpened.id);
      return;
    }
    const openStatus = status || true ; // Mặc định là 'default' nếu không truyền
    if (openStatus === false){
      closeWindow(windows.find(win => win.type === type).id);
      return;
    }
    const defaultSizes = {
      settings: { w: 900, h: 650 },
      notes: { w: 400, h: 500 },
      tracking: { w: 1040, h: 670 },
      //
      addtaskpopup: { w: 300, h: 350 }
    };
    const id = `${type}-${Date.now()}`; // Tạo ID duy nhất (nhân bản thoải mái)
    const newWin = { 
      id,
      type,
      zIndex: topZ + 1,
      width: defaultSizes[type].w,
      height: defaultSizes[type].h,
    };
    
    setWindows([...windows, newWin]); // Thêm vào danh sách chứ không ghi đè
    setTopZ(topZ + 1);
  };
  const focusWindow = (id) => {
    const newZ = topZ + 1;
    setWindows(prev => prev.map(win => 
      win.id === id ? { ...win, zIndex: newZ } : win
    ));
    setTopZ(newZ);
  };

  // 3. Hàm Close (Đóng cửa sổ)
  const closeWindow = (id) => {
    setWindows(prev => prev.filter(win => win.id !== id));
  };
  return (
    <div className="h-screen w-full bg-[#dcdcdc] flex flex-col select-none overflow-hidden text-black font-mono">
      <main className="flex-1 relative bg-[#D8D1B4]">
        {/* Màn hình Desktop */}
        <Desktop onOpenApp={openApp} />
        
        {/* Cửa sổ ứng dụng (Window Template) */}
        {windows.map((win) => (
          <motion.div
            key={win.id}
            drag
            dragMomentum={false}
            onPointerDown={() => focusWindow(win.id)} // Nhấn vào là nổi lên trên
            style={{ zIndex: win.zIndex, width: win.width, height: win.height }}
            className="absolute top-20 left-20 bg-white border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col"
          >
            {/* Header cửa sổ */}
            <div className="flex justify-between items-center px-2 py-1 bg-[#f0f0f0] border-b border-black cursor-grab active:cursor-grabbing">
              <span className="text-[10px] font-black uppercase italic">{win.type}.sys</span>
              <button onClick={() => closeWindow(win.id)} className="hover:bg-red-500 px-2 border-l border-black">×</button>
            </div>
            
            {/* Content - Gọi app tương ứng */}
            <div className="p-4 overflow-auto bg-white">
              {win.type === 'settings' && <SettingsApp />}
              {win.type === 'tracking' && <Tracking onOpenApp={openApp} />}
              {win.type === 'addtaskpopup' && <AddTaskPopup onOpenApp={openApp} />}
            </div>
          </motion.div>
        ))}
      </main>

      {/* Taskbar */}
      <Taskbar />
    </div>
  );
}

export default App;