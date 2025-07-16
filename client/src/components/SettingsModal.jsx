import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';

export const SettingsModal = ({ initialApiKey, initialModel, initialTone, onSave, onClearApiKey, onClose }) => {
    const [apiKey, setApiKey] = useState(initialApiKey);
    const [model, setModel] = useState(initialModel);
    const [tone, setTone] = useState(initialTone);
  
    const modelOptions = [
        "gemini-2.5-pro",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite-preview-06-17",
        "gemini-2.0-flash",
        "gemini-2.0-flash-preview-image-generation",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
        "gemini-1.5-pro"
    ];

    const toneOptions = ["Creative", "Decent", "Concise"];
    
    // This function now only saves the *other* settings. API key is saved separately.
    const handleSaveSettings = () => {
        onSave({ apiKey, model, tone });
        onClose();
    };

    // New function to save just the API key
    const handleSaveKey = () => {
        onSave({ apiKey, model, tone });
        alert("API Key saved!");
    };
    
    // New function to clear just the API key
    const handleClearKey = () => {
        setApiKey('');
        onClearApiKey();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md animate-scale-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">AI Settings</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Gemini API Key</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="password" 
                                value={apiKey} 
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter your API key..."
                                className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                            <button onClick={handleClearKey} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Clear API Key">
                                <Trash2 size={18} />
                            </button>
                            <button onClick={handleSaveKey} className="p-2 text-gray-400 hover:text-green-400 transition-colors" title="Save API Key">
                                <Save size={18} />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-1">Model</label>
                        <select id="model" value={model} onChange={(e) => setModel(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500">
                            {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="tone" className="block text-sm font-medium text-gray-300 mb-1">Tone</label>
                        <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500">
                            {toneOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-sm">Cancel</button>
                    <button onClick={handleSaveSettings} className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-md text-sm font-bold flex items-center gap-2">
                        Save & Close
                    </button>
                </div>
            </div>
        </div>
    );
};
