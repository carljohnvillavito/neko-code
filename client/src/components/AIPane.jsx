import React from 'react';
import { BotMessageSquare, AlertTriangle, LoaderCircle, CheckCircle2, Settings } from 'lucide-react';
import { Chatbox } from './Chatbox';

export const AIPane = ({ error, aiLogs, onAskAI, isLoading, onImageUpload, uploadedImages, onClearImage, onClearAllImages, onSettingsOpen }) => (
    <div className="h-full flex flex-col bg-gray-900">
        <div className="bg-gray-800 p-2 flex items-center justify-between border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2">
                <BotMessageSquare size={18} className="text-pink-400" />
                <h2 className="font-bold">AI-Agent</h2>
            </div>
            <button onClick={onSettingsOpen} className="p-1 text-gray-400 hover:text-white transition-colors" title="AI Settings">
                <Settings size={18} />
            </button>
        </div>
        
        {error && (<div className="bg-red-500/20 text-red-300 p-2 flex items-center gap-2">
            <AlertTriangle size={16} />
            <span className="break-words w-full">{error}</span>
        </div>)}

        <div className="flex-grow flex flex-col-reverse p-4 overflow-y-auto gap-2">
            {aiLogs.map((log) => {
                let style = 'text-gray-500'; let icon = null;
                if (log.type === 'agent-purr' || log.type === 'agent-info') style = 'text-pink-400';
                if (log.type === 'user') style = 'text-gray-400';
                if (log.type === 'error') style = 'text-red-400';
                if (log.type === 'action') {
                    style = 'text-cyan-400 flex items-center gap-2';
                    if (log.status === 'pending') icon = <LoaderCircle size={14} className="animate-spin" />;
                    if (log.status === 'complete') icon = <CheckCircle2 size={14} className="text-green-500" />;
                }
                return (<div key={log.id}><p className={`text-sm ${style}`}>{icon}{log.content}</p>{log.images && log.images.length > 0 && (<div className="mt-2 flex space-x-2 overflow-x-auto"><div className="flex space-x-2">{log.images.map((imgData, i) => (<img key={i} src={`data:image/jpeg;base64,${imgData}`} alt="Uploaded content" className="h-20 w-20 object-cover rounded-lg" />))}</div></div>)}</div>)
            })}
        </div>
        <div className="flex-shrink-0">
            <Chatbox onAskAI={onAskAI} isLoading={isLoading} onImageUpload={onImageUpload} uploadedImages={uploadedImages} onClearImage={onClearImage} onClearAllImages={onClearAllImages} />
        </div>
    </div>
);
