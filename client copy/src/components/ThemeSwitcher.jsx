import { Sun, Moon, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * A compact component for switching between light, dark, and system themes.
 * It persists the user's choice in localStorage.
 */
const ThemeSwitcher = () => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');

    useEffect(() => {
        const root = window.document.documentElement;
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            root.classList.add(systemTheme);
            localStorage.removeItem('theme');
        } else {
            root.classList.add(theme);
            localStorage.setItem('theme', theme);
        }
    }, [theme]);

    const themes = [
        { name: 'light', icon: Sun },
        { name: 'dark', icon: Moon },
        { name: 'system', icon: Monitor },
    ];

    return (
        <div className="flex items-center p-0.5 rounded-lg bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark">
            {themes.map((t) => {
                const isActive = theme === t.name;
                return (
                    <button
                        key={t.name}
                        onClick={() => setTheme(t.name)}
                        className={`p-1.5 rounded-md text-sm transition-colors ${
                            isActive
                                ? 'bg-bg-light dark:bg-bg-dark text-slate-700 dark:text-slate-200'
                                : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark'
                        }`}
                        aria-label={`Switch to ${t.name} theme`}
                        title={`Switch to ${t.name} theme`}
                    >
                        <t.icon className="w-4 h-4" />
                    </button>
                );
            })}
        </div>
    );
};

export default ThemeSwitcher;