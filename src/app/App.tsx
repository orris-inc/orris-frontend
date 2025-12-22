/**
 * 主应用组件
 * React 19 + Radix UI + Tailwind + React Router v7 + TanStack Query
 */

import { RouterProvider } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { router } from './router';
import { queryClient } from '@/shared/lib/query-client';
import { GlobalSnackbar } from '@/shared/components/GlobalSnackbar';
import { useAuthInitializer } from '@/features/auth/hooks/useAuthInitializer';
import { useAuthStore } from '@/features/auth/stores/auth-store';

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
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <GlobalSnackbar />
    </QueryClientProvider>
  );
};
