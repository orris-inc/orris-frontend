/**
 * 应用入口文件
 * React 19.0
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './index.css';

// 获取根元素
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// React 19 渲染
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
