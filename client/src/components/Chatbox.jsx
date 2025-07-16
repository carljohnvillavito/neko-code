import React, { useState, useRef } from 'react';
import { Send, LoaderCircle, Paperclip, X } from 'lucide-react';

export const Chatbox = ({ onAskAI, isLoading, onImageUpload, uploadedImage, onClearImage }) => {
  const [prompt, setPrompt] = useState('');
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim() || uploadedImage) {
      onAskAI(prompt, uploadedImage);
      setPrompt('');
      onClearImage();
    }
  };

  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="p-3 border-t border-gray-700 bg-gray-800">
      {uploadedImage && (
        <div className="mb-2 p-2 bg-gray-700/50 rounded-lg relative">
          <img src={`data:image/jpeg;base64,${uploadedImage}`} alt="Image preview" className="max-h-24 rounded-md" />
          <button onClick={onClearImage} className="absolute top-1 right-1 bg-gray-900/50 rounded-full p-0.5 text-white hover:bg-gray-900">
            <X size={16} />
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button type="button" onClick={handleFileClick} className="text-gray-400 hover:text-white p-2">
          <Paperclip size={20} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={onImageUpload}
        />
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask Neko to code, or upload an image..."
          className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-pink-600 text-white rounded-md p-2 hover:bg-pink-700 disabled:bg-pink-800 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          disabled={isLoading || (!prompt.trim() && !uploadedImage)}
        >
          {isLoading ? <LoaderCircle className="animate-spin" /> : <Send />}
        </button>
      </form>
    </div>
  );
};
