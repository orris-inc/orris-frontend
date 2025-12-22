/**
 * Application Entry Point
 * React 19.0
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './index.css';

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
