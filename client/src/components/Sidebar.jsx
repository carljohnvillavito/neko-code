import React from 'react';
import { FileCode2, FilePlus } from 'lucide-react';

export const Sidebar = ({ files, activeFile, onSelectFile }) => {
  const fileList = Object.keys(files);

  return (
    <div className="h-full flex flex-col">
        <div className="p-2 border-b border-gray-700 mb-2">
            <h2 className="text-lg font-bold text-white">Project Files</h2>
        </div>
        <nav className="flex-grow">
            <ul>
                {fileList.length > 0 ? (
                    fileList.map(fileName => (
                        <li key={fileName}>
                            <button
                                onClick={() => onSelectFile(fileName)}
                                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 rounded-md transition-colors ${
                                    activeFile === fileName
                                        ? 'bg-blue-600/30 text-blue-300'
                                        : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                                }`}
                            >
                                <FileCode2 size={16} />
                                <span>{fileName}</span>
                            </button>
                        </li>
                    ))
                ) : (
                    <li className="px-3 py-2 text-sm text-gray-500">No files in project.</li>
                )}
            </ul>
        </nav>
        {/* The 'add file' button could be implemented here if needed */}
    </div>
  );
};
