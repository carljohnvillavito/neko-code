import React from 'react';
import { Code, Eye, FolderKanban, BotMessageSquare } from 'lucide-react';

export const BottomNavbar = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'editor', icon: Code, label: 'Editor' },
    { id: 'preview', icon: Eye, label: 'Preview' },
    { id: 'files', icon: FolderKanban, label: 'Files' },
    { id: 'ai', icon: BotMessageSquare, label: 'AI' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 md:hidden z-50">
      <div className="flex justify-around">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs transition-colors ${
              activeView === item.id ? 'text-pink-400' : 'text-gray-400 hover:text-pink-300'
            }`}
          >
            <item.icon size={24} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
