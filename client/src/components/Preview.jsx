import React from 'react';

const Preview = React.forwardRef(({ htmlContent, isDesktopView }, ref) => {
  return (
    <iframe
      ref={ref}
      srcDoc={htmlContent}
      title="Live Preview"
      className={`border-none transition-all duration-300 ${
        isDesktopView 
          ? 'w-[1280px] h-[720px] scale-[0.4] sm:scale-[0.5] md:scale-[0.6] lg:scale-75 origin-top-left' 
          : 'w-full h-full'
      }`}
      sandbox="allow-scripts allow-same-origin"
    />
  );
});

export { Preview };
