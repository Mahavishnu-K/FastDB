import React, { useState, useCallback, createContext, useContext } from 'react';
import InputModal from '../components/InputModal';

const InputContext = createContext();

export const usePrompt = () => {
    const context = useContext(InputContext);
    if (!context) {
        throw new Error("usePrompt must be used within an InputProvider");
    }
    return context;
};

export const InputProvider = ({ children }) => {
    const [options, setOptions] = useState(null);
    const [resolvePromise, setResolvePromise] = useState(null);

    // The prompt function now takes options for title, message, etc.
    const prompt = useCallback((options) => {
        return new Promise((resolve) => {
            setOptions(options);
            setResolvePromise(() => resolve);
        });
    }, []);

    const handleClose = useCallback(() => {
        if (resolvePromise) {
            resolvePromise(null); // Resolve with null if cancelled
            setResolvePromise(null);
        }
        setOptions(null);
    }, [resolvePromise]);

    const handleSubmit = useCallback((value) => {
        if (resolvePromise) {
            resolvePromise(value); // Resolve with the submitted value
            setResolvePromise(null);
        }
        setOptions(null);
    }, [resolvePromise]);

    return (
        <InputContext.Provider value={prompt}>
            {children}
            <InputModal
                isOpen={!!options}
                options={options}
                onSubmit={handleSubmit}
                onCancel={handleClose}
            />
        </InputContext.Provider>
    );
};