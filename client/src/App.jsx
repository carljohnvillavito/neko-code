import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { Chatbox } from './components/Chatbox';
import { BottomNavbar } from './components/BottomNavbar';
import { parseAIResponse } from './utils/parseAIResponse';
import { Cat, Code, Eye, BotMessageSquare, AlertTriangle, FolderKanban } from 'lucide-react';

const API_HOST = import.meta.env.VITE_API_HOST;
const API_URL = API_HOST ? `https://${API_HOST}`;

const initialFiles = {
  'index.html': `<!DOCTYPE html>
<html>
  <head>
    <title>AI Code Editor</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <h1>Hello, AI!</h1>
    <p>Ask the AI to build something for you.</p>
    <script src="script.js"></script>
  </body>
</html>`,
  'style.css': `body {
  font-family: sans-serif;
  background-color: #f0f0f0;
  color: #333;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
}
h1 {
  color: #007BFF;
}`,
  'script.js': `console.log("Welcome to the AI Code Editor!");`,
};

// --- STABLE PANE COMPONENTS ---
const EditorPane = ({ activeFile, fileContent, onChange }) => (
  <div className="bg-gray-900 flex flex-col h-full">
    <div className="bg-gray-800 p-2 flex items-center gap-2 border-b border-gray-700 flex-shrink-0">
      <Code size={18} className="text-cyan-400" />
      <h2 className="font-bold">Editor: {activeFile}</h2>
    </div>
    <div className="flex-grow overflow-hidden">
      {activeFile ? (
        <Editor
          activeFile={activeFile}
          fileContent={fileContent}
          onChange={onChange}
        />
      ) : (
        <div className="p-4 text-gray-500">Select a file to start editing.</div>
      )}
    </div>
  </div>
);

const PreviewPane = ({ htmlContent }) => (
  <div className="bg-gray-900 flex flex-col h-full">
    <div className="bg-gray-800 p-2 flex items-center gap-2 border-b border-gray-700 flex-shrink-0">
      <Eye size={18} className="text-lime-400" />
      <h2 className="font-bold">Live Preview</h2>
    </div>
    <div className="flex-grow bg-white">
      <Preview htmlContent={htmlContent} />
    </div>
  </div>
);

const AiPane = ({ error, aiLogs, onAskAI, isLoading }) => (
   <div className="h-full flex flex-col bg-gray-900">
     <div className="bg-gray-800 p-2 flex items-center gap-2 border-b border-gray-700 flex-shrink-0">
        <BotMessageSquare size={18} className="text-pink-400"/>
        <h2 className="font-bold">AI-Agent</h2>
     </div>
     {error && (
        <div className="bg-red-500/20 text-red-300 p-2 flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
        </div>
    )}
    <div className="flex-grow flex flex-col-reverse p-4 overflow-y-auto gap-2">
        {aiLogs.map((log, index) => {
          const isAgentPurr = log.startsWith('Agent-PURR:');
          const isUser = log.startsWith('User:');
          const isError = log.startsWith('Error:');
          const isAction = log.startsWith('Action:');

          const style = isAgentPurr
            ? 'text-pink-400'
            : isUser
            ? 'text-gray-400'
            : isError
            ? 'text-red-400'
            : isAction
            ? 'text-cyan-400'
            : 'text-gray-500';

          return <p key={index} className={`text-sm ${style}`}>{log}</p>
        })}
    </div>
    <div className="flex-shrink-0">
        <Chatbox onAskAI={onAskAI} isLoading={isLoading} />
    </div>
  </div>
);

const FilesPane = ({ files, activeFile, onSelectFile }) => (
  <div className="bg-gray-900 flex flex-col h-full p-2">
      <Sidebar files={files} activeFile={activeFile} onSelectFile={onSelectFile} />
  </div>
);


// --- MAIN APP COMPONENT ---
function App() {
  const [projectFiles, setProjectFiles] = useState(initialFiles);
  const [activeFile, setActiveFile] = useState('index.html');
  const [aiLogs, setAiLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mobileView, setMobileView] = useState('editor');

  const handleFileContentChange = (newContent) => {
    if (newContent === undefined) return;
    setProjectFiles(prevFiles => ({
      ...prevFiles,
      [activeFile]: newContent,
    }));
  };
  
  const applyAIAction = (action) => {
    const { perform, target, content, method } = action;
  
    if (!perform || !target) {
        setError("Invalid AI response from server.");
        return;
    }

    // --- 1. Calculate all state changes ---
    let actionLog = '';
    const conversationalLog = `Agent-PURR: "${method}"`;
    const newProjectFiles = { ...projectFiles };
    let newActiveFile = activeFile;

    if (perform.toUpperCase() === 'ADD') {
        actionLog = `Action: Created file '${target}'.`;
        newProjectFiles[target] = content;
        newActiveFile = target;
    } else if (perform.toUpperCase() === 'UPDATE') {
        actionLog = `Action: Updated file '${target}'.`;
        newProjectFiles[target] = content;
    } else if (perform.toUpperCase() === 'DELETE') {
        actionLog = `Action: Deleted file '${target}'.`;
        delete newProjectFiles[target];
        if (activeFile === target) {
            const remainingFiles = Object.keys(newProjectFiles);
            newActiveFile = remainingFiles.length > 0 ? remainingFiles[0] : null;
        }
    } else {
        setError(`Invalid AI action received: ${perform}`);
        return;
    }

    // --- 2. Apply all state changes at once ---
    setProjectFiles(newProjectFiles);
    setActiveFile(newActiveFile);
    setAiLogs(prev => [actionLog, conversationalLog, ...prev]);
  };

  const constructPrompt = (userInput) => {
    const fileList = Object.keys(projectFiles).join(', ');
    const activeFileContent = projectFiles[activeFile] || "No file is currently active.";
    return `
User Request: "${userInput}"
Current Project File Structure: [${fileList}]
Currently Active File ('${activeFile}'):
---
${activeFileContent}
---
Based on the user request, analyze the project structure and the active file, then generate a response in the required format to modify the project.
`;
  };

  const handleAskAI = async (prompt) => {
    if (!prompt || isLoading) return;
    setIsLoading(true);
    setError(null);
    setAiLogs(prev => [`User: "${prompt}"`, ...prev]);
    const fullPrompt = constructPrompt(prompt);
    try {
      const response = await axios.post(`${API_URL}/api/ask-ai`, { prompt: fullPrompt });
      const aiOutput = response.data.output;
      const parsedAction = parseAIResponse(aiOutput);
      applyAIAction(parsedAction);
    } catch (err) {
      if (err.response) {
        console.error("API Error Response:", err.response.data);
      } else if (err.request) {
        console.error("API No Response:", err.request);
      } else {
        console.error('API Setup Error:', err.message);
      }
      const errorMessage = err.response?.data?.error || err.message || "An unknown error occurred.";
      setError(errorMessage);
      setAiLogs(prev => [`Error: ${errorMessage}`, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectFile = (file) => {
    setActiveFile(file);
    setMobileView('editor');
  };

  const previewContent = useMemo(() => {
    const html = projectFiles['index.html'] || '<h1>No index.html file to display.</h1>';
    const css = projectFiles['style.css'] || '';
    const js = projectFiles['script.js'] || '';
    const withCss = html.replace(
      /<link[^>]*?href=["']style\.css["'][^>]*?>/,
      `<style>${css}</style>`
    );
    const withJs = withCss.replace(
      /<script[^>]*?src=["']script\.js["'][^>]*?><\/script>/,
      `<script>${js}</script>`
    );
    return withJs;
  }, [projectFiles]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-mono">
      <header className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between shadow-md z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Cat className="h-8 w-8 text-pink-400" />
          <h1 className="text-xl font-bold text-white">Neko Code Editor</h1>
        </div>
      </header>
      
      <div className="hidden flex-grow md:flex md:flex-row overflow-hidden">
        <div className="w-64 bg-gray-800/50 border-r border-gray-700 overflow-y-auto p-2">
           <Sidebar files={projectFiles} activeFile={activeFile} onSelectFile={setActiveFile} />
        </div>
        <div className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-px bg-gray-700">
            <EditorPane activeFile={activeFile} fileContent={projectFiles[activeFile]} onChange={handleFileContentChange} />
            <PreviewPane htmlContent={previewContent} />
          </div>
          <div className="h-1/3 flex flex-col bg-gray-800/50 border-t border-gray-700">
             <AiPane error={error} aiLogs={aiLogs} onAskAI={handleAskAI} isLoading={isLoading} />
          </div>
        </div>
      </div>
      
      <main className="flex-grow md:hidden overflow-hidden pb-16">
        {mobileView === 'editor' && <EditorPane activeFile={activeFile} fileContent={projectFiles[activeFile]} onChange={handleFileContentChange} />}
        {mobileView === 'preview' && <PreviewPane htmlContent={previewContent} />}
        {mobileView === 'files' && <FilesPane files={projectFiles} activeFile={activeFile} onSelectFile={handleSelectFile} />}
        {mobileView === 'ai' && <AiPane error={error} aiLogs={aiLogs} onAskAI={handleAskAI} isLoading={isLoading} />}
      </main>
      
      <BottomNavbar activeView={mobileView} setActiveView={setMobileView} />
    </div>
  );
}

export default App;
