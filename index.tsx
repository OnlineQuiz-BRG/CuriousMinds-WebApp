
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { mockDb } from './services/mockDb';

// Run initialization in background to avoid blocking initial mount
mockDb.init().catch(err => console.error("MockDB Init Failed:", err));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
