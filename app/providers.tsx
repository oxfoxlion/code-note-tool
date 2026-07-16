"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

import { Toaster } from "@/components/ui/sonner";
import { codeNotebookQueryKeys } from "@/lib/code-notebook/query-keys";
import { isUnauthorizedError } from "@/lib/code-notebook/errors";

function shouldRetryQuery(failureCount: number, error: Error) {
  if (isUnauthorizedError(error)) {
    return false;
  }

  return failureCount < 2;
}

function handleUnauthorizedError(error: unknown, queryClient: QueryClient) {
  if (!isUnauthorizedError(error)) {
    return;
  }

  queryClient.removeQueries({ queryKey: codeNotebookQueryKeys.auth.me });

  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => {
      // eslint-disable-next-line prefer-const
      let client: QueryClient;
      const queryCache = new QueryCache({
        onError: (error) => handleUnauthorizedError(error, client),
      });
      const mutationCache = new MutationCache({
        onError: (error) => handleUnauthorizedError(error, client),
      });

      client = new QueryClient({
        queryCache,
        mutationCache,
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: shouldRetryQuery,
          },
        },
      });

      return client;
    }
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
