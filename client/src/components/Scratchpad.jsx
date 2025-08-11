import { GripVertical, Save, Trash2, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const Scratchpad = ({ isVisible, onClose }) => {
    const [text, setText] = useState('');

    useEffect(() => {
        const savedText = localStorage.getItem('fastdb_scratchpad');
        if (savedText) {
            setText(savedText);
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('fastdb_scratchpad', text);
        toast.success("Scratchpad saved!");
    };
    
    const handleClear = () => {
        setText('');
        localStorage.removeItem('fastdb_scratchpad');
        toast.success("Scratchpad cleared!");
    };

    if (!isVisible) return null;

    return (
        <motion.div
            drag
            dragHandle=".drag-handle"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 w-96 h-80 bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-lg shadow-2xl flex flex-col z-40"
        >
            <div className="drag-handle cursor-move bg-slate-100 dark:bg-slate-800/50 p-2 flex items-center justify-between rounded-t-lg border-b border-border-light dark:border-border-dark">
                <div className="flex items-center space-x-1">
                    <GripVertical className="w-5 h-5 text-text-muted-light dark:text-text-muted-dark" />
                    <span className="text-sm font-semibold">Scratchpad</span>
                </div>
                <div className="flex items-center">
                     <button onClick={handleSave} title="Save to Browser" className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"><Save className="w-4 h-4"/></button>
                     <button onClick={handleClear} title="Clear Scratchpad" className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"><Trash2 className="w-4 h-4"/></button>
                     <button onClick={onClose} title="Close" className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"><X className="w-4 h-4"/></button>
                </div>
            </div>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Jot down notes, temporary queries, etc. Save to persist across sessions."
                className="flex-1 w-full bg-transparent p-3 text-sm font-mono resize-none focus:outline-none"
                spellCheck="false"
            />
        </motion.div>
    );
};

export default Scratchpad;