import React from 'react';
import { Editor as MonacoEditor } from '@monaco-editor/react';

// A helper to determine the language from the filename
const getLanguageFromFileName = (fileName) => {
  const extension = fileName.split('.').pop();
  switch (extension) {
    case 'js':
      return 'javascript';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
};

export const Editor = ({ fileContent, onChange, activeFile }) => {
  const language = getLanguageFromFileName(activeFile);

  return (
    <MonacoEditor
      height="100%"
      language={language}
      theme="vs-dark" // Matches our app's dark theme
      value={fileContent}
      onChange={onChange}
      options={{
        minimap: {
          enabled: false, // Good for smaller screens
        },
        fontSize: 14,
        wordWrap: 'on', // Important for readability
        automaticLayout: true, // Ensures editor resizes correctly
        scrollBeyondLastLine: false,
        roundedSelection: false,
        contextmenu: true,
      }}
    />
  );
};
