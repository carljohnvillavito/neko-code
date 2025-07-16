import React, { useState, useRef } from 'react';
import { Send, LoaderCircle, Paperclip, X, Trash2 } from 'lucide-react';

export const Chatbox = ({ onAskAI, isLoading, onImageUpload, uploadedImages, onClearImage, onClearAllImages }) => {
  const [prompt, setPrompt] = useState('');
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim() || uploadedImages.length > 0) {
      onAskAI(prompt, uploadedImages);
      setPrompt('');
      onClearAllImages();
    }
  };

  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="p-3 border-t border-gray-700 bg-gray-800">
      {uploadedImages.length > 0 && (
        <div className="mb-2 p-2 bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400 font-bold">Image Attachments ({uploadedImages.length})</span>
            <button onClick={onClearAllImages} className="text-gray-400 hover:text-red-400 text-xs flex items-center gap-1">
              <Trash2 size={12} /> Clear All
            </button>
          </div>
          <div className="flex overflow-x-auto space-x-2 pb-2">
            {uploadedImages.map((imgData, index) => (
              <div key={index} className="relative flex-shrink-0">
                <img src={`data:image/jpeg;base64,${imgData}`} alt={`Preview ${index}`} className="h-20 w-20 object-cover rounded-md" />
                <button onClick={() => onClearImage(index)} className="absolute top-1 right-1 bg-gray-900/60 rounded-full p-0.5 text-white hover:bg-red-600/80">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
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
          multiple // Allow multiple file selection
          onChange={onImageUpload}
        />
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask Neko to code, or upload images..."
          className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-pink-600 text-white rounded-md p-2 hover:bg-pink-700 disabled:bg-pink-800 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          disabled={isLoading || (!prompt.trim() && uploadedImages.length === 0)}
        >
          {isLoading ? <LoaderCircle className="animate-spin" /> : <Send />}
        </button>
      </form>
    </div>
  );
};
