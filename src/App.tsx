import { useState } from 'react';
import { SettingsProvider } from './store/SettingsContext';
import { ChatProvider } from './store/ChatContext';
import { Sidebar } from './components/sidebar/Sidebar';
import { ChatArea } from './components/chat/ChatArea';
import { SettingsModal } from './components/settings/SettingsModal';

function MainLayout() {
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 font-sans">
      <Sidebar
        isOpen={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <ChatArea onOpenMobileSidebar={() => setIsSidebarOpenMobile(true)} />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <ChatProvider>
        <MainLayout />
      </ChatProvider>
    </SettingsProvider>
  );
}
