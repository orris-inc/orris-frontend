import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

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
        // Manual chunk splitting strategy for optimal caching
        manualChunks: (id) => {
          // React core - shared by all pages
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-core'
          }

          // React Router
          if (id.includes('node_modules/react-router')) {
            return 'react-router'
          }

          // UI framework - Radix UI components
          if (id.includes('node_modules/@radix-ui/')) {
            return 'radix-ui'
          }

          // Charts library - lazy loaded with chart pages
          if (
            id.includes('node_modules/recharts/') ||
            id.includes('node_modules/d3-')
          ) {
            return 'charts'
          }

          // Animation library
          if (id.includes('node_modules/framer-motion/')) {
            return 'animations'
          }

          // TanStack libraries
          if (id.includes('node_modules/@tanstack/')) {
            return 'tanstack'
          }

          // Form handling
          if (
            id.includes('node_modules/react-hook-form/') ||
            id.includes('node_modules/@hookform/') ||
            id.includes('node_modules/zod/')
          ) {
            return 'forms'
          }

          // i18n
          if (
            id.includes('node_modules/i18next') ||
            id.includes('node_modules/react-i18next')
          ) {
            return 'i18n'
          }

          // State management
          if (id.includes('node_modules/zustand/')) {
            return 'state'
          }

          // HTTP client
          if (id.includes('node_modules/axios/')) {
            return 'http'
          }

          // Icons
          if (id.includes('node_modules/lucide-react/')) {
            return 'icons'
          }

          // Utilities
          if (
            id.includes('node_modules/clsx/') ||
            id.includes('node_modules/tailwind-merge/') ||
            id.includes('node_modules/class-variance-authority/')
          ) {
            return 'utils'
          }
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
