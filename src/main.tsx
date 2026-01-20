/**
 * Application Entry Point
 * React 19.0
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './index.css';

// Initialize i18n before app renders
import './lib/i18n';

// Register Service Worker for PWA support
import { registerServiceWorker } from './lib/service-worker';
registerServiceWorker();

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// React 19 rendering
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
