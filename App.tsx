import React from 'react';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center">
      <div className="w-full h-full md:h-[90vh] md:max-w-4xl md:rounded-2xl overflow-hidden shadow-2xl">
        <ChatInterface />
      </div>
    </div>
  );
};

export default App;