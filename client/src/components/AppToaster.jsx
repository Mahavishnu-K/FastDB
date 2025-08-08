import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

// Theme configuration for Light Mode
const lightToastOptions = {
    style: {
        background: '#f8fafc', // slate-50
        color: '#020617',     // slate-950
        border: '1px solid #e2e8f0', // slate-200
    },
    success: {
        iconTheme: {
            primary: '#22c55e', // green-500
            secondary: '#f8fafc', // slate-50
        },
    },
    error: {
        iconTheme: {
            primary: '#ef4444', // red-500
            secondary: '#f8fafc', // slate-50
        },
    },
};

// Theme configuration for Dark Mode
const darkToastOptions = {
    style: {
        background: '#1e293b', // slate-800
        color: '#f1f5f9',     // slate-100
        border: '1px solid #334155', // slate-700
    },
    success: {
        iconTheme: {
            primary: '#4ade80', // green-400
            secondary: '#1e293b', // slate-800
        },
    },
    error: {
        iconTheme: {
            primary: '#f87171', // red-400
            secondary: '#1e293b', // slate-800
        },
    },
};


/**
 * A theme-aware wrapper for the react-hot-toast Toaster component.
 * It listens for changes on the <html> element's class list and
 * applies the correct light/dark theme to the toast notifications.
 */
const AppToaster = () => {
    const [themeOptions, setThemeOptions] = useState(darkToastOptions);

    useEffect(() => {
        // Function to update theme based on the document's class
        const updateTheme = () => {
            if (document.documentElement.classList.contains('dark')) {
                setThemeOptions(darkToastOptions);
            } else {
                setThemeOptions(lightToastOptions);
            }
        };

        // Set the initial theme
        updateTheme();

        // Create a MutationObserver to watch for class changes on the <html> element
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    updateTheme();
                }
            });
        });

        // Start observing
        observer.observe(document.documentElement, {
            attributes: true,
        });

        // Cleanup observer on component unmount
        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <Toaster
            position="bottom-right"
            toastOptions={themeOptions}
        />
    );
};

export default AppToaster;