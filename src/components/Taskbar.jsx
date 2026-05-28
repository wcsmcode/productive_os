import React from 'react';
import Items from './Items.jsx';

const Taskbar = () => {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();

  return (
    <div className="h-10 bg-[#bab395] border-t border-black flex items-center justify-between px-2 font-mono">
      <div className="flex items-center gap-1 h-full">
        {/* Nút Start sử dụng Items.Dropdown */}
        <Items.Dropdown 
          label="● SYSTEM" 
          items={[
            { label: 'REBOOT', onClick: () => window.location.reload() },
            { label: 'TERMINATE', onClick: () => console.log('Power Off') }
          ]} 
        />
        <div className="h-4 w-[1px] bg-black/20 mx-1" />
      </div>

      <div className="flex items-baseline gap-3 pr-2 select-none">
         <span className="text-[10px] font-bold opacity-60 italic">{date}</span>
         <span className="text-xl font-black tracking-tighter leading-none">{time}</span>
      </div>
    </div>
  );
};

export default Taskbar;