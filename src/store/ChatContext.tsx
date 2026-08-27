import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Conversation, Message, Model } from '../types';
import { storage } from '../utils/storage';
import { apiClient } from '../services/api/apiClient';
import { useSettings } from './SettingsContext';

interface ChatContextType {
  conversations: Conversation[];
  currentConversationId: string | null;
  currentConversation: Conversation | null;
  availableModels: Model[];
  isLoadingModels: boolean;
  isGenerating: boolean;
  error: string | null;
  activeModel: string;
  setActiveModel: (modelId: string) => void;
  createNewConversation: (modelId?: string) => string;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  duplicateConversation: (id: string) => void;
  clearAllConversations: () => void;
  sendMessage: (content: string) => Promise<void>;
  stopGeneration: () => void;
  retryLastMessage: () => Promise<void>;
  refreshModels: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const [conversations, setConversations] = useState<Conversation[]>(() => storage.getConversations());
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    const saved = storage.getConversations();
    return saved.length > 0 ? saved[0].id : null;
  });

  const [activeModel, setActiveModel] = useState<string>(settings.defaultModel);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Sync active model with settings default on initial load or settings change
  useEffect(() => {
    if (!activeModel && settings.defaultModel) {
      setActiveModel(settings.defaultModel);
    }
  }, [settings.defaultModel, activeModel]);

  // Persist conversations
  useEffect(() => {
    storage.saveConversations(conversations);
  }, [conversations]);

  // Fetch available models from endpoint dynamically
  const refreshModels = useCallback(async () => {
    setIsLoadingModels(true);
    try {
      const fetched = await apiClient.fetchModels(settings.apiUrl, settings.apiKey);
      setAvailableModels(fetched);
    } catch (err) {
      console.warn('Erreur chargement des modèles:', err);
    } finally {
      setIsLoadingModels(false);
    }
  }, [settings.apiUrl, settings.apiKey]);

  useEffect(() => {
    refreshModels();
  }, [refreshModels]);

  const currentConversation = conversations.find((c) => c.id === currentConversationId) || null;

  // Sync activeModel with conversation's preferred model when switching conversations
  useEffect(() => {
    if (currentConversation && currentConversation.model) {
      setActiveModel(currentConversation.model);
    }
  }, [currentConversationId]);

  const createNewConversation = (modelId?: string): string => {
    const modelToUse = modelId || activeModel || settings.defaultModel;
    const newConv: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: 'Nouvelle conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: modelToUse,
    };

    setConversations((prev) => [newConv, ...prev]);
    setCurrentConversationId(newConv.id);
    setError(null);
    return newConv.id;
  };

  const selectConversation = (id: string) => {
    setCurrentConversationId(id);
    setError(null);
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (currentConversationId === id) {
        setCurrentConversationId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const renameConversation = (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle.trim(), updatedAt: Date.now() } : c))
    );
  };

  const duplicateConversation = (id: string) => {
    const target = conversations.find((c) => c.id === id);
    if (!target) return;

    const dup: Conversation = {
      ...target,
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: `${target.title} (Copie)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: target.messages.map((m) => ({ ...m })),
    };

    setConversations((prev) => [dup, ...prev]);
    setCurrentConversationId(dup.id);
  };

  const clearAllConversations = () => {
    setConversations([]);
    setCurrentConversationId(null);
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isGenerating) return;

    setError(null);

    let activeId = currentConversationId;
    let targetConv = conversations.find((c) => c.id === activeId);

    // If no active conversation, create one
    if (!targetConv || !activeId) {
      activeId = createNewConversation(activeModel);
      targetConv = conversations.find((c) => c.id === activeId)!;
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    // Auto update conversation title if first message
    const isFirstMessage = targetConv.messages.length === 0;
    const autoTitle = isFirstMessage
      ? content.trim().length > 30
        ? `${content.trim().slice(0, 30)}...`
        : content.trim()
      : targetConv.title;

    const assistantMessageId = `msg_${Date.now() + 1}_${Math.random().toString(36).substring(2, 7)}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: activeModel,
    };

    // Update conversation with user message and placeholder assistant message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeId) {
          return {
            ...c,
            title: autoTitle,
            updatedAt: Date.now(),
            model: activeModel,
            messages: [...c.messages, userMessage, assistantMessage],
          };
        }
        return c;
      })
    );

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    const requestMessages = [...targetConv.messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      if (settings.streaming) {
        let accumulatedText = '';
        await apiClient.streamChat(
          settings.apiUrl,
          settings.apiKey,
          {
            model: activeModel,
            messages: requestMessages,
            temperature: settings.temperature,
            max_tokens: settings.maxTokens,
            signal: abortControllerRef.current.signal,
          },
          (chunk) => {
            accumulatedText += chunk;
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id === activeId) {
                  return {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMessageId ? { ...m, content: accumulatedText } : m
                    ),
                  };
                }
                return c;
              })
            );
          }
        );
      } else {
        const fullContent = await apiClient.chat(settings.apiUrl, settings.apiKey, {
          model: activeModel,
          messages: requestMessages,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          signal: abortControllerRef.current.signal,
        });

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMessageId ? { ...m, content: fullContent } : m
                ),
              };
            }
            return c;
          })
        );
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string; status?: number };
      const errorMessage = apiErr?.message || 'Erreur lors de la génération de la réponse.';
      setError(errorMessage);

      // Mark assistant message with error flag
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: m.content || errorMessage, error: true }
                  : m
              ),
            };
          }
          return c;
        })
      );
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const retryLastMessage = async () => {
    if (!currentConversation || currentConversation.messages.length === 0 || isGenerating) return;

    const messages = [...currentConversation.messages];
    // Find last user message
    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIdx = i;
        break;
      }
    }

    if (lastUserIdx === -1) return;

    const lastUserContent = messages[lastUserIdx].content;
    // Remove last user message and subsequent assistant response
    const cleanMessages = messages.slice(0, lastUserIdx);

    setConversations((prev) =>
      prev.map((c) => (c.id === currentConversation.id ? { ...c, messages: cleanMessages } : c))
    );

    // Re-send content
    await sendMessage(lastUserContent);
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversationId,
        currentConversation,
        availableModels,
        isLoadingModels,
        isGenerating,
        error,
        activeModel,
        setActiveModel,
        createNewConversation,
        selectConversation,
        deleteConversation,
        renameConversation,
        duplicateConversation,
        clearAllConversations,
        sendMessage,
        stopGeneration,
        retryLastMessage,
        refreshModels,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat doit être utilisé au sein de ChatProvider');
  }
  return context;
};
