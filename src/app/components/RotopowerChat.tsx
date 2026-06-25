'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Plus, Copy, Check, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { ChatSession, ChatMessage, mockChatSessions, mockChatMessages } from '../data/mockData';

export function RotopowerChat() {
  const [sessions, setSessions] = useState<ChatSession[]>(mockChatSessions);
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(204);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const sessionMessages = messages.filter(m => m.session_id === selectedSessionId).sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionMessages, isStreaming]);

  const handleNewChat = () => {
    const newSessionId = Math.max(...sessions.map(s => s.id), 0) + 1;
    const newSession: ChatSession = {
      id: newSessionId,
      site_id: 1,
      user_id: 1,
      title: 'New Conversation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setSessions(prev => [newSession, ...prev]);
    setSelectedSessionId(newSessionId);
    setInputValue('');
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    if (!selectedSessionId) return;

    const userMessage: ChatMessage = {
      id: Math.max(...messages.map(m => m.id), 0) + 1,
      session_id: selectedSessionId,
      role: 'USER',
      content: inputValue.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsStreaming(true);

    // Update session timestamp
    setSessions(prev =>
      prev.map(s =>
        s.id === selectedSessionId
          ? { ...s, updated_at: new Date().toISOString() }
          : s
      )
    );

    // Simulate streaming response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: userMessage.id + 1,
        session_id: selectedSessionId,
        role: 'ASSISTANT',
        content: `Based on your question about "${inputValue.trim()}", here are the key considerations:\n\n- **Primary factor**: Equipment condition and operational history\n- **Secondary factor**: Environmental conditions and maintenance schedule\n- **Recommended action**: Consult equipment manual and manufacturer guidelines\n\nWould you like more specific information?`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsStreaming(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (content: string, id: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard');
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const suggestedPrompts = [
    'Analyze latest anomalies',
    'Find pump maintenance manuals',
    'What does high vibration mean?'
  ];

  return (
    <div className="flex h-full bg-white">
      {/* Left Pane: Session List */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              No conversations yet
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedSessionId === session.id
                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="font-medium text-sm truncate">{session.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {new Date(session.updated_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Chat Interface */}
      <div className="flex-1 flex flex-col">
        {!selectedSession ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">Welcome to Rotopower AI</h2>
              <p className="text-slate-600 mb-6 max-w-md">
                Ask questions about equipment maintenance, troubleshooting, and operational best practices.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (!selectedSessionId) handleNewChat();
                    setInputValue(prompt);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {sessionMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400">
                  <p>Start a conversation by typing a message below.</p>
                </div>
              ) : (
                sessionMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'ASSISTANT' && (
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-2xl rounded-lg p-3 ${
                        msg.role === 'USER'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-900 group relative'
                      }`}
                    >
                      {msg.role === 'ASSISTANT' ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                      <div
                        className={`text-xs mt-1 ${
                          msg.role === 'USER' ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                    {msg.role === 'ASSISTANT' && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition-all"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                ))
              )}

              {isStreaming && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="bg-slate-100 rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" />
                      <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-200 p-4 bg-slate-50">
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about equipment maintenance, troubleshooting... (Enter to send, Shift+Enter for new line)"
                  rows={3}
                  className="flex-1 resize-none border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  disabled={isStreaming}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isStreaming}
                  className="h-full px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg flex items-center justify-center transition-colors"
                  title="Send message (Enter)"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
