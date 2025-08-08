import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AppToaster from './components/AppToaster.jsx'; // Import the new component
import { CommandPaletteProvider } from './components/command/CommandPalette.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CommandPaletteProvider>
      <App />
      <AppToaster /> {/* Use the new theme-aware Toaster */}
    </CommandPaletteProvider>
  </React.StrictMode>,
);