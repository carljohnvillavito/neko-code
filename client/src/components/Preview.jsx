import React from 'react';

export const Preview = ({ htmlContent }) => {
  return (
    <iframe
      srcDoc={htmlContent}
      title="Live Preview"
      className="w-full h-full border-none"
      sandbox="allow-scripts allow-same-origin"
    />
  );
};
