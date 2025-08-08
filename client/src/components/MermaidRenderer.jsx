import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

/**
 * A specialized, memoized component to safely render a Mermaid diagram.
 * It isolates the direct DOM manipulation from React's lifecycle.
 * React.memo prevents re-rendering if the chart string hasn't changed.
 */
const MermaidRenderer = React.memo(({ chart }) => {
    const containerRef = useRef(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        const renderDiagram = async () => {
            if (chart && containerRef.current) {
                try {
                    const isDarkMode = document.documentElement.classList.contains('dark');
                    
                    // --- THE FIX IS HERE: Custom theme definitions ---
                    const lightTheme = {
                        primaryColor: '#F8FAFC', // bg-slate-50
                        primaryTextColor: '#020617', // text-slate-950
                        primaryBorderColor: '#CBD5E1', // border-slate-300
                        lineColor: '#475569', // text-slate-600
                        textColor: '#334155', // text-slate-700
                        fontSize: '14px',
                    };

                    const darkTheme = {
                        primaryColor: '#1E293B', // bg-slate-800
                        primaryTextColor: '#F1F5F9', // text-slate-100
                        primaryBorderColor: '#475569', // border-slate-600
                        lineColor: '#94A3B8', // text-slate-400
                        textColor: '#CBD5E1', // text-slate-300
                        fontSize: '14px',
                    };
                    
                    mermaid.initialize({
                        startOnLoad: false,
                        // --- Apply the correct theme based on the mode ---
                        theme: isDarkMode ? 'base' : 'default',
                        themeVariables: isDarkMode ? darkTheme : lightTheme,
                        // --- Ensure ER diagrams use the full available width ---
                        er: {
                            useMaxWidth: true,
                        }
                    });

                    const { svg } = await mermaid.render(`mermaid-diagram-${Date.now()}`, chart);
                    
                    if (isMounted.current && containerRef.current) {
                        containerRef.current.innerHTML = svg;
                    }

                } catch (error) {
                    console.error("Failed to render mermaid chart:", error);
                    if (isMounted.current && containerRef.current) {
                        containerRef.current.innerHTML = 'Error rendering diagram.';
                    }
                }
            }
        };

        renderDiagram();

    }, [chart]);

    return <div ref={containerRef} />;
});

export default MermaidRenderer;