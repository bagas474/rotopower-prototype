'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Plus, Copy, Check, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  messages: ChatMessage[];
}

// Demo data - in production, this would come from the backend
const DEMO_SESSIONS: ChatSession[] = [
  {
    id: 1,
    title: 'Troubleshooting Pump VIB',
    created_at: '2024-01-15 10:00',
    messages: [
      { id: 1, role: 'user', content: 'Why is the vibration high on pump BFP-01?', created_at: '10:00 AM' },
      { id: 2, role: 'assistant', content: 'High vibration on BFP-01 typically indicates **bearing wear** or **imbalance**. Check:\n\n1. Bearing condition (lubrication level)\n2. Pump alignment\n3. Impeller balance\n\nRefer to the maintenance manual section 3.2 for detailed inspection steps.', created_at: '10:01 AM' },
    ],
  },
];

const SUGGESTED_PROMPTS = [
  'Analyze latest anomalies',
  'Find pump maintenance manual',
  'Explain high vibration readings',
];

export function RotopowerChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>(DEMO_SESSIONS);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(1);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const handleNewSession = () => {
    const newId = Math.max(...sessions.map(s => s.id), 0) + 1;
    const newSession: ChatSession = {
      id: newId,
      title: 'New Chat',
      created_at: new Date().toLocaleString(),
      messages: [],
    };
    setSessions([...sessions, newSession]);
    setCurrentSessionId(newId);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    if (!currentSession) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue.trim(),
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSessions(sessions.map(s =>
      s.id === currentSessionId
        ? { ...s, messages: [...s.messages, userMessage] }
        : s
    ));

    setInputValue('');
    setIsStreaming(true);

    // Simulate streaming response with typing indicator
    await new Promise(resolve => setTimeout(resolve, 800));

    const assistantMessage: ChatMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: 'This is a simulated response from the AI assistant. In production, this would stream from the backend API using Server-Sent Events.',
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSessions(sessions.map(s =>
      s.id === currentSessionId
        ? { ...s, messages: [...s.messages, assistantMessage] }
        : s
    ));

    setIsStreaming(false);
  };

  const handleCopyMessage = (content: string, messageId: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center z-40 transition-all duration-300 hover:scale-110"
          aria-label="Open AI Chat"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {/* Chat Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          />

          {/* Drawer */}
          <div
            className="fixed right-0 top-0 h-screen w-[30%] max-w-md bg-white shadow-xl rounded-l-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-right-full duration-300"
          >
            {/* Header */}
            <div className="border-b border-slate-200 p-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-slate-50">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900 text-sm">Rotopower AI</h2>
                  <p className="text-xs text-slate-500">Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Container */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Session List & Messages Area */}
              {currentSession && currentSession.messages.length === 0 ? (
                // Empty State
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">Start a Conversation</h3>
                  <p className="text-xs text-slate-500 mb-6">Ask about equipment maintenance, troubleshooting, or operational guidance</p>
                  <div className="space-y-2 w-full">
                    {SUGGESTED_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInputValue(prompt);
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200 transition-colors text-left"
                      >
                        ✨ {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Messages
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {currentSession?.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}
                    >
                      <div
                        className={`max-w-xs rounded-lg px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-slate-100 text-slate-900 rounded-bl-none group relative'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <>
                            <div className="prose prose-sm max-w-none prose-p:m-0 prose-p:text-sm prose-headings:text-sm prose-headings:font-semibold prose-ul:my-2 prose-li:my-0 prose-code:bg-slate-200 prose-code:px-1 prose-code:rounded">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                            <button
                              onClick={() => handleCopyMessage(msg.content, msg.id)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-200 rounded transition-all"
                              aria-label="Copy message"
                            >
                              {copiedId === msg.id ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4 text-slate-600" />
                              )}
                            </button>
                          </>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                        <p className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-500'}`}>
                          {msg.created_at}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isStreaming && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="bg-slate-100 rounded-lg rounded-bl-none px-4 py-3 flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
                        <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={handleNewSession}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
                  aria-label="Start new chat"
                >
                  <Plus className="h-4 w-4" />
                  New Chat
                </button>
              </div>

              <div className="flex gap-2">
                <textarea
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything... (Shift + Enter for new line)"
                  rows={3}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  disabled={isStreaming}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isStreaming}
                  className="flex items-center justify-center h-full px-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
