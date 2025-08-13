import React, { useState, useEffect, useRef } from 'react';
import { GitBranch, Maximize2, Minimize2, RefreshCw, Plus, Minus, RefreshCcw, Move } from 'lucide-react';
import MermaidRenderer from './MermaidRenderer';
import mermaid from 'mermaid';

/**
 * A component to render a styled, interactive Entity-Relationship diagram.
 * It now features a pannable and zoomable canvas, allowing users to easily
 * navigate complex diagrams.
 */



const ERDiagram = ({ mermaidString, onRefresh }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [renderKey, setRenderKey] = useState(Date.now());
  const [theme, setTheme] = useState('default');
  const viewportRef = useRef(null);
  const svgContainerRef = useRef(null);

  // State for pan and zoom
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef(null);
  
  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setTheme(isDarkMode ? 'dark' : 'default');
    };
    
    // Check theme on initial mount
    checkTheme();

    // Use a MutationObserver to watch for class changes on the <html> element
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Cleanup the observer when the component unmounts
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (mermaidString && svgContainerRef.current && viewportRef.current) {
      const renderDiagram = async () => {
        try {
          // 1. Initialize Mermaid with the CURRENT theme BEFORE rendering.
          mermaid.initialize({
            startOnLoad: false,
            theme: theme, // Use the theme from our state
            securityLevel: 'loose',
            er: { useMaxWidth: false },
            fontFamily: 'inherit',
            themeVariables: {
              background: theme === 'dark' ? '#0A0A0A' : '#FFFFFF',
              primaryColor: theme === 'dark' ? '#1E1E1E' : '#F9FAFB',
              primaryTextColor: theme === 'dark' ? '#E5E7EB' : '#1F2937',
              lineColor: theme === 'dark' ? '#7C828F' : '#292828',
            }
          });
          const { svg } = await mermaid.render(`mermaid-graph-${Date.now()}`, mermaidString);
          if (svgContainerRef.current) {
            svgContainerRef.current.innerHTML = svg;
            const isDarkMode = document.documentElement.classList.contains('dark');
          mermaid.initialize({
            startOnLoad: false,
            theme: isDarkMode ? 'dark' : '',
            securityLevel: 'loose',
            er: { useMaxWidth: false }, 
            fontFamily: 'inherit'
          });
            // --- Auto-fit Logic ---
            const svgElement = svgContainerRef.current.querySelector('svg');
            const viewport = viewportRef.current;
            if (svgElement && viewport) {
              const svgRect = svgElement.getBoundingClientRect();
              const viewportRect = viewport.getBoundingClientRect();
              
              const scaleX = viewportRect.width / svgRect.width;
              const scaleY = viewportRect.height / svgRect.height;
              const initialZoom = Math.min(scaleX, scaleY, 1) * 1; // Fit with 10% padding, max zoom 1
              
              // Center the diagram
              const initialX = (viewportRect.width - (svgRect.width * initialZoom)) / 2;
              const initialY = (viewportRect.height - (svgRect.height * initialZoom)) / 2;
              
              setZoom(initialZoom);
              setPosition({ x: initialX, y: initialY });
            }
          }
        } catch (error) {
          console.error("Mermaid rendering error:", error);
          if (svgContainerRef.current) {
            svgContainerRef.current.innerHTML = `<div class="text-red-400">Error rendering diagram.</div>`;
          }
        }
      };
      renderDiagram();
    } else if (svgContainerRef.current) {
      svgContainerRef.current.innerHTML = ''; // Clear previous diagram if string is empty
    }
  }, [mermaidString, theme]); 

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: position.x,
        initialY: position.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!isPanning || !panStartRef.current) return;
    e.preventDefault();
    const dx = e.clientX - panStartRef.current.startX;
    const dy = e.clientY - panStartRef.current.startY;
    setPosition({
        x: panStartRef.current.initialX + dx,
        y: panStartRef.current.initialY + dy,
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
    panStartRef.current = null;
  };
  
  const handleResetView = () => {
      onRefresh();
  };

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
        <h4 className="text-sm font-semibold flex items-center space-x-2"><GitBranch className="w-4 h-4 text-blue-500" /><span>Entity Relationship</span></h4>
        <div className="flex items-center space-x-1">
          <button onClick={onRefresh} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Refresh Diagram"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>{isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>
        </div>
      </div>
      
      <div 
        ref={viewportRef}
        className={`flex-1 min-h-[400px] bg-dot-grid-light dark:bg-dot-grid-dark overflow-hidden relative ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      >
        <div 
            style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`, transformOrigin: 'top left' }}
        >
          {/* The SVG will be rendered inside this div */}
          <div ref={svgContainerRef} />
        </div>
        {/* The fallback is now positioned absolutely within the viewport */}
        {!mermaidString && (
            <div className="absolute inset-0 flex items-center justify-center">
                <FallbackContent />
            </div>
        )}
      </div>

      <div className="flex items-center justify-center space-x-3 p-2 border-t border-border-light dark:border-border-dark bg-fg-light dark:bg-fg-dark rounded-b-lg">
        <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Zoom Out"><Minus className="w-4 h-4" /></button>
        <input type="range" min="0.2" max="2" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-36 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"/>
        <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Zoom In"><Plus className="w-4 h-4" /></button>
        <span className="text-xs font-mono w-12 text-center text-text-muted-light dark:text-text-muted-dark">{Math.round(zoom * 100)}%</span>
        <button onClick={handleResetView} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Reset View"><RefreshCcw className="w-3.5 h-3.5" /></button>
        <Move className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark" title="Click and drag to pan"/>
      </div>
    </div>
  );
};

export default ERDiagram;