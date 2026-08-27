export type Role = 'system' | 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  model?: string;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  model: string;
}

export interface Model {
  id: string;
  name: string;
  provider?: string;
  description?: string;
}

export interface Settings {
  apiUrl: string;
  apiKey: string;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  streaming: boolean;
  theme: 'dark' | 'light';
}

export interface ChatCompletionRequestMessage {
  role: Role;
  content: string;
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatCompletionRequestMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  signal?: AbortSignal;
}

export interface ApiError {
  status?: number;
  code?: string;
  message: string;
}
