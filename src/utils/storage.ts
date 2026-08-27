import { Conversation, Settings } from '../types';
import { DEFAULT_MODEL_ID } from '../config/models';

const STORAGE_KEYS = {
  CONVERSATIONS: 'tracai_conversations_v1',
  SETTINGS: 'tracai_settings_v1',
};

export const defaultSettings: Settings = {
  apiUrl: import.meta.env.VITE_API_URL || 'https://api.tracemada.net/v1/chat/completions',
  apiKey: import.meta.env.VITE_API_KEY || '',
  defaultModel: DEFAULT_MODEL_ID,
  temperature: 0.7,
  maxTokens: 2048,
  streaming: true,
  theme: 'dark',
};

export const storage = {
  getConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Erreur lecture localStorage conversations:', e);
      return [];
    }
  },

  saveConversations(conversations: Conversation[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    } catch (e) {
      console.error('Erreur sauvegarde localStorage conversations:', e);
    }
  },

  getSettings(): Settings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return { ...defaultSettings, ...JSON.parse(data) };
      }
    } catch (e) {
      console.error('Erreur lecture localStorage settings:', e);
    }
    return defaultSettings;
  },

  saveSettings(settings: Settings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Erreur sauvegarde localStorage settings:', e);
    }
  },
};
