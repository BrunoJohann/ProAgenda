'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';
import { getApiClient } from '@proagenda/api-client';
import { useCustomerAuthStore } from '@/lib/store/customer-auth-store';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const { accessToken, refreshToken, setTokens, clearAuth } = useCustomerAuthStore();

  // Initialize API client with tokens
  useEffect(() => {
    const apiClient = getApiClient();
    if (accessToken && refreshToken) {
      apiClient.setTokens(accessToken, refreshToken);
    } else {
      apiClient.clearAuth();
    }
  }, [accessToken, refreshToken]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}


