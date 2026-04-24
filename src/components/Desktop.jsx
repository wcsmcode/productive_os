import React from 'react';
import Items from './Items.jsx';

const Desktop = ({ onOpenApp }) => {
  const apps = [
    { id: 'settings', label: 'Settings', icon: 'Settings' },
    { id: 'tracking', label: 'Tracking', icon: 'Activity' },
    { id: 'notes', label: 'Notes', icon: 'FileText' },
  ];

  return (
    <div className="flex-1 p-10 bg-[--accent-soft] flex flex-col items-start gap-2">
      {apps.map(app => (
        <Items.AppIcon 
          key={app.id}
          iconName={app.icon} 
          label={app.label} 
          onClick={() => onOpenApp(app.id)}
        />
      ))}
    </div>
  );
};

export default Desktop;