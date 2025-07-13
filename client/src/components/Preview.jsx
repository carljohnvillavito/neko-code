import React from 'react';

const Preview = React.forwardRef(({ htmlContent, isDesktopView }, ref) => {
  return (
    // This wrapper handles the sizing and scaling.
    <div className={`transition-transform duration-300 ${isDesktopView ? 'w-[1280px] h-[720px] scale-[0.4] sm:scale-[0.5] md:scale-[0.6] lg:scale-75' : 'w-full h-full'}`}>
      <iframe
        ref={ref}
        srcDoc={htmlContent}
        title="Live Preview"
        // The iframe itself is now always full-size relative to its wrapper.
        className="w-full h-full border-none bg-white shadow-lg"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
});

export { Preview };
