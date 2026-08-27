import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, AlertTriangle, ArrowDown, Sparkles } from 'lucide-react';
import { useChat } from '../../store/ChatContext';
import { ModelSelector } from './ModelSelector';
import { MessageItem } from './MessageItem';

interface ChatAreaProps {
  onOpenMobileSidebar: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ onOpenMobileSidebar }) => {
  const {
    currentConversation,
    sendMessage,
    isGenerating,
    stopGeneration,
    error,
    retryLastMessage,
    createNewConversation,
  } = useChat();

  const [input, setInput] = useState('');
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages update
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [currentConversation?.id]);

  useEffect(() => {
    if (isGenerating) {
      scrollToBottom(true);
    }
  }, [currentConversation?.messages, isGenerating]);

  // Track scroll position for "scroll to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isUp);
  };

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const messageText = input;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    sendMessage(messageText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Top Navigation Header */}
      <header className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="p-2 text-slate-400 hover:text-slate-100 lg:hidden rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Sparkles className="w-5 h-5 text-sky-400" />
          </button>
          <ModelSelector />
        </div>

        {currentConversation && (
          <div className="text-xs text-slate-400 font-mono hidden sm:block truncate max-w-xs">
            {currentConversation.title}
          </div>
        )}
      </header>

      {/* Main Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative scroll-smooth"
      >
        {!currentConversation || currentConversation.messages.length === 0 ? (
          /* Welcome Empty State */
          <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center shadow-xl shadow-sky-500/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-100">
                Bienvenue sur <span className="text-sky-400">TracAI</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                Interface unifiée pour le routeur d'IA OmniRoute. Posez une question, générez du code ou explorez de nouvelles idées en toute simplicité.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left pt-4">
              {[
                { title: 'Écrire un script Python', desc: 'Créer un script pour parser du JSON et exporter en CSV' },
                { title: 'Explication technique', desc: 'Comment fonctionnent les SSE (Server-Sent Events) ?' },
                { title: 'Rédaction d\'email', desc: 'Rédiger une réponse professionnelle pour un projet' },
                { title: 'Optimisation de code', desc: 'Améliorer les performances d\'une requête SQL' },
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (!currentConversation) createNewConversation();
                    sendMessage(prompt.desc);
                  }}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/60 transition-all text-xs group"
                >
                  <div className="font-semibold text-slate-200 group-hover:text-sky-300">
                    {prompt.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">{prompt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="pb-8">
            {currentConversation.messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-28 right-6 z-20 p-2.5 rounded-full bg-slate-800/90 text-slate-200 hover:text-white border border-slate-700 shadow-xl backdrop-blur-md transition-all hover:bg-slate-700"
          title="Faire défiler vers le bas"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Error Banner with Retry */}
      {error && (
        <div className="bg-rose-950/80 border-t border-rose-800/60 px-4 py-2.5 text-xs text-rose-200 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2 truncate">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
          <button
            onClick={retryLastMessage}
            className="px-2.5 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded-md text-[11px] font-medium transition-colors shrink-0"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md z-10">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <div className="relative flex items-end rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-sky-500 shadow-inner overflow-hidden transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question à TracAI... (Entrée pour envoyer, Shift+Entrée pour saut de ligne)"
              className="flex-1 max-h-48 p-3.5 pr-12 text-sm bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none resize-none font-sans"
            />

            {/* Submit / Stop Button */}
            <div className="p-2.5">
              {isGenerating ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all"
                  title="Arrêter la génération"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white shadow-md shadow-sky-600/20 transition-all"
                  title="Envoyer le message"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 text-center mt-2 font-mono">
            TracAI communique directement avec OmniRoute API • Aucune URL en dur
          </div>
        </form>
      </div>
    </div>
  );
};
