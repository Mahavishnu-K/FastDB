import React, { useState, useEffect, createContext, useContext } from 'react';
import { Search } from 'lucide-react';

const CommandPaletteContext = createContext();

export const useCommandPalette = () => useContext(CommandPaletteContext);

export const CommandPaletteProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [actions, setActions] = useState([]);

    const value = {
        isOpen,
        toggle: () => setIsOpen(prev => !prev),
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        setActions,
        actions
    };

    return <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>;
}

export const CommandPalette = () => {
    const { isOpen, close, actions } = useCommandPalette();
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        if (!isOpen) {
            setSearch('');
            setSelectedIndex(0);
        }
    }, [isOpen]);
    
    const filteredActions = search
        ? actions.filter(action => action.title.toLowerCase().includes(search.toLowerCase()))
        : actions;

    const handleSelect = (action) => {
        action.onSelect();
        close();
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => (i + 1) % filteredActions.length);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => (i - 1 + filteredActions.length) % filteredActions.length);
            }
            if (e.key === 'Enter' && filteredActions[selectedIndex]) {
                e.preventDefault();
                handleSelect(filteredActions[selectedIndex]);
            }
            if (e.key === 'Escape') {
                close();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, filteredActions]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20" onClick={close}>
            <div className="w-full max-w-lg bg-fg-light dark:bg-fg-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-3 flex items-center space-x-3 border-b border-border-light dark:border-border-dark">
                    <Search className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark"/>
                    <input type="text" placeholder="Search commands..." value={search} onChange={e => setSearch(e.target.value)} autoFocus
                        className="w-full bg-transparent outline-none text-sm"/>
                </div>
                <ul className="max-h-96 overflow-y-auto">
                    {filteredActions.length > 0 ? filteredActions.map((action, index) => (
                        <li key={action.id} onClick={() => handleSelect(action)} onMouseEnter={() => setSelectedIndex(index)}
                            className={`p-3 text-sm cursor-pointer ${index === selectedIndex ? 'bg-slate-100 dark:bg-slate-800' : ''}`}>
                            {action.title}
                        </li>
                    )) : <p className="p-4 text-sm text-text-muted-light dark:text-text-muted-dark">No results found.</p>}
                </ul>
            </div>
        </div>
    );
};