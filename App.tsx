import React, { useState } from 'react';
import { VisualReportTool } from './components/VisualReportTool';
import { ChatRoom } from './components/ChatRoom';
import { AgendaBoard } from './components/AgendaBoard';
import { PageHeader } from './components/PageHeader';
import { WelcomePage } from './components/WelcomePage';

export type View = 'welcome' | 'agenda' | 'report' | 'chat';

export default function App() {
  const [activeView, setActiveView] = useState<View>('welcome');

  return (
    <div className="bg-slate-900 text-white min-h-screen flex flex-col font-sans">
      <PageHeader activeView={activeView} setActiveView={setActiveView} />

      {activeView === 'welcome' && <WelcomePage setActiveView={setActiveView} />}
      {activeView === 'agenda' && <AgendaBoard />}
      {activeView === 'report' && <VisualReportTool />}
      {activeView === 'chat' && <ChatRoom />}
    </div>
  );
}