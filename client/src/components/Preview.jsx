import React from 'react';

const Preview = React.forwardRef(({ htmlContent, isDesktopView }, ref) => {
  return (
    // This wrapper handles the absolute positioning and transformation.
    <div
      className={`transition-transform duration-300 ${
        isDesktopView 
          ? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1280px] h-[720px] scale-[0.25] sm:scale-[0.4] md:scale-[0.5] lg:scale-75'
          : 'w-full h-full'
      }`}
    >
      <iframe
        ref={ref}
        srcDoc={htmlContent}
        title="Live Preview"
        className="w-full h-full border-none bg-white shadow-lg"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
});

export { Preview };
