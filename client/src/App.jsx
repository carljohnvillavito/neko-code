import React, { useState, useMemo, useEffect, useRef } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { Chatbox } from './components/Chatbox';
import { BottomNavbar } from './components/BottomNavbar';
import { parseAIResponse } from './utils/parseAIResponse';
import { Cat, Code, Eye, BotMessageSquare, AlertTriangle, FolderKanban, Trash2, Smartphone, Laptop, Camera, RefreshCw, LoaderCircle, CheckCircle2 } from 'lucide-react';

const API_HOST = import.meta.env.VITE_API_HOST;
const API_URL = API_HOST ? `https://${API_HOST}.onrender.com` : 'http://localhost:5001';

const initialFiles = {
  'index.html': `<!DOCTYPE html><html><head><title>AI Code Editor</title><link rel="stylesheet" href="style.css"></head><body><h1>Hello, AI!</h1><p>Ask the AI to build something for you.</p><script src="script.js"></script></body></html>`,
  'style.css': `body { font-family: sans-serif; background-color: #f0f0f0; color: #333; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; } h1 { color: #007BFF; }`,
  'script.js': `console.log("Welcome to the AI Code Editor!");`,
};

// --- STABLE PANE COMPONENTS ---
const EditorPane = ({ activeFile, fileContent, onChange }) => (
  <div className="bg-gray-900 flex flex-col h-full"><div className="bg-gray-800 p-2 flex items-center gap-2 border-b border-gray-700 flex-shrink-0"><Code size={18} className="text-cyan-400" /><h2 className="font-bold">Editor: {activeFile}</h2></div><div className="flex-grow overflow-hidden">{activeFile ? (<Editor activeFile={activeFile} fileContent={fileContent} onChange={onChange} />) : (<div className="p-4 text-gray-500">Select a file to start editing.</div>)}</div></div>);
const PreviewPane = ({ htmlContent, iframeRef, isDesktopView, onToggle, onRefresh, onScreenshot }) => (<div className="bg-gray-900 flex flex-col h-full"><div className="bg-gray-800 p-2 flex items-center justify-between border-b border-gray-700 flex-shrink-0"><div className="flex items-center gap-2"><Eye size={18} className="text-lime-400" /><h2 className="font-bold">Live Preview</h2></div><div className="flex items-center gap-2"><button onClick={onToggle} title={isDesktopView ? "Switch to Mobile View" : "Switch to Desktop View"} className="p-1 text-gray-400 hover:text-white transition-colors">{isDesktopView ? <Smartphone size={18} /> : <Laptop size={18} />}</button><button onClick={onScreenshot} title="Take Screenshot" className="p-1 text-gray-400 hover:text-white transition-colors"><Camera size={18} /></button><button onClick={onRefresh} title="Refresh Preview" className="p-1 text-gray-400 hover:text-white transition-colors"><RefreshCw size={18} /></button></div></div><div className="flex-grow bg-white relative overflow-hidden"><Preview ref={iframeRef} htmlContent={htmlContent} isDesktopView={isDesktopView} /></div></div>);
const FilesPane = ({ files, activeFile, onSelectFile }) => (<div className="bg-gray-900 flex flex-col h-full p-2"><Sidebar files={files} activeFile={activeFile} onSelectFile={onSelectFile} /></div>);

const AiPane = ({ error, aiLogs, onAskAI, isLoading }) => (
   <div className="h-full flex flex-col bg-gray-900"><div className="bg-gray-800 p-2 flex items-center gap-2 border-b border-gray-700 flex-shrink-0"><BotMessageSquare size={18} className="text-pink-400"/><h2 className="font-bold">AI-Agent</h2></div>{error && (<div className="bg-red-500/20 text-red-300 p-2 flex items-center gap-2"><AlertTriangle size={16} /><span>{error}</span></div>)}<div className="flex-grow flex flex-col-reverse p-4 overflow-y-auto gap-2">
        {aiLogs.map((log) => {
            let style = 'text-gray-500';
            let icon = null;
            if (log.type === 'agent-purr') style = 'text-pink-400';
            if (log.type === 'user') style = 'text-gray-400';
            if (log.type === 'error') style = 'text-red-400';
            if (log.type === 'action') {
              style = 'text-cyan-400 flex items-center gap-2';
              if (log.status === 'pending') icon = <LoaderCircle size={14} className="animate-spin" />;
              if (log.status === 'complete') icon = <CheckCircle2 size={14} className="text-green-500" />;
            }
            return <p key={log.id} className={`text-sm ${style}`}>{icon}{log.content}</p>
        })}
    </div><div className="flex-shrink-0"><Chatbox onAskAI={onAskAI} isLoading={isLoading} /></div></div>);


// --- MAIN APP COMPONENT ---
function App() {
  const [projectFiles, setProjectFiles] = useState(() => { try { const sf = localStorage.getItem('neko-project-files'); return sf ? JSON.parse(sf) : initialFiles; } catch (e) { return initialFiles; } });
  const [activeFile, setActiveFile] = useState('index.html');
  const [aiLogs, setAiLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mobileView, setMobileView] = useState('editor');
  const [isPreviewDesktop, setIsPreviewDesktop] = useState(false);
  const iframeRef = useRef(null);
  
  useEffect(() => { localStorage.setItem('neko-project-files', JSON.stringify(projectFiles)); }, [projectFiles]);

  const handleFileContentChange = (newContent) => { if (newContent !== undefined) setProjectFiles(p => ({...p, [activeFile]: newContent})); };
  
  const applyAIActions = (actions) => {
    const actionLogs = actions.map(action => ({
      id: Date.now() + Math.random(),
      type: 'action',
      status: 'pending',
      content: `${action.perform.charAt(0).toUpperCase() + action.perform.slice(1).toLowerCase()} file '${action.target}'...`
    }));
    setAiLogs(prev => [...actionLogs.reverse(), ...prev]);

    let finalProjectFiles = { ...projectFiles };
    let finalActiveFile = activeFile;

    for (const action of actions) {
        const { perform, target, content } = action;
        const upperPerform = perform.toUpperCase();
        if (upperPerform === 'ADD') { finalProjectFiles[target] = content || ''; finalActiveFile = target; }
        else if (upperPerform === 'UPDATE') { finalProjectFiles[target] = content || ''; }
        else if (upperPerform === 'DELETE') {
            delete finalProjectFiles[target];
            if (finalActiveFile === target) {
                const remaining = Object.keys(finalProjectFiles);
                finalActiveFile = remaining.length > 0 ? remaining[0] : null;
            }
        }
    }
    setProjectFiles(finalProjectFiles);
    setActiveFile(finalActiveFile);

    setAiLogs(prev => prev.map(log => {
        const correspondingAction = actions.find(a => log.content.includes(a.target) && log.content.toLowerCase().includes(a.perform.toLowerCase()));
        if (log.type === 'action' && log.status === 'pending' && correspondingAction) {
            return { ...log, status: 'complete', content: `Action: ${correspondingAction.perform.charAt(0).toUpperCase() + correspondingAction.perform.slice(1)}d file '${correspondingAction.target}'.` };
        }
        return log;
    }));
  };

  const constructEnhancedPrompt = (userInput) => {
    let fullContext = "FULL PROJECT CONTEXT:\n\n";
    for (const fileName in projectFiles) { fullContext += `--- File: ${fileName} ---\n${projectFiles[fileName]}\n\n`; }
    return `${fullContext}USER REQUEST: "${userInput}"\n\nBased on the FULL PROJECT CONTEXT, fulfill the user's request.`;
  };

  const handleAskAI = async (prompt) => {
    if (!prompt || isLoading) return;
    setIsLoading(true);
    setError(null);

    const userLogId = Date.now();
    setAiLogs(prev => [{ id: userLogId, type: 'user', content: `User: "${prompt}"` }, ...prev]);
    
    const agentLogId = userLogId + 1;
    setAiLogs(prev => [{ id: agentLogId, type: 'agent-purr', content: 'Agent-PURR: ' }, ...prev]);

    const fullPrompt = constructEnhancedPrompt(prompt);
    
    let eventSource;
    try {
      eventSource = new EventSource(`${API_URL}/api/ask-ai-stream?prompt=${encodeURIComponent(fullPrompt)}`);
      
      let messageBuffer = '';
      let jsonBuffer = '';
      let methodEnded = false;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.error) {
          setError(data.error);
          eventSource.close();
          return;
        }

        if (data.event === 'end') {
          eventSource.close();
          setIsLoading(false);
          const parsedResponse = parseAIResponse(messageBuffer + jsonBuffer);
          if (parsedResponse.actions && parsedResponse.actions.length > 0) {
            applyAIActions(parsedResponse.actions);
          }
          return;
        }

        messageBuffer += data.text;
        
        if (!methodEnded && messageBuffer.includes('<<END_OF_METHOD>>')) {
            methodEnded = true;
            const parts = messageBuffer.split('<<END_OF_METHOD>>');
            setAiLogs(prev => prev.map(log => log.id === agentLogId ? { ...log, content: `Agent-PURR: ${parts[0]}` } : log));
            jsonBuffer = parts[1] || '';
        } else if (!methodEnded) {
            setAiLogs(prev => prev.map(log => log.id === agentLogId ? { ...log, content: `Agent-PURR: ${messageBuffer}` } : log));
        } else {
            jsonBuffer += data.text;
        }
      };

      eventSource.onerror = (err) => {
        console.error("EventSource failed:", err);
        setError("A streaming connection error occurred.");
        setIsLoading(false);
        eventSource.close();
      };
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      if(eventSource) eventSource.close();
    }
  };

  const handleResetProject = () => { if (window.confirm("Are you sure?")) { localStorage.removeItem('neko-project-files'); setProjectFiles(initialFiles); setActiveFile('index.html'); setAiLogs([]); }};
  const handleTogglePreviewMode = () => setIsPreviewDesktop(prev => !prev);
  const handleRefreshPreview = () => { if (iframeRef.current) iframeRef.current.contentWindow.location.reload(); };
  const handleScreenshot = async () => { if (!iframeRef.current) return; try { const b = iframeRef.current.contentWindow.document.body; const c = await html2canvas(b, { width: isPreviewDesktop ? 1280 : b.scrollWidth, height: isPreviewDesktop ? 720 : b.scrollHeight, windowWidth: isPreviewDesktop ? 1280 : b.scrollWidth, windowHeight: isPreviewDesktop ? 720 : b.scrollHeight }); const i = c.toDataURL('image/jpeg', 0.9); const l = document.createElement('a'); l.href = i; l.download = 'neko-screenshot.jpeg'; document.body.appendChild(l); l.click(); document.body.removeChild(l); } catch(e) { alert("Could not take screenshot."); }};
  const previewContent = useMemo(() => { if (!projectFiles || !projectFiles['index.html']) return '<h1>...</h1>'; const h = projectFiles['index.html']; const c = projectFiles['style.css'] || ''; const j = projectFiles['script.js'] || ''; const hc = h.replace(/<link[^>]*?href=["']style\.css["'][^>]*?>/, `<style>${c}</style>`); return hc.replace(/<script[^>]*?src=["']script\.js["'][^>]*?><\/script>/, `<script>${j}</script>`); }, [projectFiles]);
  const handleSelectFile = (file) => { setActiveFile(file); setMobileView('editor'); };

  // --- Main Render ---
  return (<div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-mono"><header className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between shadow-md z-20 flex-shrink-0"><div className="flex items-center gap-3"><Cat className="h-8 w-8 text-pink-400" /><h1 className="text-xl font-bold text-white">Neko Code Editor</h1></div><button onClick={handleResetProject} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Reset Project"><Trash2 size={20} /></button></header><div className="hidden flex-grow md:flex md:flex-row overflow-hidden"><div className="w-64 bg-gray-800/50 border-r border-gray-700 overflow-y-auto p-2"><Sidebar files={projectFiles} activeFile={activeFile} onSelectFile={setActiveFile} /></div><div className="flex-grow flex flex-col overflow-hidden"><div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-px bg-gray-700"><EditorPane activeFile={activeFile} fileContent={projectFiles[activeFile]} onChange={handleFileContentChange} /><PreviewPane htmlContent={previewContent} iframeRef={iframeRef} isDesktopView={isPreviewDesktop} onToggle={handleTogglePreviewMode} onRefresh={handleRefreshPreview} onScreenshot={handleScreenshot} /></div><div className="h-1/3 flex flex-col bg-gray-800/50 border-t border-gray-700"><AiPane error={error} aiLogs={aiLogs} onAskAI={handleAskAI} isLoading={isLoading} /></div></div></div><main className="flex-grow md:hidden overflow-hidden pb-16">{mobileView === 'editor' && <EditorPane activeFile={activeFile} fileContent={projectFiles[activeFile]} onChange={handleFileContentChange} />}{mobileView === 'preview' && <PreviewPane htmlContent={previewContent} iframeRef={iframeRef} isDesktopView={isPreviewDesktop} onToggle={handleTogglePreviewMode} onRefresh={handleRefreshPreview} onScreenshot={handleScreenshot} />}{mobileView === 'files' && <FilesPane files={projectFiles} activeFile={activeFile} onSelectFile={handleSelectFile} />}{mobileView === 'ai' && <AiPane error={error} aiLogs={aiLogs} onAskAI={handleAskAI} isLoading={isLoading} />}</main><BottomNavbar activeView={mobileView} setActiveView={setMobileView} /></div>);
}

export default App;
