'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User } from 'lucide-react';
import { useLLM, LLM_MODELS } from '@/lib/llm-context';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlaygroundModal({ isOpen, onClose }: PlaygroundModalProps) {
  const { model, setModel } = useLLM();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('https://api.automation-plus-ki.de/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: newMessages }),
      });
      const data = await res.json();
      const content =
        data?.choices?.[0]?.message?.content ||
        data?.content ||
        data?.response ||
        JSON.stringify(data);
      setMessages((prev) => [...prev, { role: 'assistant', content }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Request failed'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!isOpen) return null;

  const currentModelLabel = LLM_MODELS.find((m) => m.id === model)?.label ?? model;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl flex flex-col"
        style={{ height: 'min(680px, 90vh)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Bot size={14} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Playground</p>
              <p className="text-xs text-slate-400">{currentModelLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Model selector */}
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="text-xs bg-slate-700 border border-slate-600 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500/50"
            >
              {LLM_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Bot size={22} className="text-blue-400" />
              </div>
              <p className="text-sm text-slate-400">Send a message to start the conversation</p>
              <p className="text-xs text-slate-500">Model: {currentModelLabel}</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                msg.role === 'user' ? 'bg-blue-500/20' : 'bg-slate-700'
              }`}>
                {msg.role === 'user'
                  ? <User size={13} className="text-blue-400" />
                  : <Bot size={13} className="text-slate-300" />}
              </div>
              <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
                msg.role === 'user'
                  ? 'bg-blue-500/15 border border-blue-500/20 text-slate-100'
                  : 'bg-slate-700/60 border border-slate-600/50 text-slate-200'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center">
                <Bot size={13} className="text-slate-300" />
              </div>
              <div className="bg-slate-700/60 border border-slate-600/50 rounded-xl px-4 py-2.5">
                <span className="text-slate-400 text-sm">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-slate-700">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message… (Enter to send, Shift+Enter for newline)"
              rows={2}
              className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-9 h-9 mb-0.5 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={14} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
