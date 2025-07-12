import React, { useState } from 'react';
import axios from 'axios';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { Chatbox } from './components/Chatbox';
import { BottomNavbar } from './components/BottomNavbar'; // Import new component
import { parseAIResponse } from './utils/parseAIResponse';
import { Cat, Code, Eye, BotMessageSquare, AlertTriangle, FolderKanban } from 'lucide-react';

// Build the full API URL from the host provided by Render's env var.
const API_HOST = import.meta.env.VITE_API_HOST;
const API_URL = API_HOST ? `https://${API_HOST}` : 'http://localhost:5001';

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

function App() {
  const [projectFiles, setProjectFiles] = useState(initialFiles);
  const [activeFile, setActiveFile] = useState('index.html');
  const [aiLogs, setAiLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mobileView, setMobileView] = useState('editor'); // State for mobile view

  const handleFileContentChange = (fileName, newContent) => {
    setProjectFiles(prevFiles => ({
      ...prevFiles,
      [fileName]: newContent,
    }));
  };
  
  const applyAIAction = (action) => {
    const { perform, target, content, method } = action;
  
    if (!perform || !target) {
        throw new Error("Invalid AI response: 'PERFORM' and 'TARGET' are required.");
    }
  
    let logMessage = `AI message: "${method}"`;
    setAiLogs(prev => [logMessage, ...prev]);

    setProjectFiles(prevFiles => {
      const updatedFiles = { ...prevFiles };
  
      if (perform.toUpperCase() === 'ADD') {
        if (updatedFiles.hasOwnProperty(target)) {
            logMessage = `AI tried to ADD existing file: ${target}. Updating instead.`;
        } else {
            logMessage = `AI created file: ${target}`;
        }
        updatedFiles[target] = content;
        setActiveFile(target);
      } else if (perform.toUpperCase() === 'UPDATE') {
        if (!updatedFiles.hasOwnProperty(target)) {
          logMessage = `AI tried to UPDATE non-existent file: ${target}. Creating it instead.`;
        } else {
          logMessage = `AI updated file: ${target}`;
        }
        updatedFiles[target] = content;
      } else if (perform.toUpperCase() === 'DELETE') {
        if (!updatedFiles.hasOwnProperty(target)) {
            logMessage = `AI tried to DELETE non-existent file: ${target}.`;
        } else {
            delete updatedFiles[target];
            if (activeFile === target) {
              const remainingFiles = Object.keys(updatedFiles);
              setActiveFile(remainingFiles.length > 0 ? remainingFiles[0] : null);
            }
        }
      } else {
        throw new Error(`Invalid AI action: PERFORM must be ADD, UPDATE, or DELETE.`);
      }

      setAiLogs(prev => [logMessage, ...prev]);
      return updatedFiles;
    });
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
      const errorMessage = err.response?.data?.error || err.message || "An unknown error occurred.";
      console.error("Error during AI interaction:", errorMessage);
      setError(errorMessage);
      setAiLogs(prev => [`Error: ${errorMessage}`, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectFile = (file) => {
    setActiveFile(file);
    setMobileView('editor'); // Switch to editor view on file selection
  }

  // Individual pane components for better reuse
  const EditorPane = () => (
    <div className="bg-gray-900 flex flex-col h-full">
      <div className="bg-gray-800 p-2 flex items-center gap-2 border-b border-gray-700">
        <Code size={18} className="text-cyan-400" />
        <h2 className="font-bold">Editor: {activeFile}</h2>
      </div>
      <div className="flex-grow overflow-auto">
        {activeFile ? (
          <Editor fileContent={projectFiles[activeFile]} onChange={(c) => handleFileContentChange(activeFile, c)} />
        ) : (
          <div className="p-4 text-gray-500">Select a file to start editing.</div>
        )}
      </div>
    </div>
  );

  const PreviewPane = () => (
    <div className="bg-gray-900 flex flex-col h-full">
      <div className="bg-gray-800 p-2 flex items-center gap-2 border-b border-gray-700">
        <Eye size={18} className="text-lime-400" />
        <h2 className="font-bold">Live Preview</h2>
      </div>
      <div className="flex-grow bg-white">
        <Preview htmlContent={projectFiles['index.html'] || ''} />
      </div>
    </div>
  );

  const AiPane = () => (
     <div className="h-full flex flex-col bg-gray-900">
       <div className="bg-gray-800 p-2 flex items-center gap-2 border-b border-gray-700">
          <BotMessageSquare size={18} className="text-pink-400"/>
          <h2 className="font-bold">AI Assistant (Neko)</h2>
       </div>
       {error && (
          <div className="bg-red-500/20 text-red-300 p-2 flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error}</span>
          </div>
      )}
      <div className="flex-grow flex flex-col-reverse p-4 overflow-y-auto gap-2">
          {aiLogs.map((log, index) => (
              <p key={index} className={`text-sm ${log.startsWith('Error:') ? 'text-red-400' : 'text-gray-400'}`}>{log}</p>
          ))}
      </div>
      <Chatbox onAskAI={handleAskAI} isLoading={isLoading} />
    </div>
  );
  
  const FilesPane = () => (
    <div className="bg-gray-900 flex flex-col h-full p-2">
        <Sidebar files={projectFiles} activeFile={activeFile} onSelectFile={handleSelectFile} />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-mono">
      <header className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between shadow-md z-20">
        <div className="flex items-center gap-3">
          <Cat className="h-8 w-8 text-pink-400" />
          <h1 className="text-xl font-bold text-white">Neko Code Editor</h1>
        </div>
      </header>
      
      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden flex-grow md:flex md:flex-row overflow-hidden">
        <div className="w-64 bg-gray-800/50 border-r border-gray-700 overflow-y-auto p-2">
           <Sidebar files={projectFiles} activeFile={activeFile} onSelectFile={setActiveFile} />
        </div>
        <div className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-px bg-gray-700">
            <EditorPane />
            <PreviewPane />
          </div>
          <div className="h-1/3 flex flex-col bg-gray-800/50 border-t border-gray-700">
             <AiPane />
          </div>
        </div>
      </div>
      
      {/* --- MOBILE LAYOUT --- */}
      <main className="flex-grow md:hidden overflow-y-auto pb-16">
        {mobileView === 'editor' && <EditorPane />}
        {mobileView === 'preview' && <PreviewPane />}
        {mobileView === 'files' && <FilesPane />}
        {mobileView === 'ai' && <AiPane />}
      </main>
      
      <BottomNavbar activeView={mobileView} setActiveView={setMobileView} />
    </div>
  );
}

export default App;
