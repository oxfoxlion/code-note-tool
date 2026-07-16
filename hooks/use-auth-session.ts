"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { authApi } from "@/lib/code-notebook/api-client";
import { getApiErrorMessage, isUnauthorizedError } from "@/lib/code-notebook/errors";
import { codeNotebookQueryKeys } from "@/lib/code-notebook/query-keys";

export function useAuthSession() {
  const pathname = usePathname();
  const router = useRouter();
  const sessionQuery = useQuery({
    queryKey: codeNotebookQueryKeys.auth.me,
    queryFn: authApi.me,
    retry: false,
  });

  useEffect(() => {
    if (
      isUnauthorizedError(sessionQuery.error) && pathname !== "/login"
    ) {
      router.replace("/login");
    }
  }, [pathname, router, sessionQuery.error]);

  return {
    ...sessionQuery,
    user: sessionQuery.data?.user ?? null,
  };
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: codeNotebookQueryKeys.auth.me });
      toast.success("已登出");
      router.replace("/login");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "登出失敗"));
    },
  });
}
