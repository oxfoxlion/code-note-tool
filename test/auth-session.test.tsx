import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useAuthSession } from "@/hooks/use-auth-session";
import { server } from "./msw-server";

const navigationMock = vi.hoisted(() => ({
  pathname: "/",
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
  useRouter: () => ({
    replace: navigationMock.replace,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useAuthSession", () => {
  it("redirects to login when /auth/me returns 401", async () => {
    navigationMock.pathname = "/";
    navigationMock.replace.mockClear();
    server.use(
      http.get("http://localhost:3001/auth/me", () =>
        HttpResponse.json({ message: "尚未登入" }, { status: 401 }),
      ),
    );

    renderHook(() => useAuthSession(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(navigationMock.replace).toHaveBeenCalledWith("/login");
    });
  });
});
