/**
 * Application Entry Point
 * React 19.0
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
// Radix Themes CSS must be imported before custom styles
import '@radix-ui/themes/styles.css';
import './index.css';

// Lazy-loaded i18n: preload the active language before rendering
import { initI18n } from './lib/i18n';

// Register Service Worker for PWA support
import { registerServiceWorker } from './lib/service-worker';
registerServiceWorker();

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// Render once the active language is loaded (falls back to keys if it fails)
initI18n()
  .catch((error) => {
    console.error('Failed to initialize i18n', error);
  })
  .finally(() => {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  });
