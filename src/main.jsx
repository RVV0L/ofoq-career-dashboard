import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ModeProvider } from './context/ModeContext.jsx';
import { DataProvider } from './context/DataContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ModeProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </ModeProvider>
    </ThemeProvider>
  </React.StrictMode>
);
