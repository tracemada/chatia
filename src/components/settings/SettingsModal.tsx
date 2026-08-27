import React, { useState } from 'react';
import { X, Save, RotateCcw, Eye, EyeOff, Sliders, Moon, Sun, Server, Key } from 'lucide-react';
import { useSettings } from '../../store/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [formData, setFormData] = useState({ ...settings });
  const [showApiKey, setShowApiKey] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    onClose();
  };

  const handleReset = () => {
    resetSettings();
    setFormData({ ...settings });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-slate-100">Paramètres TracAI</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-sm">
          {/* API Endpoint Config */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4" /> Endpoint API OmniRoute
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                URL de l'API Chat Completions
              </label>
              <input
                type="text"
                value={formData.apiUrl}
                onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                placeholder="https://api.tracemada.net/v1/chat/completions"
                className="w-full px-3 py-2 text-xs bg-slate-950 rounded-lg border border-slate-800 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Must be an OpenAI-compatible endpoint.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" /> Clé API (Optionnelle)
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full pl-3 pr-10 py-2 text-xs bg-slate-950 rounded-lg border border-slate-800 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Model Parameters */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              Paramètres d'inférence
            </h3>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-300">Température</label>
                <span className="text-xs font-mono text-sky-400">{formData.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-300">Tokens max</label>
                <span className="text-xs font-mono text-sky-400">{formData.maxTokens}</span>
              </div>
              <input
                type="range"
                min="256"
                max="8192"
                step="256"
                value={formData.maxTokens}
                onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value, 10) })}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <span className="block text-xs font-medium text-slate-300">Mode Streaming (SSE)</span>
                <span className="text-[11px] text-slate-400">Affichage progressif de la réponse</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.streaming}
                  onChange={(e) => setFormData({ ...formData, streaming: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Theme & Display */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              Apparence
            </h3>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, theme: 'dark' })}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                  formData.theme === 'dark'
                    ? 'border-sky-500 bg-sky-500/10 text-sky-300'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Moon className="w-4 h-4" /> Thème Sombre
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, theme: 'light' })}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                  formData.theme === 'light'
                    ? 'border-sky-500 bg-sky-500/10 text-sky-300'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Sun className="w-4 h-4" /> Thème Clair
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-md shadow-sky-600/20 transition-all"
              >
                <Save className="w-3.5 h-3.5" /> Enregistrer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
