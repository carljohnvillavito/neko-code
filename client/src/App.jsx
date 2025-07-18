import React, { useState, useMemo, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import axios from 'axios';
import JSZip from 'jszip';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { Chatbox } from './components/Chatbox';
import { BottomNavbar } from './components/BottomNavbar';
import { parseAIResponse } from './utils/parseAIResponse';
import { AIPane } from './components/AIPane';
import { SettingsModal } from './components/SettingsModal';
import { Cat, Code, Eye, BotMessageSquare, AlertTriangle, FolderKanban, Trash2, Smartphone, Laptop, Camera, RefreshCw, LoaderCircle, CheckCircle2, Download, X } from 'lucide-react';

const API_URL = '/api'; // Use relative path for Vercel rewrites

const initialFiles = {
  'index.html': `<!DOCTYPE html><html><head><title>AI Code Editor</title><link rel="stylesheet" href="style.css"></head><body><h1>Hello, AI!</h1><p>Ask the AI to build something for you.</p><script src="script.js"></script></body></html>`,
  'style.css': `body { font-family: sans-serif; background-color: #f0f0f0; color: #333; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; } h1 { color: #007BFF; }`,
  'script.js': `console.log("Welcome to the AI Code Editor!");`,
};

// --- STABLE PANE COMPONENTS ---
const EditorPane = ({ activeFile, fileContent, onChange }) => (<div className="bg-gray-900 flex flex-col h-full"><div className="bg-gray-800 p-2 flex items-center gap-2 border-b border-gray-700 flex-shrink-0"><Code size={18} className="text-cyan-400" /><h2 className="font-bold">Editor: {activeFile}</h2></div><div className="flex-grow overflow-hidden">{activeFile ? (<Editor activeFile={activeFile} fileContent={fileContent} onChange={onChange} />) : (<div className="p-4 text-gray-500">Select a file to start editing.</div>)}</div></div>);
const PreviewPane = ({ htmlContent, iframeRef, isDesktopView, onToggle, onRefresh, onScreenshot, onDownload }) => (<div className="bg-gray-900 flex flex-col h-full"><div className="bg-gray-800 p-2 flex items-center justify-between border-b border-gray-700 flex-shrink-0"><div className="flex items-center gap-2"><Eye size={18} className="text-lime-400" /><h2 className="font-bold">Live Preview</h2></div><div className="flex items-center gap-2"><button onClick={onToggle} title="Toggle View" className="p-1 text-gray-400 hover:text-white transition-colors">{isDesktopView ? <Smartphone size={18} /> : <Laptop size={18} />}</button><button onClick={onScreenshot} title="Take Screenshot" className="p-1 text-gray-400 hover:text-white transition-colors"><Camera size={18} /></button><button onClick={onRefresh} title="Refresh Preview" className="p-1 text-gray-400 hover:text-white transition-colors"><RefreshCw size={18} /></button><button onClick={onDownload} title="Download Project" className="p-1 text-gray-400 hover:text-white transition-colors"><Download size={18} /></button></div></div><div className="flex-grow bg-gray-700 relative overflow-hidden"><Preview ref={iframeRef} htmlContent={htmlContent} isDesktopView={isDesktopView} /></div></div>);
const FilesPane = ({ files, activeFile, onSelectFile }) => (<div className="bg-gray-900 flex flex-col h-full p-2"><Sidebar files={files} activeFile={activeFile} onSelectFile={onSelectFile} /></div>);
const DownloadModal = ({ onDownload, onClose }) => { const [filename, setFilename] = useState('neko-project'); const handleDownload = () => { const sanitized = filename.replace(/\s+/g, '_') || 'neko-project'; onDownload(sanitized); onClose(); }; return (<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in"><div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm animate-scale-in"><h3 className="text-lg font-bold mb-4">Download Project</h3><p className="text-sm text-gray-400 mb-2">Enter a filename for your .zip file.</p><input type="text" value={filename} onChange={(e) => setFilename(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 mb-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500" /><div className="flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-sm">Cancel</button><button onClick={handleDownload} className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-md text-sm font-bold">Download</button></div><button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white"><X size={20} /></button></div></div>); };

// --- MAIN APP COMPONENT ---
function App() {
  const [projectFiles, setProjectFiles] = useState(() => { try { const sf = localStorage.getItem('neko-project-files'); return sf ? JSON.parse(sf) : initialFiles; } catch (e) { return initialFiles; } });
  const [activeFile, setActiveFile] = useState('index.html');
  const [aiLogs, setAiLogs] = useState(() => { try { const sl = localStorage.getItem('neko-ai-logs'); return sl ? JSON.parse(sl) : []; } catch(e) { return []; }});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mobileView, setMobileView] = useState('editor');
  const [isPreviewDesktop, setIsPreviewDesktop] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('neko-api-key') || '');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('neko-model') || 'gemini-1.5-pro-latest');
  const [selectedTone, setSelectedTone] = useState(() => localStorage.getItem('neko-tone') || 'Creative');
  const iframeRef = useRef(null);
  
  useEffect(() => { localStorage.setItem('neko-project-files', JSON.stringify(projectFiles)); }, [projectFiles]);
  useEffect(() => { localStorage.setItem('neko-ai-logs', JSON.stringify(aiLogs)); }, [aiLogs]);

  const handleFileContentChange = (newContent) => { if (newContent !== undefined) setProjectFiles(p => ({...p, [activeFile]: newContent})); };
  
  const handleSettingsSave = (settings) => { setApiKey(settings.apiKey); setSelectedModel(settings.model); setSelectedTone(settings.tone); localStorage.setItem('neko-api-key', settings.apiKey); localStorage.setItem('neko-model', settings.model); localStorage.setItem('neko-tone', settings.tone); };
  const handleClearApiKey = () => { setApiKey(''); localStorage.removeItem('neko-api-key'); };

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const applyAIActions = async (actions) => {
    if (!actions || actions.length === 0) {
        setAiLogs(prev => [{ id: Date.now(), type: 'agent-info', content: '(No file actions were performed.)' }, ...prev]);
        return;
    }
    const pendingLogs = actions.map(action => { let verb = action.perform.toLowerCase(); if (verb.endsWith('e')) { verb = verb.slice(0, -1); } const pendingVerb = verb.charAt(0).toUpperCase() + verb.slice(1) + "ing"; return { id: Date.now() + Math.random(), type: 'action', status: 'pending', content: `${pendingVerb} file '${action.target}'...`}; });
    setAiLogs(prev => [...pendingLogs.reverse(), ...prev]);
    let tempActiveFile = activeFile;
    for (let i = 0; i < actions.length; i++) {
        await delay(1000);
        const action = actions[i];
        const logToUpdate = pendingLogs[i];
        setProjectFiles(currentFiles => {
            const newFiles = { ...currentFiles };
            const upperPerform = action.perform.toUpperCase() === 'REPLACE' ? 'UPDATE' : action.perform.toUpperCase();
            if (upperPerform === 'ADD') { newFiles[action.target] = action.content || ''; tempActiveFile = action.target; }
            else if (upperPerform === 'UPDATE') { newFiles[action.target] = action.content || ''; }
            else if (upperPerform === 'DELETE') { delete newFiles[action.target]; if (tempActiveFile === action.target) { const r = Object.keys(newFiles); tempActiveFile = r.length > 0 ? r[0] : null; } }
            return newFiles;
        });
        setAiLogs(prevLogs => prevLogs.map(log => {
            if (log.id === logToUpdate.id) {
                let verb = action.perform.toLowerCase(); let pastTenseVerb;
                if (verb === 'add') { pastTenseVerb = 'Added'; }
                else if (verb === 'replace' || verb === 'update') { pastTenseVerb = 'Updated'; }
                else if (verb === 'delete') { pastTenseVerb = 'Deleted'; }
                else { pastTenseVerb = verb.charAt(0).toUpperCase() + verb.slice(1) + "ed"; }
                return { ...log, status: 'complete', content: `Action: ${pastTenseVerb} file '${action.target}'.`};
            }
            return log;
        }));
    }
    setActiveFile(tempActiveFile);
  };

  const constructEnhancedPrompt = (userInput) => { let fc = "FULL PROJECT CONTEXT:\n\n"; for (const fn in projectFiles) { fc += `--- File: ${fn} ---\n${projectFiles[fn]}\n\n`; } return `${fc}USER REQUEST: "${userInput}"\n\nBased on the FULL PROJECT CONTEXT, fulfill the user's request.`; };

  const handleAskAI = async (prompt, images) => {
    if (!apiKey) { setError("API Key is required. Please add it in the settings."); return; }
    if (!prompt && (!images || images.length === 0)) return;
    setIsLoading(true); setError(null);
    setAiLogs(prev => [{ id: Date.now(), type: 'user', content: `User: "${prompt}"`, images: images }, ...prev]);
    const agentLogId = Date.now() + 1;
    setAiLogs(prev => [{ id: agentLogId, type: 'agent-purr', content: 'Agent-PURR: Thinking...' }, ...prev]);
    let thinkingInterval = setInterval(() => { setAiLogs(prev => prev.map(log => log.id === agentLogId ? { ...log, content: log.content.endsWith('...') ? 'Agent-PURR: Thinking.' : log.content + '.' } : log)); }, 500);
    const fullPrompt = constructEnhancedPrompt(prompt);
    try {
        const payload = { prompt: fullPrompt, images, apiKey, model: selectedModel, tone: selectedTone };
        const response = await axios.post(`${API_URL}/ask-ai`, payload);
        clearInterval(thinkingInterval);
        const parsed = parseAIResponse(response.data.output);
        setAiLogs(prev => prev.map(log => log.id === agentLogId ? { ...log, content: `Agent-PURR: "${parsed.intro}"` } : log));
        await delay(1000);
        await applyAIActions(parsed.actions);
    } catch (err) {
        clearInterval(thinkingInterval);
        setAiLogs(prev => prev.filter(log => log.id !== agentLogId));
        console.error("Request failed:", err);
        setError(err.response?.data?.error || err.message || "An unknown error occurred.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (files) {
      const promises = Array.from(files).map(file => { return new Promise((resolve) => { const reader = new FileReader(); reader.onloadend = () => { resolve(reader.result.replace('data:', '').replace(/^.+,/, '')); }; reader.readAsDataURL(file); }); });
      Promise.all(promises).then(base64Strings => { setUploadedImages(prev => [...prev, ...base64Strings]); });
      e.target.value = null;
    }
  };

  const handleClearImage = (indexToRemove) => setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  const handleClearAllImages = () => setUploadedImages([]);
  const handleDownloadProject = async (filename) => { const zip = new JSZip(); Object.keys(projectFiles).forEach(name => { zip.file(name, projectFiles[name]); }); const content = await zip.generateAsync({ type: "blob" }); const link = document.createElement("a"); link.href = URL.createObjectURL(content); link.download = `${filename}.zip`; document.body.appendChild(link); link.click(); document.body.removeChild(link); };
  const handleResetProject = () => { if (window.confirm("Are you sure? All files and chat history will be deleted.")) { localStorage.removeItem('neko-project-files'); localStorage.removeItem('neko-ai-logs'); localStorage.removeItem('neko-api-key'); localStorage.removeItem('neko-model'); localStorage.removeItem('neko-tone'); setProjectFiles(initialFiles); setAiLogs([]); setActiveFile('index.html'); }};
  const handleTogglePreviewMode = () => setIsPreviewDesktop(prev => !prev);
  const handleRefreshPreview = () => { if (iframeRef.current) iframeRef.current.contentWindow.location.reload(); };
  const handleScreenshot = async () => { if (!iframeRef.current) return; try { const b = iframeRef.current.contentWindow.document.body; const c = await html2canvas(b, { width: isPreviewDesktop ? 1280 : b.scrollWidth, height: isPreviewDesktop ? 720 : b.scrollHeight, windowWidth: isPreviewDesktop ? 1280 : b.scrollWidth, windowHeight: isPreviewDesktop ? 720 : b.scrollHeight }); const i = c.toDataURL('image/jpeg', 0.9); const l = document.createElement('a'); l.href = i; l.download = 'neko-screenshot.jpeg'; document.body.appendChild(l); l.click(); document.body.removeChild(l); } catch(e) { alert("Could not take screenshot."); }};
  
  const previewContent = useMemo(() => {
    let html = projectFiles['index.html'] || '<h1>No index.html file found.</h1>';
    html = html.replace(/<link[^>]*?href=["'](.*?)["'][^>]*?>/g, (match, href) => { if (projectFiles[href] && !href.startsWith('http')) { return `<style>\n${projectFiles[href]}\n</style>`; } return match; });
    html = html.replace(/<script[^>]*?src=["'](.*?)["'][^>]*?><\/script>/g, (match, src) => { if (projectFiles[src] && !src.startsWith('http')) { return `<script>\n${projectFiles[src]}\n</script>`; } return match; });
    return html;
  }, [projectFiles]);

  const handleSelectFile = (file) => { setActiveFile(file); setMobileView('editor'); };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-mono">
      {showDownloadModal && <DownloadModal onDownload={handleDownloadProject} onClose={() => setShowDownloadModal(false)} />}
      {showSettingsModal && <SettingsModal initialApiKey={apiKey} initialModel={selectedModel} initialTone={selectedTone} onSave={handleSettingsSave} onClearApiKey={handleClearApiKey} onClose={() => setShowSettingsModal(false)} />}
      <header className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between shadow-md z-20 flex-shrink-0"><div className="flex items-center gap-3"><Cat className="h-8 w-8 text-pink-400" /><h1 className="text-xl font-bold text-white">Neko Code Editor</h1></div><button onClick={handleResetProject} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Reset Project"><Trash2 size={20} /></button></header>
      <div className="hidden flex-grow md:flex md:flex-row overflow-hidden">
        <div className="w-64 bg-gray-800/50 border-r border-gray-700 overflow-y-auto p-2"><Sidebar files={projectFiles} activeFile={activeFile} onSelectFile={setActiveFile} /></div>
        <div className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-px bg-gray-700">
            <EditorPane activeFile={activeFile} fileContent={projectFiles[activeFile]} onChange={handleFileContentChange} />
            <PreviewPane htmlContent={previewContent} iframeRef={iframeRef} isDesktopView={isPreviewDesktop} onToggle={handleTogglePreviewMode} onRefresh={handleRefreshPreview} onScreenshot={handleScreenshot} onDownload={() => setShowDownloadModal(true)} />
          </div>
          <div className="h-1/3 flex flex-col bg-gray-800/50 border-t border-gray-700"><AIPane error={error} aiLogs={aiLogs} onAskAI={(prompt, images) => handleAskAI(prompt, images)} isLoading={isLoading} onImageUpload={handleImageUpload} uploadedImages={uploadedImages} onClearImage={handleClearImage} onClearAllImages={handleClearAllImages} onSettingsOpen={() => setShowSettingsModal(true)} /></div>
        </div>
      </div>
      <main className="flex-grow md:hidden relative overflow-hidden pb-16">
        <div className={`h-full ${mobileView === 'editor' ? 'block' : 'hidden'}`}><EditorPane activeFile={activeFile} fileContent={projectFiles[activeFile]} onChange={handleFileContentChange} /></div>
        <div className={`h-full ${mobileView === 'preview' ? 'block' : 'hidden'}`}><PreviewPane htmlContent={previewContent} iframeRef={iframeRef} isDesktopView={isPreviewDesktop} onToggle={handleTogglePreviewMode} onRefresh={handleRefreshPreview} onScreenshot={handleScreenshot} onDownload={() => setShowDownloadModal(true)} /></div>
        <div className={`h-full ${mobileView === 'files' ? 'block' : 'hidden'}`}><FilesPane files={projectFiles} activeFile={activeFile} onSelectFile={handleSelectFile} /></div>
        <div className={`h-full ${mobileView === 'ai' ? 'block' : 'hidden'}`}><AIPane error={error} aiLogs={aiLogs} onAskAI={(prompt, images) => handleAskAI(prompt, images)} isLoading={isLoading} onImageUpload={handleImageUpload} uploadedImages={uploadedImages} onClearImage={handleClearImage} onClearAllImages={handleClearAllImages} onSettingsOpen={() => setShowSettingsModal(true)} /></div>
      </main>
      <BottomNavbar activeView={mobileView} setActiveView={setMobileView} />
    </div>
  );
}

export default App;
