
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

declare global {
  interface Window {
    MathJax: any;
  }
}

interface MathTextProps {
  content: string;
  className?: string;
  isInline?: boolean;
}

export const MathText: React.FC<MathTextProps> = ({ content, className, isInline }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [debouncedContent, setDebouncedContent] = useState(content);

  useEffect(() => {
    // Basic debounce to avoid flashing during rapid typing simulation
    const handler = setTimeout(() => {
        setDebouncedContent(content);
    }, 50);
    return () => clearTimeout(handler);
  }, [content]);

  useEffect(() => {
    // Ensure MathJax is loaded and available before trying to typeset
    if (typeof window !== 'undefined' && window.MathJax) {
      // Use requestAnimationFrame to ensure the DOM is ready
      const rAF = requestAnimationFrame(() => {
          if (ref.current && window.MathJax.typesetPromise) {
             window.MathJax.typesetPromise([ref.current])
                 .catch((err: any) => console.debug('MathJax typesetting failed:', err));
          }
      });
      return () => cancelAnimationFrame(rAF);
    }
  }, [debouncedContent]);

  return (
    <div ref={ref} className={`${className || ''} ${isInline ? 'inline-block' : ''}`}>
      <ReactMarkdown
        components={isInline ? {
          p: ({node, ...props}) => <span {...props} />
        } : undefined}
      >
        {debouncedContent}
      </ReactMarkdown>
    </div>
  );
};
