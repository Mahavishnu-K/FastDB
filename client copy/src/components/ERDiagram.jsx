import React, { useState, useEffect } from 'react';
import { GitBranch, Maximize2, Minimize2, RefreshCw, Plus, Minus, RefreshCcw } from 'lucide-react';
import MermaidRenderer from './MermaidRenderer'; // Import our new safe component

// We no longer need to import mermaid here directly.

/**
 * A component to render a styled Entity-Relationship diagram.
 * It now acts as a shell/container, managing UI state like zoom and fullscreen,
 * while delegating the actual rendering to the MermaidRenderer component.
 */
const ERDiagram = ({ mermaidString, onRefresh }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [renderKey, setRenderKey] = useState(Date.now());
  const [zoom, setZoom] = useState(1);

  // This effect now just listens for theme changes to update the key,
  // which forces the MermaidRenderer to re-mount and re-render with the new theme.
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setRenderKey(Date.now());
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const FallbackContent = () => (
    <div className='text-sm text-center text-text-muted-light dark:text-text-muted-dark'>
      <p>No Diagram Available</p>
      <p className="text-xs">The diagram will be shown here once a database with tables is selected.</p>
    </div>
  );

  return (
    <div className={`bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg flex flex-col transition-all duration-300 ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {isFullscreen && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[-1]" onClick={() => setIsFullscreen(false)}></div>}

      <div className="flex items-center justify-between p-3 border-b border-border-light dark:border-border-dark">
        <h4 className="text-sm font-semibold flex items-center space-x-2"><GitBranch className="w-4 h-4 text-purple-500" /><span>Entity Relationship Diagram</span></h4>
        <div className="flex items-center space-x-1">
          <button onClick={onRefresh} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Refresh Diagram"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>{isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>
        </div>
      </div>
      
      <div className="p-4 flex-1 min-h-[400px] flex justify-center items-center bg-dot-grid-light dark:bg-dot-grid-dark overflow-hidden">
        {/* We use a transition-transform div for scaling the zoom */}
        <div className="transition-transform duration-200 ease-in-out" style={{ transform: `scale(${zoom})` }}>
          {mermaidString ? (
            // Conditionally render our new, safe component.
            // The `key` forces it to completely remount when the theme changes, ensuring a clean render.
            <MermaidRenderer chart={mermaidString} key={renderKey} />
          ) : (
            <FallbackContent />
          )}
        </div>
      </div>

      <div className="flex items-center justify-center space-x-3 p-2 border-t border-border-light dark:border-border-dark bg-fg-light dark:bg-fg-dark rounded-b-lg">
        <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Zoom Out">
          <Minus className="w-4 h-4" />
        </button>
        <input 
          type="range"
          min="0.2"
          max="2"
          step="0.05"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-48 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
        <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Zoom In">
          <Plus className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono w-12 text-center text-text-muted-light dark:text-text-muted-dark">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(1)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Reset Zoom">
          <RefreshCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ERDiagram;