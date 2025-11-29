import React, { useState, useRef, useEffect } from 'react';
import { Send, Map, Loader2, Info } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { Message, LoadingState } from '../types';
import { geminiService } from '../services/gemini';

const INITIAL_MESSAGE: Message = {
  id: 'init',
  role: 'model',
  text: "As-salamu alaykum! Marhba. I am your Mogador Guide. Je peux vous aider à trouver des événements à Essaouira. Kanahder hta Darija! How can I help you?",
  timestamp: Date.now()
};

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [toolStatus, setToolStatus] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingState, toolStatus]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loadingState !== LoadingState.IDLE) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoadingState(LoadingState.THINKING);
    setToolStatus('');

    try {
      const response = await geminiService.sendMessage(userMsg.text, (status) => {
        setLoadingState(LoadingState.EXECUTING_TOOL);
        setToolStatus(status);
      });

      const text = response.text || "I found some information.";
      
      // Extract grounding metadata (sources)
      let sources: string[] = [];
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        groundingChunks.forEach(chunk => {
            if (chunk.web?.uri) {
                sources.push(chunk.web.uri);
            }
        });
      }
      
      // Remove duplicates
      sources = [...new Set(sources)];

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text,
        timestamp: Date.now(),
        webSources: sources
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error(error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: "I apologize, I encountered an error accessing the information. Please check your API key or try again.",
        isError: true,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoadingState(LoadingState.IDLE);
      setToolStatus('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-slate-50 relative overflow-hidden shadow-2xl">
      {/* Header */}
      <header className="bg-teal-700 text-white p-4 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
            <Map className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-wide">Mogador Guide</h1>
            <p className="text-teal-200 text-xs">Essaouira Events & Community</p>
          </div>
        </div>
        <button 
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="About"
            onClick={() => alert("This agent connects to Google Search and a mock Google Spreadsheet service.")}
        >
            <Info size={20} />
        </button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 bg-[url('https://www.transparenttextures.com/patterns/arches.png')]">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Loading Indicator */}
        {(loadingState !== LoadingState.IDLE) && (
          <div className="flex justify-start w-full mb-6">
             <div className="flex flex-col gap-2 items-start max-w-[75%]">
                <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100">
                    <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                    <span className="text-slate-500 text-sm italic">
                        {loadingState === LoadingState.EXECUTING_TOOL ? toolStatus : 'Exploring Essaouira...'}
                    </span>
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 z-10">
        <div className="relative flex items-end gap-2 bg-slate-100 border border-slate-200 rounded-3xl px-4 py-2 focus-within:ring-2 focus-within:ring-teal-500 focus-within:bg-white transition-all shadow-inner">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about events, e.g., 'What's happening this weekend?'"
            className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 text-slate-700 placeholder-slate-400"
            rows={1}
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || loadingState !== LoadingState.IDLE}
            className={`mb-1 p-2 rounded-full flex-shrink-0 transition-all duration-200
              ${inputValue.trim() && loadingState === LoadingState.IDLE
                ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-md transform hover:scale-105' 
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2">
           Mogador Guide can check the web and local spreadsheets.
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;