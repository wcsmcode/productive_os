import React from 'react';
import * as Lucide from 'lucide-react';

// 1. Khuôn cho Icon App (App Icon Template)
const AppIcon = ({ iconName, label, onClick }) => {
  const IconComponent = Lucide[iconName] || Lucide.AppWindow;
  return (
    <div 
      onClick={onClick}
      className="group flex flex-col items-center gap-1 w-16 cursor-pointer mb-4"
    >
      <div className="w-12 h-12 bg-[#f0f0f0] border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-none transition-all flex items-center justify-center">
        <IconComponent size={20} strokeWidth={1.5} color="black" />
      </div>
      <span className="text-[9px] font-bold uppercase tracking-tighter text-black opacity-70 group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
};

// 2. Thông báo Toast 
const Toast = ({ message, icon: Icon = Lucide.Bell }) => (
  <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]">
    <div className="bg-black text-white px-4 py-2 rounded-full flex items-center gap-3 min-w-[200px] shadow-lg animate-bounce-short">
      <Icon size={16} className="text-yellow-400" />
      <span className="text-xs font-bold tracking-tight">{message}</span>
    </div>
  </div>
);

// 3. Nút bấm (Brutal Button)
const Button = ({ children, onClick, variant = "primary" }) => {
  const styles = variant === "primary" ? "bg-white" : "bg-cyan-400";
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 border-2 border-black font-black uppercase text-xs shadow-neo active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all ${styles}`}
    >
      {children}
    </button>
  );
};

// 4. Input & Select
const Input = (props) => (
  <input 
    {...props}
    className="border-2 border-black p-2 text-xs font-bold outline-none focus:bg-yellow-50 w-full"
  />
);

const Select = ({ options = [], ...props }) => (
  <select 
    {...props}
    className="border-2 border-black p-2 text-xs font-bold outline-none bg-white cursor-pointer"
  >
    {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
  </select>
);

// 5. Dropdown Menu
const Dropdown = ({ label, items = [] }) => (
  <div className="relative group inline-block">
    <Button>{label} ▾</Button>
    <div className="absolute left-0 mt-1 hidden group-hover:block min-w-[150px] bg-white border-2 border-black z-50">
      {items.map((item, i) => (
        <div 
          key={i} 
          onClick={item.onClick}
          className="p-2 text-xs font-black border-b last:border-none border-black hover:bg-black hover:text-white cursor-pointer uppercase"
        >
          {item.label}
        </div>
      ))}
    </div>
  </div>
);

const Items = {
  AppIcon,
  Toast,
  Button,
  Input,
  Select,
  Dropdown
};

export default Items;