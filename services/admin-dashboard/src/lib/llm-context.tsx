'use client';

import { createContext, useContext, useState, useEffect } from 'react';

export const LLM_MODELS = [
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'claude-3-haiku', label: 'Claude 3 Haiku', provider: 'Anthropic' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek V3', provider: 'DeepSeek' },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'Google' },
];

interface LLMContextType {
  model: string;
  setModel: (m: string) => void;
}

const LLMContext = createContext<LLMContextType>({
  model: 'claude-3-5-sonnet',
  setModel: () => {},
});

export function LLMProvider({ children }: { children: React.ReactNode }) {
  const [model, setModelState] = useState('claude-3-5-sonnet');

  useEffect(() => {
    const saved = localStorage.getItem('aios_selected_model');
    if (saved) setModelState(saved);
  }, []);

  const setModel = (m: string) => {
    setModelState(m);
    localStorage.setItem('aios_selected_model', m);
  };

  return (
    <LLMContext.Provider value={{ model, setModel }}>
      {children}
    </LLMContext.Provider>
  );
}

export function useLLM() {
  return useContext(LLMContext);
}
