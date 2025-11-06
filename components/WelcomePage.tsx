import React from 'react';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import type { View } from '../App';

interface WelcomePageProps {
  setActiveView: (view: View) => void;
}

const ActionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  viewName: View;
}> = ({ icon, title, description, onClick, viewName }) => (
  <button
    onClick={onClick}
    aria-label={`Navigate to ${title}`}
    className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700 hover:border-orange-500 hover:bg-slate-700/50 transition-all duration-200 text-left w-full h-full flex flex-col hover:scale-105"
  >
    <div className="flex-shrink-0 flex items-center gap-4 mb-3">
      <div className="bg-slate-700 p-2 rounded-lg">{icon}</div>
      <h3 className="font-bold text-xl text-white">{title}</h3>
    </div>
    <p className="text-slate-400 text-sm flex-grow">{description}</p>
  </button>
);

export const WelcomePage: React.FC<WelcomePageProps> = ({ setActiveView }) => {
  const heroStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 1)), url('https://images.unsplash.com/photo-1563226196-02e0a256967e?q=80&w=2070&auto=format&fit=crop')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  };

  return (
    <main className="flex-grow animate-fade-in overflow-y-auto">
      <div style={heroStyle} className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8 text-center animate-slide-up">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
          >
            Welcome to New York City Mayor Zohran Kwame Mamdani's Office | Community Engagement Hub
          </h2>
          <p
            className="text-lg text-slate-200 max-w-3xl mx-auto"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
          >
            This platform is a direct line to the Mayor's office. Your voice is crucial in shaping our city's future. The Mayor is listening. Use the tools below to report issues, track the administration's progress on key initiatives, and engage directly with us. Together, we can build a better New York for everyone.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16">
        <div
          className="relative z-10 grid md:grid-cols-3 gap-6 -mt-32 animate-slide-up"
          style={{ animationDelay: '200ms' }}
        >
          <ActionCard
            icon={<ClipboardListIcon className="w-8 h-8 text-orange-400" />}
            title="Mayor's Agenda"
            description="See the key priorities the Mayor's office is currently working on, from infrastructure to public safety. Track the status of active initiatives."
            onClick={() => setActiveView('agenda')}
            viewName="agenda"
          />
          <ActionCard
            icon={<MagicWandIcon className="w-8 h-8 text-orange-400" />}
            title="Submit a Visual Report"
            description="Spotted an issue in your community? Upload a photo, describe the problem, and submit it directly to the relevant city department."
            onClick={() => setActiveView('report')}
            viewName="report"
          />
          <ActionCard
            icon={<ChatBubbleIcon className="w-8 h-8 text-orange-400" />}
            title="Community Chat"
            description="Have a question or want to discuss a community topic? Engage with the Mayor's office AI assistant for information and to share your feedback."
            onClick={() => setActiveView('chat')}
            viewName="chat"
          />
        </div>
      </div>
    </main>
  );
};
