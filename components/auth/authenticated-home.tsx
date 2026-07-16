"use client";

import { BookOpen, Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspaceShell } from "@/components/notebook-workspace/workspace-shell";
import {
  isUnauthorizedError,
  useAuthSession,
  useLogout,
} from "@/hooks/use-auth-session";
import { ApiConnectionError } from "@/lib/code-notebook/api-client";

export function AuthenticatedHome() {
  const { error, isLoading, user } = useAuthSession();
  const logout = useLogout();

  if (isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          正在確認登入狀態
        </div>
      </main>
    );
  }

  if (!user) {
    const message = isUnauthorizedError(error)
      ? "正在前往登入頁"
      : error instanceof ApiConnectionError
        ? error.message
        : "尚未登入";

    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-6">
        <p className="max-w-sm text-center text-sm leading-6 text-muted-foreground">
          {message}
        </p>
      </main>
    );
  }

  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4" />
          <span className="text-sm font-medium">Code Notebook</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          {logout.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          登出
        </Button>
      </header>
      <WorkspaceShell />
    </main>
  );
}
