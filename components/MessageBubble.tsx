import React from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import { Bot, User, ExternalLink } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 
          ${isUser ? 'bg-indigo-600 text-white' : 'bg-teal-600 text-white'}`}>
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-5 py-3 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed
            ${isUser 
              ? 'bg-indigo-600 text-white rounded-br-none' 
              : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
            }`}>
            {message.isError ? (
              <span className="text-red-200">{message.text}</span>
            ) : (
              <ReactMarkdown 
                className={`markdown ${isUser ? 'text-white' : 'text-slate-800'}`}
                components={{
                    ul: ({node, ...props}) => <ul className="list-disc ml-4 my-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal ml-4 my-2" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                    a: ({node, ...props}) => <a className="underline hover:text-teal-300" target="_blank" rel="noreferrer" {...props} />
                }}
              >
                {message.text}
              </ReactMarkdown>
            )}
          </div>

          {/* Sources / Grounding */}
          {!isUser && message.webSources && message.webSources.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 animate-fade-in">
              <span className="text-xs text-slate-500 font-semibold w-full">Sources found:</span>
              {message.webSources.map((source, idx) => (
                 <a 
                    key={idx} 
                    href={source} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors"
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