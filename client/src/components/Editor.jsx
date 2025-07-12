import React from 'react';

export const Editor = ({ fileContent, onChange }) => {
  return (
    <textarea
      value={fileContent}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-full p-4 bg-gray-900 text-gray-200 font-mono text-sm resize-none focus:outline-none"
      spellCheck="false"
      autoCapitalize="off"
      autoCorrect="off"
    />
  );
};
