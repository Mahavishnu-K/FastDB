import React, { useState, useCallback, createContext, useContext } from 'react';
import ConfirmModal from '../components/ConfirmModal';

const ConfirmationContext = createContext();

export const useConfirm = () => {
    const context = useContext(ConfirmationContext);
    if (!context) {
        throw new Error("useConfirm must be used within a ConfirmationProvider");
    }
    return context;
};

export const ConfirmationProvider = ({ children }) => {
    const [options, setOptions] = useState(null);
    const [resolvePromise, setResolvePromise] = useState(null);

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            setOptions(options);
            setResolvePromise(() => resolve); // Store the resolve function
        });
    }, []);

    const handleClose = useCallback(() => {
        if (resolvePromise) {
            resolvePromise(false); // Resolve with false if closed without a choice
            setResolvePromise(null);
        }
        setOptions(null);
    }, [resolvePromise]);

    const handleConfirm = useCallback(() => {
        if (resolvePromise) {
            resolvePromise(true);
            setResolvePromise(null);
        }
        setOptions(null);
    }, [resolvePromise]);

    return (
        <ConfirmationContext.Provider value={confirm}>
            {children}
            <ConfirmModal
                isOpen={!!options}
                options={options}
                onConfirm={handleConfirm}
                onCancel={handleClose}
            />
        </ConfirmationContext.Provider>
    );
};