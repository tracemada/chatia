import { Model } from '../types';

export const fallbackModels: Model[] = [
  { id: "gemini/gemini-2.5-pro", name: "Gemini 2.5 Pro (Google AI Studio)", provider: "Google AI" },
  { id: "oc/north-mini-code-free", name: "OpenCode Free", provider: "OpenCode" },
  { id: "jules/jules", name: "Google Jules", provider: "Jules" },
];

export const DEFAULT_MODEL_ID = "gemini/gemini-2.5-pro";
