import { motion } from 'framer-motion';
import { Check, Copy, LucideNotebookText, Menu, Square, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

/**
 * Renders the main application header with navigation, a theme switcher, and a user profile menu.
 * @param {object} props - The component props.
 * @param {Function} props.onSidebarToggle - Callback function to toggle the sidebar visibility.
 * @param {Function} props.onScratchpadToggle - Callback function to toggle the scratchpad visibility.
 */
const Header = ({ onSidebarToggle, onScratchpadToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const { user, isLoading: isUserLoading } = useUser();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { id: 'query', label: 'Query', path: '/query' },
    { id: 'schema', label: 'Schema', path: '/schema' },
    { id: 'collaboration', label: 'Collaboration', path: '/collaboration' },
  ];

  const handleTabClick = (path) => navigate(path);

  const isActiveTab = (tabPath) => {
    if (tabPath === '/schema' && (location.pathname.startsWith('/table/') || location.pathname.startsWith('/schema/builder'))) {
      return true;
    }
    return location.pathname === tabPath;
  };

  const handleCopyApiKey = () => {
    // --- THE FIX: Use the api_key from the user object ---
    if (user?.api_key) {
      navigator.clipboard.writeText(user.api_key);
      setCopied(true);
      setCopiedText(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setCopiedText(false), 1500);
    }
  };

  // Effect to handle closing the profile menu when clicking outside
  useEffect(() => {
    if (!isProfileOpen) return;
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  return (
    <header className="w-full bg-fg-light/80 dark:bg-fg-dark/80 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-2 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onSidebarToggle} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Toggle Schema Explorer">
            <Menu className="w-5 h-5 text-text-muted-light dark:text-text-muted-dark" />
          </motion.button>
          <div className="flex items-center space-x-2">
            <Square className="w-5 h-5 text-blue-500" />
            <div>
              <h1 className="text-sm font-semibold">FastDB</h1>
            </div>
          </div>
        </div>
        
        {/* Center Section: Navigation */}

        {/* Right Section: Theme Switcher and Profile */}
        <div className="flex items-center space-x-2">
          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.path)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActiveTab(tab.path)
                    ? 'bg-slate-200 dark:bg-slate-800 text-text-light dark:text-text-dark'
                    : 'text-text-muted-light dark:text-text-muted-dark hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-text-light dark:hover:text-text-dark'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
           <motion.button whileTap={{ scale: 0.9 }} onClick={onScratchpadToggle} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Toggle Scratchpad">
            <LucideNotebookText className="w-5 h-5 text-text-muted-light dark:text-text-muted-dark" />
          </motion.button>
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700"
            >
              <User className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
            </motion.button>

            {/* Profile Popup */}
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                ref={profileMenuRef}
                className="absolute top-full right-0 mt-2 w-64 bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-md p-3 z-20 shadow-lg"
              >
                {isUserLoading ? (
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Loading...</p>
                ) : user ? (
                  <>
                    <div className="border-b border-border-light dark:border-border-dark pb-2 mb-2">
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark">API Key</label>
                      <div className="flex items-center space-x-2 mt-1 p-2 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-md">
                        {/* --- THE FIX: Display the api_key from the user object --- */}
                        <code className="text-xs font-mono text-text-light dark:text-text-dark truncate flex-1">{user.api_key}</code>
                        <button onClick={handleCopyApiKey} title="Copy API Key" className="relative">
                          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-text-muted-light dark:text-text-muted-dark" />}
                          {copiedText && <motion.span initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0}} className="absolute -top-6 -left-4 text-xs bg-slate-800 text-white px-2 py-0.5 rounded-md">Copied!</motion.span>}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-red-500">Could not load user data.</p>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;