import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageCircle, AlertTriangle, ArrowRight, CornerDownRight } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AIChatCoachProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isGenerating: boolean;
  onClearHistory: () => void;
}

export default function AIChatCoach({
  chatHistory,
  onSendMessage,
  isGenerating,
  onClearHistory,
}: AIChatCoachProps) {
  const [inputText, setInputText] = useState('');
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickTriggers = [
    "Give me a 15-minute recovery plan",
    "How do I politely tell a client I need 1 more day?",
    "Explain standard deviation simply, test is in 1 hour",
    "I'm completely stuck and panicking. Help!"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isGenerating]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isGenerating) return;
    setInputText('');
    await onSendMessage(textToSend.trim());
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[550px]" id="chat-coach-container">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-zinc-900/60 p-4 border-b border-slate-200 dark:border-zinc-850 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <MessageCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Emergency Focus Coach</h3>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold flex items-center gap-1 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              On-Call Action Planner
            </span>
          </div>
        </div>
        
        {chatHistory.length > 0 && (
          isConfirmingReset ? (
            <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded-md border border-red-200 dark:border-red-900/30">
              <span className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Clear history?</span>
              <button
                onClick={() => {
                  onClearHistory();
                  setIsConfirmingReset(false);
                }}
                id="btn-confirm-reset-yes"
                className="text-[9px] font-bold text-white bg-red-600 hover:bg-red-750 px-2 py-0.5 rounded cursor-pointer uppercase tracking-wider transition-all"
              >
                Yes
              </button>
              <button
                onClick={() => setIsConfirmingReset(false)}
                id="btn-confirm-reset-no"
                className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded cursor-pointer border border-slate-200 dark:border-zinc-800 uppercase tracking-wider transition-all"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingReset(true)}
              id="btn-clear-chat-history"
              className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 hover:text-red-650 dark:hover:text-red-400 transition-colors bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-md cursor-pointer border border-slate-200 dark:border-zinc-800 uppercase tracking-wider"
            >
              Reset Chat
            </button>
          )
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/20 dark:bg-zinc-950/20" id="chat-messages-area">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-4">
            <Sparkles className="w-10 h-10 text-indigo-650 dark:text-indigo-450 animate-pulse" />
            <div className="max-w-sm">
              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Stuck or struggling with writer's block?</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium leading-relaxed">
                Tell your on-call coach what you're working on. I can draft introductions, write emails, or plan recovery slots.
              </p>
            </div>
            
            {/* Quick Triggers */}
            <div className="w-full max-w-md pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickTriggers.map((trigger, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(trigger)}
                  className="bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 border border-slate-200 dark:border-zinc-800 text-left p-3 rounded-xl text-xs text-slate-700 dark:text-zinc-300 transition-all hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-start gap-1.5 cursor-pointer shadow-3xs"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">{trigger}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-3xs ${
                      isUser 
                        ? 'bg-indigo-600 dark:bg-indigo-550 text-white rounded-br-none font-bold' 
                        : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-850 dark:text-zinc-100 rounded-bl-none'
                    }`}
                  >
                    {!isUser && (
                      <span className="block text-[10px] font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest mb-1.5">
                        AI Coach
                      </span>
                    )}
                    <div className="whitespace-pre-wrap break-words font-medium">{msg.text}</div>
                    <span className={`block text-[9px] text-right mt-1.5 font-bold uppercase tracking-wider ${
                      isUser ? 'text-indigo-200' : 'text-slate-400 dark:text-zinc-500'
                    }`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 rounded-2xl rounded-bl-none p-3.5 max-w-[85%] shadow-3xs">
                  <span className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1.5">
                    AI Coach
                  </span>
                  <div className="flex gap-1.5 items-center py-1">
                    <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-850 flex-shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(inputText); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask me for a breakdown, script, email draft, or focus rule..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isGenerating}
            className="flex-1 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-55"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isGenerating}
            id="btn-chat-send"
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:dark:bg-zinc-900 disabled:text-slate-400 text-white p-3 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
