import React from 'react';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { HomeIcon } from './icons/HomeIcon';
import type { View } from '../App';

interface PageHeaderProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const NavButton: React.FC<{
  viewName: View;
  label: string;
  icon: React.ReactNode;
  activeView: View;
  onClick: (view: View) => void;
}> = ({ viewName, label, icon, activeView, onClick }) => (
  <button
    onClick={() => onClick(viewName)}
    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
      activeView === viewName
        ? 'bg-orange-500 text-white'
        : 'text-slate-300 hover:bg-slate-700'
    }`}
    aria-current={activeView === viewName ? 'page' : undefined}
  >
    {icon}
    {label}
  </button>
);

export const PageHeader: React.FC<PageHeaderProps> = ({ activeView, setActiveView }) => {
  const headerStyle: React.CSSProperties = {
    backgroundImage: `
      linear-gradient(to bottom, rgba(15, 23, 42, 0.3), rgba(15, 23, 42, 0.8)),
      url('https://images.unsplash.com/photo-1563226196-02e0a256967e?q=80&w=2070&auto=format&fit=crop')
    `,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  };

  return (
    <header 
      style={headerStyle} 
      className="py-6 px-4 md:px-8 border-b border-slate-700/50 md:sticky top-0 z-20"
    >
      <div className="flex flex-col items-center gap-4 container mx-auto">
        <div className="text-shadow-lg text-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">New York City Mayor Zohran Kwame Mamdani's Office.</h1>
          <p className="text-slate-200 text-sm md:text-base">Report Issues , Track my agendas, and let's discuss our communities' priorities.</p>
        </div>
        <nav className="flex flex-wrap justify-center items-center gap-2 p-1 bg-slate-800/70 backdrop-blur-sm rounded-lg">
          <NavButton
            viewName="welcome"
            label="Home"
            icon={<HomeIcon className="w-5 h-5" />}
            activeView={activeView}
            onClick={setActiveView}
          />
          <NavButton
            viewName="agenda"
            label="Mayor's Agenda"
            icon={<ClipboardListIcon className="w-5 h-5" />}
            activeView={activeView}
            onClick={setActiveView}
          />
          <NavButton
            viewName="report"
            label="Submit Visual Report"
            icon={<MagicWandIcon className="w-5 h-5" />}
            activeView={activeView}
            onClick={setActiveView}
          />
          <NavButton
            viewName="chat"
            label="Community Chat"
            icon={<ChatBubbleIcon className="w-5 h-5" />}
            activeView={activeView}
            onClick={setActiveView}
          />
        </nav>
      </div>
    </header>
  );
};