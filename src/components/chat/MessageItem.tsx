import React, { useState } from 'react';
import { User, Sparkles, AlertCircle, Copy, Check } from 'lucide-react';
import { Message } from '../../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`py-5 px-4 sm:px-6 transition-colors ${
        isUser ? 'bg-slate-900/40' : 'bg-slate-900/90 border-y border-slate-800/60'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-4 items-start">
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
            isUser
              ? 'bg-slate-700 text-slate-200'
              : 'bg-gradient-to-tr from-sky-600 to-sky-400 text-white shadow-sky-500/20'
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </div>

        {/* Content Box */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Header info */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">
                {isUser ? 'Vous' : 'TracAI'}
              </span>
              {message.model && !isUser && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-sky-400 border border-slate-700/80 font-mono">
                  {message.model}
                </span>
              )}
            </div>
            <button
              onClick={handleCopyMessage}
              title="Copier le message"
              className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Body */}
          {message.error ? (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{message.content}</span>
            </div>
          ) : isUser ? (
            <div className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
              {message.content}
            </div>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>
      </div>
    </div>
  );
};
