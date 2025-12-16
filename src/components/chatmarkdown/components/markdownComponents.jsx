// This file exports components used by the markdown renderer if needed separately
// For now, we are defining components inline in markdownHelper.jsx for simplicity
// But we can export them here if the user wants a separate file structure as requested.

import React from "react";

export const CodeBlock = ({ className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || "");
  return (
    <div className="relative rounded-md bg-gray-900 p-4 my-4">
      {match && (
        <div className="absolute top-0 right-0 px-2 py-1 text-xs text-gray-400 font-mono">
          {match[1]}
        </div>
      )}
      <code className={`text-gray-100 ${className}`} {...props}>
        {children}
      </code>
    </div>
  );
};

export const InlineCode = ({ children, ...props }) => (
  <code
    className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-red-500"
    {...props}
  >
    {children}
  </code>
);
