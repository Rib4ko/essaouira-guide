import React from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import { Bot, User, ExternalLink } from 'lucide-react';
import EventCard from './EventCard';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
          ${isUser ? 'bg-indigo-600 text-white' : 'bg-teal-600 text-white'}`}>
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>

        {/* Content Container */}
        <div className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start'}`}>
          
          {/* Text Bubble */}
          <div className={`px-5 py-3 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed
            ${isUser 
              ? 'bg-indigo-600 text-white rounded-br-none' 
              : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
            }`}>
            {message.isError ? (
              <span className="text-red-500 font-medium">{message.text}</span>
            ) : (
              <ReactMarkdown 
                className={`markdown ${isUser ? 'text-white' : 'text-slate-800'}`}
                components={{
                    ul: ({node, ...props}) => <ul className="list-disc ml-4 my-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal ml-4 my-2" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                    a: ({node, ...props}) => <a className="underline hover:opacity-80 transition-opacity" target="_blank" rel="noreferrer" {...props} />
                }}
              >
                {message.text}
              </ReactMarkdown>
            )}
          </div>

          {/* Event Cards (if any) */}
          {!isUser && message.events && message.events.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-3 w-full">
              {message.events.map((evt) => (
                <EventCard key={evt.id} event={evt} />
              ))}
            </div>
          )}

          {/* Sources / Grounding */}
          {!isUser && message.webSources && message.webSources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold self-center mr-1">Sources</span>
              {message.webSources.map((source, idx) => (
                 <a 
                    key={idx} 
                    href={source} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-2 py-1 rounded-md transition-all shadow-sm"
                 >
                    <ExternalLink size={10} />
                    {new URL(source).hostname.replace('www.', '')}
                 </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
