import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const InputModal = ({ isOpen, options, onSubmit, onCancel }) => {
    const {
        title = "Enter a value",
        message,
        confirmText = "Save",
        cancelText = "Cancel",
        initialValue = ""
    } = options || {};
    
    const [inputValue, setInputValue] = useState(initialValue);

    useEffect(() => {
        if (isOpen) {
            setInputValue(initialValue);
        }
    }, [isOpen, initialValue]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onSubmit(inputValue);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                    onClick={onCancel}
                >
                    <motion.div
                        initial={{ y: -50, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 50, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        // --- THEME-AWARE STYLES APPLIED HERE ---
                        className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg w-full max-w-md relative shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <form onSubmit={handleSubmit}>
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">{title}</h3>
                                {message && <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-2">{message}</p>}
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    // --- THEME-AWARE INPUT STYLES ---
                                    className="mt-4 w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-md px-3 py-2 text-sm text-text-light dark:text-text-dark placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                                    autoFocus
                                    required
                                />
                            </div>

                            {/* --- THEME-AWARE FOOTER AND BUTTONS --- */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex flex-row-reverse space-x-2 space-x-reverse rounded-b-lg border-t border-border-light dark:border-border-dark">
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!inputValue.trim()}
                                >
                                    {confirmText}
                                </button>
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="px-4 py-2 text-sm font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-md transition-colors"
                                >
                                    {cancelText}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InputModal;