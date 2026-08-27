import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Cpu, RefreshCw, Check } from 'lucide-react';
import { useChat } from '../../store/ChatContext';
import { fallbackModels } from '../../config/models';
import { Model } from '../../types';

export const ModelSelector: React.FC = () => {
  const { availableModels, activeModel, setActiveModel, refreshModels, isLoadingModels } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const modelsList: Model[] = availableModels.length > 0 ? availableModels : fallbackModels;

  const currentModel = modelsList.find((m) => m.id === activeModel) || {
    id: activeModel,
    name: activeModel,
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredModels = modelsList.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      (m.provider && m.provider.toLowerCase().includes(search.toLowerCase()))
  );

  // Group filtered models by provider prefix
  const groupedModels = filteredModels.reduce((acc, model) => {
    const provider = model.provider || (model.id.includes('/') ? model.id.split('/')[0] : 'Autres');
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/50 gap-2 max-w-[280px] sm:max-w-[360px]"
        title={currentModel.name}
      >
        <div className="flex items-center gap-2 truncate">
          <Cpu className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="truncate">{currentModel.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 z-50 mt-2 w-80 sm:w-96 rounded-xl bg-slate-800/95 backdrop-blur-md border border-slate-700/80 shadow-2xl py-2 text-slate-200 focus:outline-none">
          {/* Header & Search */}
          <div className="px-3 pb-2 border-b border-slate-700/60 flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un modèle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900/80 rounded-md border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => refreshModels()}
              disabled={isLoadingModels}
              title="Rafraîchir les modèles"
              className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto px-1 py-1 divide-y divide-slate-700/40">
            {Object.keys(groupedModels).length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400">
                Aucun modèle ne correspond à votre recherche.
              </div>
            ) : (
              Object.entries(groupedModels).map(([provider, models]: [string, Model[]]) => (
                <div key={provider} className="py-1">
                  <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-sky-400/90 uppercase">
                    {provider} ({models.length})
                  </div>
                  {models.map((model: Model) => {
                    const isSelected = model.id === activeModel;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          setActiveModel(model.id);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between group transition-colors ${
                          isSelected
                            ? 'bg-sky-500/15 text-sky-300 font-medium'
                            : 'hover:bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        <div className="flex flex-col truncate pr-2">
                          <span className="truncate">{model.name}</span>
                          <span className="text-[10px] text-slate-400 group-hover:text-slate-300 font-mono truncate">
                            {model.id}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
