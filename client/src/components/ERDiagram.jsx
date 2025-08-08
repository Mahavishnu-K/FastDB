import React, { useState, useEffect, useRef } from 'react';
import { GitBranch, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import mermaid from 'mermaid';

// Initialize Mermaid with our dark theme settings
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  er: {
    useMaxWidth: true,
  },
  fontFamily: 'inherit'
});

const ERDiagram = ({ mermaidString, onRefresh }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null); // Create a ref for our container div

  useEffect(() => {
    // Only try to render if we have a valid mermaid string and a container
    if (mermaidString && containerRef.current) {
      // The mermaid.render function generates the SVG
      // It's asynchronous, so we use async/await
      const renderDiagram = async () => {
        try {
          // The first argument is a unique ID for the graph
          const { svg } = await mermaid.render('mermaid-diagram', mermaidString);
          if (containerRef.current) {
            // We set the innerHTML of our container div to the generated SVG
            containerRef.current.innerHTML = svg;
          }
        } catch (error) {
          console.error("Mermaid rendering error:", error);
          if (containerRef.current) {
            containerRef.current.innerHTML = "Error rendering diagram.";
          }
        }
      };
      
      renderDiagram();
    }
  }, [mermaidString]); // This hook re-runs whenever the mermaidString prop changes

  const FallbackContent = () => (
    <div className='text-gray-500'>
      <p>Generating diagram...</p>
      <p>(If this persists, the schema may be empty or invalid)</p>
    </div>
  );

  return (
    <div className={`bg-gray-950 border border-gray-600 rounded-lg p-6 shadow-lg ${isFullscreen ? 'fixed inset-4 z-50 overflow-auto bg-gray-950' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
          <GitBranch className="w-5 h-5 text-purple-400" />
          <span>Entity Relationship Diagram</span>
        </h4>
        <div className="flex items-center space-x-2">
          <button onClick={onRefresh} className="text-gray-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 min-h-[400px] border border-gray-700 flex justify-center items-center">
        
        <div ref={containerRef} key={mermaidString}>
          {!mermaidString && <FallbackContent />}
        </div>
      </div>
    </div>
  );
};

export default ERDiagram;