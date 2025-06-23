// components/Header.jsx
import { Database, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const Header = ({ onSidebarToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const tabs = [
    { id: 'designer', label: 'Designer', path: '/designer' },
    { id: 'query', label: 'Query', path: '/query' },
    { id: 'schema', label: 'Schema', path: '/schema' },
    { id: 'api', label: 'API', path: '/api' }
  ];

  const handleTabClick = (path) => {
    navigate(path);
  };

  // Function to check if current path matches tab
  const isActiveTab = (tabPath) => {
    // Handle special cases for table editor routes
    if (tabPath === '/schema' && (location.pathname.startsWith('/table/'))) {
      return true;
    }
    return location.pathname === tabPath;
  };

  return (
    <header className="bg-gray-950 border-b border-gray-600 px-6 py-2 relative z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onSidebarToggle}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Toggle Schema Explorer"
          >
            <Menu className="w-6 h-6 text-gray-400" />
          </button>
          <Database className="w-6 h-6 text-blue-400" />
          <div>
            <h1 className="text-l font-bold text-white">FastDB</h1>
            <p className="text-xs text-gray-400">Natural Language to SQL</p>
          </div>
        </div>
        
        <nav className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.path)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActiveTab(tab.path)
                  ? 'border border-gray-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;