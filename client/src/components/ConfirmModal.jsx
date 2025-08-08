import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, HelpCircle } from 'lucide-react';

// An internal component to render the correct icon with theme-aware colors
const ModalIcon = ({ iconType }) => {
    switch (iconType) {
        case 'success':
            return (
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-500/10 mr-4">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
            );
        case 'info':
            return (
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-500/10 mr-4">
                    <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
            );
        case 'question':
             return (
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-500/10 mr-4">
                    <HelpCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
            );
        case 'warning':
        default:
            return (
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-500/10 mr-4">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
            );
    }
}

const ConfirmModal = ({ isOpen, options, onConfirm, onCancel }) => {
    const {
        title = "Are you sure?",
        message = "This action cannot be undone.",
        confirmText = "Confirm",
        cancelText = "Cancel",
        isDestructive = true,
        // New 'icon' option: 'warning', 'success', 'info', 'question'
        icon = isDestructive ? 'warning' : 'question'
    } = options || {};

    // Determine button colors based on the action's nature
    const getConfirmButtonClasses = () => {
        if (isDestructive) return "bg-red-600 hover:bg-red-700 dark:hover:bg-red-500";
        if (icon === 'success') return "bg-green-600 hover:bg-green-700 dark:hover:bg-green-500";
        return "bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500";
    }
    
    const confirmButtonClasses = getConfirmButtonClasses();

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
                        // --- THEME-AWARE STYLING ---
                        className="bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg w-full max-w-md relative shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-start p-6">
                            <ModalIcon iconType={icon} />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                                {message && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{message}</p>}
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex flex-row-reverse space-x-2 space-x-reverse rounded-b-lg">
                            <button
                                onClick={onConfirm}
                                className={`px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors ${confirmButtonClasses}`}
                            >
                                {confirmText}
                            </button>
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 text-sm font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-md transition-colors"
                            >
                                {cancelText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;