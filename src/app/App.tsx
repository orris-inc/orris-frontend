/**
 * Main Application Component
 * React 19 + Radix Themes + React Router v7 + TanStack Query
 */

import { RouterProvider } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Theme } from '@radix-ui/themes';
import { Loader2 } from 'lucide-react';
import { router } from './router';
import { queryClient } from '@/shared/lib/query-client';
import { GlobalSnackbar } from '@/shared/components/GlobalSnackbar';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useAuthInitializer } from '@/features/auth/hooks/useAuthInitializer';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { NetworkStatusIndicator, ServiceWorkerUpdatePrompt } from '@/components/common/NetworkStatusIndicator';
import { DefaultResourceHints } from '@/components/common/ResourceHints';

export const App = () => {
  // Initialize auth state
  useAuthInitializer();

  // Get loading state
  const { isLoading } = useAuthStore();

  // Show loading indicator until auth state initialization completes
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        storageKey="orris-theme"
        disableTransitionOnChange
      >
        <Theme accentColor="indigo" grayColor="slate" radius="medium" scaling="100%">
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
        </Theme>
      </ThemeProvider>
    </ErrorBoundary>
  );
};
