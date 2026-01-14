import path from 'path'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Version from package.json, can be overridden by CI via environment variable
const version =
  process.env.APP_VERSION || process.env.npm_package_version || '0.0.0'
const buildTime = new Date().toISOString()
const commitHash = process.env.COMMIT_HASH || 'dev'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_TIME__: JSON.stringify(buildTime),
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Chunk size warning limit (KB)
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Manual chunk splitting strategy
        // IMPORTANT: manualChunks can cause loading order issues with React dependencies
        // Vite's preload order doesn't respect dependency chains, causing errors like:
        // "Cannot read properties of undefined (reading 'forwardRef'/'createContext')"
        //
        // Solution: Only split chunks that have NO React dependency whatsoever.
        // Let Vite handle React-dependent libraries automatically.
        manualChunks: (id) => {
          // HTTP client - no React dependency, safe to split
          if (id.includes('node_modules/axios/')) {
            return 'vendor-http'
          }

          // Zod - no React dependency, safe to split
          if (id.includes('node_modules/zod/')) {
            return 'vendor-validation'
          }

          // Utilities - no React dependency, safe to split
          if (
            id.includes('node_modules/clsx/') ||
            id.includes('node_modules/tailwind-merge/') ||
            id.includes('node_modules/class-variance-authority/')
          ) {
            return 'vendor-utils'
          }

          // All other libraries (React, React Router, Radix UI, recharts, framer-motion,
          // react-hook-form, i18next, react-i18next, zustand, lucide-react, tanstack, etc.)
          // are NOT manually chunked to avoid loading order issues.
          // Vite will handle them correctly via automatic code splitting.
        },
        // Consistent chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // CSS code splitting
    cssCodeSplit: true,
    // Minification
    minify: 'esbuild',
  },
})
