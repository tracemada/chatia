import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Settings,
  X,
  Edit2,
  Trash2,
  Copy,
  PanelLeftClose,
  Sparkles,
} from 'lucide-react';
import { useChat } from '../../store/ChatContext';
import { groupConversationsByDate, GroupedConversations } from '../../utils/dateGrouping';
import { Conversation } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile, onOpenSettings }) => {
  const {
    conversations,
    currentConversationId,
    createNewConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    duplicateConversation,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const filteredConversations = conversations.filter((c: Conversation) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped: GroupedConversations[] = groupConversationsByDate(filteredConversations);

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (editingTitle.trim()) {
      renameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 tracking-wide text-lg flex items-center gap-1.5">
                Trac<span className="text-sky-400">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">Powered by OmniRoute</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-100 lg:hidden rounded-lg hover:bg-slate-800 transition-colors"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: Nouvelle conversation */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              createNewConversation();
              onCloseMobile();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition-all hover:shadow-sky-500/30"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle conversation</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-7 py-1.5 text-xs bg-slate-950/60 rounded-lg border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
          {grouped.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              {searchQuery ? 'Aucune conversation trouvée' : 'Aucun historique'}
            </div>
          ) : (
            grouped.map((group: GroupedConversations) => (
              <div key={group.category} className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  {group.category}
                </div>
                {group.conversations.map((conv: Conversation) => {
                  const isSelected = conv.id === currentConversationId;
                  const isEditing = editingId === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        selectConversation(conv.id);
                        onCloseMobile();
                      }}
                      className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-800 text-sky-300 font-medium border border-slate-700/80 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <MessageSquare
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-400'
                        }`}
                      />

                      {isEditing ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(conv.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          onBlur={() => handleSaveRename(conv.id)}
                          className="flex-1 bg-slate-950 text-slate-100 px-1.5 py-0.5 rounded border border-sky-500 text-xs focus:outline-none"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="flex-1 truncate">{conv.title}</span>
                      )}

                      {/* Action icons on hover */}
                      {!isEditing && (
                        <div className="hidden group-hover:flex items-center gap-1 shrink-0 text-slate-400">
                          <button
                            title="Renommer"
                            onClick={(e) => handleStartRename(conv.id, conv.title, e)}
                            className="p-1 hover:text-sky-400 rounded hover:bg-slate-700/50"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            title="Dupliquer"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateConversation(conv.id);
                            }}
                            className="p-1 hover:text-emerald-400 rounded hover:bg-slate-700/50"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            title="Supprimer"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv.id);
                            }}
                            className="p-1 hover:text-rose-400 rounded hover:bg-slate-700/50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer Settings */}
        <div className="p-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Paramètres</span>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono border border-slate-700">
              v1.0
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
