import { Check, Copy, Menu, Square, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Renders the main application header with navigation, a theme switcher, and a user profile menu.
 * @param {object} props - The component props.
 * @param {Function} props.onSidebarToggle - Callback function to toggle the sidebar visibility.
 */
const Header = ({ onSidebarToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Mock user data. In a real application, this would come from a context or a user state.
  const user = {
    name: 'Alex Johnson',
    email: 'alex.j@example.com',
    apiKey: 'ak_live_********************1234'
  };

  const tabs = [
    // { id: 'designer', label: 'Designer', path: '/designer' },
    { id: 'query', label: 'Query', path: '/query' },
    { id: 'schema', label: 'Schema', path: '/schema' },
    // { id: 'api', label: 'API', path: '/api' },
  ];

  const handleTabClick = (path) => navigate(path);

  const isActiveTab = (tabPath) => {
    if (tabPath === '/schema' && location.pathname.startsWith('/table/')) {
      return true;
    }
    return location.pathname === tabPath;
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(user.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  return (
    <header className="w-full bg-fg-light/80 dark:bg-fg-dark/80 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-2 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left Section */}
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

        {/* Right Section: Theme Switcher and Profile */}
        <div className="flex items-center space-x-2">
          {/* Center Section: Navigation */}
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
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 transition-shadow"
            >
              <User className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
            </button>

            {/* Profile Popup */}
            {isProfileOpen && (
              <div
                ref={profileMenuRef}
                className="absolute top-full right-0 mt-2 w-64 bg-fg-light dark:bg-fg-dark border border-border-light dark:border-border-dark rounded-md p-3 z-20"
              >
                <div className="border-b border-border-light dark:border-border-dark pb-2 mb-2">
                  <p className="font-semibold text-sm">{user.name}</p>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{user.email}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark">API Key</label>
                  <div className="flex items-center space-x-2 mt-1 p-2 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-md">
                    <code className="text-xs font-mono text-text-light dark:text-text-dark truncate flex-1">{user.apiKey}</code>
                    <button onClick={handleCopyApiKey} title="Copy API Key">
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-text-muted-light dark:text-text-muted-dark" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;