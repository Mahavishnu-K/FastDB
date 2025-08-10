import { Check, Copy, Menu, Square, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext'; // Your context for user data

/**
 * Renders the main application header.
 * It dynamically displays user information once it's loaded from the context.
 * @param {object} props - The component props.
 * @param {Function} props.onSidebarToggle - Callback to toggle the sidebar.
 */
const Header = ({ onSidebarToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Get the user object and loading state from the context.
  // `user` will be `null` initially, and `isLoading` will be `true`.
  const { user, isLoading } = useUser();

  const tabs = [
    { id: 'query', label: 'Query', path: '/query' },
    { id: 'schema', label: 'Schema', path: '/schema' },
    { id: 'collab', label: 'Collaboration', path: '/collaboration' },
  ];

  const handleTabClick = (path) => navigate(path);

  const isActiveTab = (tabPath) => {
    if (tabPath === '/schema' && location.pathname.startsWith('/table/')) {
      return true;
    }
    return location.pathname === tabPath;
  };

  const handleCopyApiKey = () => {
    // Guard against calling this if user is somehow null
    if (user && user.api_key) {
      navigator.clipboard.writeText(user.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openProfileMenu = () => {
    if (!isProfileOpen) {
      setIsProfileOpen(true);
    }
  };

  useEffect(() => {
    if (!isProfileOpen) return;
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  return (
    <header className="w-full bg-fg-light/80 dark:bg-fg-dark/80 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-2 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left Section (Unaffected by user state) */}
        <div className="flex items-center space-x-3">
          <button onClick={onSidebarToggle} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Toggle Schema Explorer">
            <Menu className="w-5 h-5 text-text-muted-light dark:text-text-muted-dark" />
          </button>
          <div className="flex items-center space-x-2">
            <Square className="w-5 h-5 text-blue-500" />
            <div>
              <h1 className="text-sm font-semibold">FastDB</h1>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Navigation (Unaffected by user state) */}
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

          <div className="relative">
            
            {isLoading && (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            )}

            {/* Only render the button and dropdown if loading is finished AND the user exists */}
            {!isLoading && user && (
              <>
                <button
                  onClick={openProfileMenu}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 transition-shadow"
                >
                  <User className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
                </button>

                {isProfileOpen && (
                  <div
                    ref={profileMenuRef}
                    className="absolute top-full right-0 mt-2 w-64 bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-md p-3 z-20 shadow-lg"
                  >
                    {/* It is now 100% safe to access user properties here */}
                    <div className="border-b border-border-light dark:border-border-dark pb-2 mb-2">
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark">API Key</label>
                      <div className="flex items-center space-x-2 mt-1 p-2 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-md">
                        <code className="text-xs font-mono text-text-light dark:text-text-dark truncate flex-1">
                          {user.api_key}
                        </code>
                        <button onClick={handleCopyApiKey} title="Copy API Key">
                          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-text-muted-light dark:text-text-muted-dark" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;