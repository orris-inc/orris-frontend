/**
 * Main Application Component
 * React 19 + React Router v7 + TanStack Query
 */

import { RouterProvider } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { router } from './router';
import { queryClient } from '@/shared/lib/query-client';
import { GlobalSnackbar } from '@/shared/components/GlobalSnackbar';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useAuthInitializer } from '@/features/auth/hooks/useAuthInitializer';
import { NetworkStatusIndicator, ServiceWorkerUpdatePrompt } from '@/components/common/NetworkStatusIndicator';
import { DefaultResourceHints } from '@/components/common/ResourceHints';

export const App = () => {
  // Kick off auth state initialization. Routes are not gated on it: public
  // routes render immediately, while ProtectedRoute/AdminRoute show their own
  // loader until the session check resolves.
  useAuthInitializer();

  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        storageKey="orris-theme"
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          {/* Resource hints for performance optimization */}
          <DefaultResourceHints />

          <RouterProvider router={router} />
          <GlobalSnackbar />

          {/* Network status indicator for offline/online notifications */}
          <NetworkStatusIndicator position="top" />

          {/* Service worker update prompt */}
          <ServiceWorkerUpdatePrompt />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};
