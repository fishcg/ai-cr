import React, { useEffect, useRef } from 'react';

interface DiffViewerProps {
  diff: string;
  highlightLine?: number | null;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ diff, highlightLine }) => {
  const lines = diff.split('\n');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightLine && containerRef.current) {
      const lineElement = document.getElementById(`diff-line-${highlightLine}`);
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightLine]);

  return (
      <div ref={containerRef} className="font-mono text-sm overflow-auto h-full pb-10 w-full p-4">
        {lines.map((line, idx) => {
          const lineNumber = idx + 1;
          const isHighlighted = highlightLine === lineNumber;

          let bgClass = '';
          let textClass = 'text-terminal-dim';
          let prefix = ' ';

          if (line.startsWith('+')) {
            bgClass = 'bg-green-500/10';
            textClass = 'text-green-400';
            prefix = '+';
          } else if (line.startsWith('-')) {
            bgClass = 'bg-red-500/10';
            textClass = 'text-red-400';
            prefix = '-';
          } else if (line.startsWith('@@')) {
            textClass = 'text-terminal-purple';
            prefix = ' ';
          } else {
            textClass = 'text-terminal-text';
          }

          // Apply stronger highlight if selected
          if (isHighlighted) {
            bgClass = 'bg-terminal-blue/30 ring-1 ring-terminal-blue/50';
            textClass = 'text-white font-bold';
          }

          return (
              <div
                  key={idx}
                  id={`diff-line-${lineNumber}`}
                  className={`flex ${bgClass} px-4 py-0.5 whitespace-pre transition-colors duration-300`}
              >
             <span className={`w-8 text-right select-none mr-4 text-xs ${isHighlighted ? 'text-terminal-blue font-bold opacity-100' : 'opacity-30'}`}>
                {lineNumber}
             </span>
                <span className="select-none opacity-50 mr-2 w-2 inline-block">{prefix === ' ' ? '' : prefix}</span>
                <span className={textClass}>{line}</span>
              </div>
          );
        })}
      </div>
  );
};

export default DiffViewer;
