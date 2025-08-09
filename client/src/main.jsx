import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AppToaster from './components/AppToaster.jsx'; // Import the new component

import { UserProvider } from './contexts/UserContext';
import { CommandPaletteProvider } from './components/command/CommandPalette';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import { InputProvider } from './contexts/InputContext';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UserProvider>
        <CommandPaletteProvider>
            <ConfirmationProvider>
                <InputProvider>
                    <App />
                    <AppToaster /> 
                </InputProvider>
            </ConfirmationProvider>
        </CommandPaletteProvider>
    </UserProvider>
  </React.StrictMode>,
);