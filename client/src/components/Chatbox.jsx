import React, { useState } from 'react';
import { Send, LoaderCircle } from 'lucide-react';

export const Chatbox = ({ onAskAI, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      onAskAI(prompt);
      setPrompt('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-gray-700 bg-gray-800">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask Neko to code, e.g., 'Make the background blue'"
          className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-pink-600 text-white rounded-md p-2 hover:bg-pink-700 disabled:bg-pink-800 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? <LoaderCircle className="animate-spin" /> : <Send />}
        </button>
      </div>
    </form>
  );
};
