"use client";

import {
  AlertTriangle,
  BookOpen,
  Braces,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  FileText,
  Folder,
  Loader2,
  NotebookTabs,
  PanelBottom,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  RefreshCw,
  Terminal,
  Trash2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNotebookWorkspace } from "@/hooks/use-notebook-workspace";
import { ApiError, codeNotebookApi } from "@/lib/code-notebook/api-client";
import { codeNotebookQueryKeys } from "@/lib/code-notebook/query-keys";
import type {
  Chapter,
  CreateNotebookInput,
  Lesson,
  LessonSummary,
  Notebook,
  NotebookTree,
  UpdateChapterInput,
  UpdateNotebookInput,
  UUID,
} from "@/lib/code-notebook/types";
import { cn } from "@/lib/utils";

type WorkspaceState = ReturnType<typeof useNotebookWorkspace>;
type WorkspaceTreeActions = {
  onCreateChapter: () => void;
  onRenameChapter: (chapter: Chapter) => void;
  onToggleChapter: (chapter: Chapter) => void;
  onDeleteChapter: (chapter: Chapter) => void;
};
type WorkspaceViewState = WorkspaceState & WorkspaceTreeActions;
type WorkspaceLayoutState = WorkspaceViewState & {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};
type ChapterTitleInput = { title: string };

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function getNotebookTitle(notebooks: Notebook[], selectedNotebookId: UUID | null) {
  return notebooks.find((notebook) => notebook.id === selectedNotebookId)?.title ?? "尚未選擇筆記本";
}

function WorkspaceToolbar({
  notebooks,
  selectedNotebookId,
  onSelectNotebook,
  onCreateNotebook,
  onEditNotebook,
  onDeleteNotebook,
  isSidebarCollapsed,
  onToggleSidebar,
  onRefresh,
  isRefreshing,
}: {
  notebooks: Notebook[];
  selectedNotebookId: UUID | null;
  onSelectNotebook: (notebookId: UUID) => void;
  onCreateNotebook: () => void;
  onEditNotebook: () => void;
  onDeleteNotebook: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const hasSelectedNotebook = selectedNotebookId !== null;

  return (
    <div className="flex min-h-12 items-center justify-between gap-2 border-b bg-background px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onToggleSidebar}
                  className="hidden md:inline-flex"
                  aria-label={isSidebarCollapsed ? "展開側邊欄" : "收合側邊欄"}
                >
                  {isSidebarCollapsed ? (
                    <PanelLeftOpen className="size-4" />
                  ) : (
                    <PanelLeftClose className="size-4" />
                  )}
                </Button>
              }
            />
            <TooltipContent>
              {isSidebarCollapsed ? "展開側邊欄" : "收合側邊欄"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <NotebookTabs className="size-4 shrink-0 text-muted-foreground" />
        <select
          value={selectedNotebookId ?? ""}
          onChange={(event) => onSelectNotebook(event.target.value)}
          className="h-8 max-w-[240px] rounded-md border bg-background px-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="選擇筆記本"
          disabled={notebooks.length === 0}
        >
          {notebooks.length === 0 ? (
            <option value="">沒有筆記本</option>
          ) : (
            notebooks.map((notebook) => (
              <option key={notebook.id} value={notebook.id}>
                {notebook.title}
              </option>
            ))
          )}
        </select>
        <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
      </div>
      <TooltipProvider>
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onCreateNotebook}
                  aria-label="新增筆記本"
                >
                  <Plus className="size-4" />
                </Button>
              }
            />
            <TooltipContent>新增筆記本</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onEditNotebook}
                  disabled={!hasSelectedNotebook}
                  aria-label="編輯筆記本"
                >
                  <Pencil className="size-4" />
                </Button>
              }
            />
            <TooltipContent>編輯筆記本</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onDeleteNotebook}
                  disabled={!hasSelectedNotebook}
                  aria-label="刪除筆記本"
                >
                  <Trash2 className="size-4" />
                </Button>
              }
            />
            <TooltipContent>刪除筆記本</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="mx-1 h-5" />
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  aria-label="重新整理工作區"
                >
                  {isRefreshing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                </Button>
              }
            />
            <TooltipContent>重新整理工作區</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}

function NotebookDialog({
  mode,
  notebook,
  open,
  isSubmitting,
  error,
  onOpenChange,
  onSubmit,
}: {
  mode: "create" | "edit";
  notebook: Notebook | null;
  open: boolean;
  isSubmitting: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateNotebookInput | UpdateNotebookInput) => void;
}) {
  const dialogTitle = mode === "create" ? "新增筆記本" : "編輯筆記本";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <NotebookDialogForm
          key={`${mode}-${notebook?.id ?? "new"}`}
          dialogTitle={dialogTitle}
          mode={mode}
          notebook={notebook}
          isSubmitting={isSubmitting}
          error={error}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  );
}

function NotebookDialogForm({
  dialogTitle,
  mode,
  notebook,
  isSubmitting,
  error,
  onOpenChange,
  onSubmit,
}: {
  dialogTitle: string;
  mode: "create" | "edit";
  notebook: Notebook | null;
  isSubmitting: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateNotebookInput | UpdateNotebookInput) => void;
}) {
  const [title, setTitle] = useState(() =>
    mode === "edit" && notebook ? notebook.title : "",
  );
  const [description, setDescription] = useState(() =>
    mode === "edit" && notebook ? notebook.description ?? "" : "",
  );
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogDescription>
          筆記本用來整理章節與 lesson，描述可留空。
        </DialogDescription>
      </DialogHeader>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const normalizedTitle = title.trim();

          if (!normalizedTitle) {
            setLocalError("請輸入筆記本名稱。");
            return;
          }

          setLocalError(null);
          onSubmit({
            title: normalizedTitle,
            description: description.trim() || null,
          });
        }}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="notebook-title">
            名稱
          </label>
          <Input
            id="notebook-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：JavaScript 基礎"
            aria-invalid={Boolean(localError || error)}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="notebook-description">
            描述
          </label>
          <Textarea
            id="notebook-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="可選填"
            disabled={isSubmitting}
          />
        </div>
        {localError || error ? (
          <p className="text-sm text-destructive" role="alert">
            {localError ?? error}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "create" ? "建立" : "儲存"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function DeleteNotebookDialog({
  notebook,
  open,
  isDeleting,
  error,
  onOpenChange,
  onConfirm,
}: {
  notebook: Notebook | null;
  open: boolean;
  isDeleting: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <AlertTriangle className="size-5 text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>刪除筆記本</AlertDialogTitle>
          <AlertDialogDescription>
            {notebook
              ? `確定要刪除「${notebook.title}」嗎？這會一併移除其中的章節與 lesson。`
              : "確定要刪除這本筆記本嗎？"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
            刪除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ChapterDialog({
  mode,
  chapter,
  open,
  isSubmitting,
  error,
  onOpenChange,
  onSubmit,
}: {
  mode: "create" | "edit";
  chapter: Chapter | null;
  open: boolean;
  isSubmitting: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ChapterTitleInput) => void;
}) {
  const dialogTitle = mode === "create" ? "新增章節" : "重新命名章節";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <ChapterDialogForm
          key={`${mode}-${chapter?.id ?? "new"}`}
          dialogTitle={dialogTitle}
          mode={mode}
          chapter={chapter}
          isSubmitting={isSubmitting}
          error={error}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  );
}

function ChapterDialogForm({
  dialogTitle,
  mode,
  chapter,
  isSubmitting,
  error,
  onOpenChange,
  onSubmit,
}: {
  dialogTitle: string;
  mode: "create" | "edit";
  chapter: Chapter | null;
  isSubmitting: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ChapterTitleInput) => void;
}) {
  const [title, setTitle] = useState(() =>
    mode === "edit" && chapter ? chapter.title : "",
  );
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogDescription>
          章節會顯示在左側目錄中，用來分組 lesson。
        </DialogDescription>
      </DialogHeader>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const normalizedTitle = title.trim();

          if (!normalizedTitle) {
            setLocalError("請輸入章節名稱。");
            return;
          }

          setLocalError(null);
          onSubmit({ title: normalizedTitle });
        }}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="chapter-title">
            名稱
          </label>
          <Input
            id="chapter-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：第一章 基礎"
            aria-invalid={Boolean(localError || error)}
            disabled={isSubmitting}
          />
        </div>
        {localError || error ? (
          <p className="text-sm text-destructive" role="alert">
            {localError ?? error}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "create" ? "建立" : "儲存"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function DeleteChapterDialog({
  chapter,
  open,
  isDeleting,
  error,
  onOpenChange,
  onConfirm,
}: {
  chapter: Chapter | null;
  open: boolean;
  isDeleting: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const lessonCount = chapter?.lessons?.length ?? 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <AlertTriangle className="size-5 text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>刪除章節</AlertDialogTitle>
          <AlertDialogDescription>
            {chapter
              ? `確定要刪除「${chapter.title}」嗎？這會一併移除其中 ${lessonCount} 個 lesson。`
              : "確定要刪除這個章節嗎？"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
            刪除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-48 items-center justify-center px-6 text-center">
      <div className="max-w-sm space-y-3">
        <div className="mx-auto flex size-10 items-center justify-center rounded-md border bg-muted">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
    </div>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full min-h-48 items-center justify-center px-6 text-center">
      <div className="max-w-sm space-y-3">
        <CircleAlert className="mx-auto size-8 text-destructive" />
        <p className="text-sm leading-6 text-muted-foreground">{message}</p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" />
          重試
        </Button>
      </div>
    </div>
  );
}

function TreePanel({
  tree,
  isLoading,
  error,
  selectedLessonId,
  onSelectLesson,
  onCreateChapter,
  onRenameChapter,
  onToggleChapter,
  onDeleteChapter,
  onRetry,
}: {
  tree: NotebookTree | null;
  isLoading: boolean;
  error: unknown;
  selectedLessonId: UUID | null;
  onSelectLesson: (lessonId: UUID) => void;
  onCreateChapter: () => void;
  onRenameChapter: (chapter: Chapter) => void;
  onToggleChapter: (chapter: Chapter) => void;
  onDeleteChapter: (chapter: Chapter) => void;
  onRetry: () => void;
}) {
  if (isLoading) {
    return <LoadingPanel label="正在載入章節" />;
  }

  if (error) {
    return (
      <ErrorPanel
        message={getErrorMessage(error, "章節載入失敗")}
        onRetry={onRetry}
      />
    );
  }

  if (!tree) {
    return (
      <EmptyState
        icon={BookOpen}
        title="尚未選擇筆記本"
        description="選擇筆記本後會在這裡顯示章節與 lesson。"
      />
    );
  }

  if (tree.chapters.length === 0) {
    return (
      <EmptyState
        icon={Folder}
        title="這本筆記本還沒有章節"
        description="先建立第一個章節，再把 lesson 放進章節底下。"
        action={
          <Button type="button" size="sm" onClick={onCreateChapter}>
            <Plus className="size-4" />
            新增章節
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-10 shrink-0 items-center justify-between border-b px-3">
        <span className="text-xs font-medium uppercase text-muted-foreground">Chapters</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onCreateChapter}
                  aria-label="新增章節"
                >
                  <Plus className="size-4" />
                </Button>
              }
            />
            <TooltipContent>新增章節</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 p-3">
          {tree.chapters.map((chapter) => (
            <ChapterNode
              key={chapter.id}
              chapter={chapter}
              selectedLessonId={selectedLessonId}
              onSelectLesson={onSelectLesson}
              onRenameChapter={onRenameChapter}
              onToggleChapter={onToggleChapter}
              onDeleteChapter={onDeleteChapter}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function ChapterNode({
  chapter,
  selectedLessonId,
  onSelectLesson,
  onRenameChapter,
  onToggleChapter,
  onDeleteChapter,
}: {
  chapter: Chapter;
  selectedLessonId: UUID | null;
  onSelectLesson: (lessonId: UUID) => void;
  onRenameChapter: (chapter: Chapter) => void;
  onToggleChapter: (chapter: Chapter) => void;
  onDeleteChapter: (chapter: Chapter) => void;
}) {
  const lessons = chapter.lessons ?? [];

  return (
    <section className="space-y-1">
      <div className="group flex min-h-8 items-center gap-1 rounded-md px-1 text-sm font-medium hover:bg-muted/60">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onToggleChapter(chapter)}
          aria-label={chapter.isCollapsed ? "展開章節" : "收合章節"}
        >
          {chapter.isCollapsed ? (
            <ChevronRight className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </Button>
        <Folder className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">{chapter.title}</span>
        <Badge variant="outline" className="shrink-0">
          {lessons.length}
        </Badge>
        <div className="ml-1 flex shrink-0 items-center gap-0.5 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="新增 lesson"
                    disabled
                  >
                    <Plus className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent>新增 lesson 會在下一階段接上</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onRenameChapter(chapter)}
                    aria-label="重新命名章節"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent>重新命名章節</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onDeleteChapter(chapter)}
                    aria-label="刪除章節"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent>刪除章節</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {chapter.isCollapsed ? null : (
        <div className="space-y-1 pl-6">
          {lessons.length === 0 ? (
            <p className="px-2 py-1 text-xs text-muted-foreground">尚無 lesson</p>
          ) : (
            lessons.map((lesson) => (
              <LessonButton
                key={lesson.id}
                lesson={lesson}
                isSelected={lesson.id === selectedLessonId}
                onSelectLesson={onSelectLesson}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
}

function LessonButton({
  lesson,
  isSelected,
  onSelectLesson,
}: {
  lesson: LessonSummary;
  isSelected: boolean;
  onSelectLesson: (lessonId: UUID) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelectLesson(lesson.id)}
      className={cn(
        "flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors hover:bg-accent",
        isSelected && "bg-accent text-accent-foreground",
      )}
    >
      <FileText className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{lesson.codeLanguage}</span>
    </button>
  );
}

function PanelHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof BookOpen;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex h-11 items-center gap-2 border-b px-3">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <h2 className="truncate text-sm font-medium">{title}</h2>
        {description ? (
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function ArticlePanel({
  lesson,
  isLoading,
  error,
  onRetry,
}: {
  lesson: Lesson | null;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col">
      <PanelHeader icon={FileText} title="Article" description="Markdown 預覽骨架" />
      <div className="min-h-0 flex-1">
        {isLoading ? (
          <LoadingPanel label="正在載入 lesson" />
        ) : error ? (
          <ErrorPanel
            message={getErrorMessage(error, "Lesson 載入失敗")}
            onRetry={onRetry}
          />
        ) : lesson ? (
          <ScrollArea className="h-full">
            <article className="space-y-4 p-4">
              <div>
                <h1 className="text-xl font-semibold tracking-normal">{lesson.title}</h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  Markdown editor 會在後續階段接上，這裡先顯示目前內容。
                </p>
              </div>
              <Separator />
              <pre className="whitespace-pre-wrap rounded-md border bg-muted p-3 text-sm leading-6">
                {lesson.markdownContent || "這個 lesson 還沒有 Markdown 內容。"}
              </pre>
            </article>
          </ScrollArea>
        ) : (
          <EmptyState
            icon={FileText}
            title="尚未選擇 lesson"
            description="從左側章節樹選擇 lesson 後會顯示文章內容。"
          />
        )}
      </div>
    </section>
  );
}

function CodePanel({ lesson }: { lesson: Lesson | null }) {
  return (
    <section className="flex h-full min-h-0 flex-col">
      <PanelHeader
        icon={Braces}
        title="Code"
        description={lesson ? `${lesson.codeLanguage} / ${lesson.runtime}` : "JavaScript editor 骨架"}
      />
      <div className="min-h-0 flex-1">
        {lesson ? (
          <ScrollArea className="h-full">
            <pre className="min-h-full whitespace-pre-wrap bg-zinc-950 p-4 font-mono text-sm leading-6 text-zinc-100">
              {lesson.codeContent || "// 這個 lesson 還沒有程式碼。"}
            </pre>
          </ScrollArea>
        ) : (
          <EmptyState
            icon={Braces}
            title="沒有程式碼內容"
            description="選取 lesson 後，後續會在這裡接上 CodeMirror JavaScript editor。"
          />
        )}
      </div>
    </section>
  );
}

function OutputPanel({ lesson }: { lesson: Lesson | null }) {
  return (
    <section className="flex h-full min-h-0 flex-col">
      <PanelHeader icon={Terminal} title="Output" description="執行結果骨架" />
      <div className="min-h-0 flex-1">
        {lesson ? (
          <ScrollArea className="h-full">
            <pre className="min-h-full whitespace-pre-wrap bg-zinc-950 p-4 font-mono text-sm leading-6 text-zinc-100">
              {lesson.outputContent || "尚無輸出。"}
            </pre>
          </ScrollArea>
        ) : (
          <EmptyState
            icon={Terminal}
            title="尚無輸出"
            description="JavaScript runner 會在後續階段接上。"
          />
        )}
      </div>
    </section>
  );
}

function DesktopSidebarRail({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <aside className="hidden w-12 shrink-0 flex-col items-center border-r bg-background py-2 md:flex">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onToggleSidebar}
                aria-label="展開側邊欄"
              >
                <PanelLeftOpen className="size-4" />
              </Button>
            }
          />
          <TooltipContent side="right">展開側邊欄</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="mt-2 flex size-8 items-center justify-center rounded-md border bg-muted">
        <Folder className="size-4 text-muted-foreground" />
      </div>
    </aside>
  );
}

function DesktopWorkspace(state: WorkspaceLayoutState) {
  return (
    <div className="hidden min-h-0 flex-1 overflow-hidden md:flex">
      {state.isSidebarCollapsed ? (
        <DesktopSidebarRail onToggleSidebar={state.onToggleSidebar} />
      ) : (
        <aside className="flex w-[340px] shrink-0 flex-col border-r bg-background">
          <TreePanel
            tree={state.tree}
            isLoading={state.treeQuery.isLoading}
            error={state.treeQuery.error}
            selectedLessonId={state.selectedLessonId}
            onSelectLesson={state.setSelectedLessonId}
            onCreateChapter={state.onCreateChapter}
            onRenameChapter={state.onRenameChapter}
            onToggleChapter={state.onToggleChapter}
            onDeleteChapter={state.onDeleteChapter}
            onRetry={() => state.treeQuery.refetch()}
          />
        </aside>
      )}
      <ResizablePanelGroup orientation="horizontal" className="min-w-0 flex-1 overflow-hidden">
        <ResizablePanel defaultSize={52} minSize={32}>
          <ArticlePanel
            lesson={state.lesson}
            isLoading={state.lessonQuery.isLoading}
            error={state.lessonQuery.error}
            onRetry={() => state.lessonQuery.refetch()}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={48} minSize={32}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={58} minSize={35}>
              <CodePanel lesson={state.lesson} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={42} minSize={24}>
              <OutputPanel lesson={state.lesson} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function MobileWorkspace(state: WorkspaceViewState) {
  return (
    <Tabs defaultValue="tree" className="min-h-0 flex-1 md:hidden">
      <TabsList className="mx-3 mt-3 grid h-9 w-auto grid-cols-4">
        <TabsTrigger value="tree">
          <Folder className="size-4" />
          Tree
        </TabsTrigger>
        <TabsTrigger value="article">
          <FileText className="size-4" />
          Article
        </TabsTrigger>
        <TabsTrigger value="code">
          <Braces className="size-4" />
          Code
        </TabsTrigger>
        <TabsTrigger value="output">
          <PanelBottom className="size-4" />
          Output
        </TabsTrigger>
      </TabsList>
      <TabsContent value="tree" className="min-h-0">
        <TreePanel
          tree={state.tree}
          isLoading={state.treeQuery.isLoading}
          error={state.treeQuery.error}
          selectedLessonId={state.selectedLessonId}
          onSelectLesson={state.setSelectedLessonId}
          onCreateChapter={state.onCreateChapter}
          onRenameChapter={state.onRenameChapter}
          onToggleChapter={state.onToggleChapter}
          onDeleteChapter={state.onDeleteChapter}
          onRetry={() => state.treeQuery.refetch()}
        />
      </TabsContent>
      <TabsContent value="article" className="min-h-0">
        <ArticlePanel
          lesson={state.lesson}
          isLoading={state.lessonQuery.isLoading}
          error={state.lessonQuery.error}
          onRetry={() => state.lessonQuery.refetch()}
        />
      </TabsContent>
      <TabsContent value="code" className="min-h-0">
        <CodePanel lesson={state.lesson} />
      </TabsContent>
      <TabsContent value="output" className="min-h-0">
        <OutputPanel lesson={state.lesson} />
      </TabsContent>
    </Tabs>
  );
}

export function WorkspaceShell() {
  const state = useNotebookWorkspace();
  const queryClient = useQueryClient();
  const [notebookDialogMode, setNotebookDialogMode] = useState<"create" | "edit">("create");
  const [isNotebookDialogOpen, setIsNotebookDialogOpen] = useState(false);
  const [isDeleteNotebookOpen, setIsDeleteNotebookOpen] = useState(false);
  const [chapterDialogMode, setChapterDialogMode] = useState<"create" | "edit">("create");
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [isDeleteChapterOpen, setIsDeleteChapterOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const selectedNotebook =
    state.notebooks.find((notebook) => notebook.id === state.selectedNotebookId) ?? null;
  const isInitialLoading = state.notebooksQuery.isLoading;
  const isRefreshing =
    state.notebooksQuery.isFetching || state.treeQuery.isFetching || state.lessonQuery.isFetching;
  const invalidateSelectedTree = () => {
    if (!state.selectedNotebookId) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: codeNotebookQueryKeys.notebooks.tree(state.selectedNotebookId),
    });
  };
  const createNotebookMutation = useMutation({
    mutationFn: codeNotebookApi.createNotebook,
    onSuccess: (data) => {
      state.setSelectedNotebookId(data.notebook.id);
      state.setSelectedLessonId(null);
      setIsNotebookDialogOpen(false);
      toast.success("筆記本已建立");
      void queryClient.invalidateQueries({
        queryKey: codeNotebookQueryKeys.notebooks.all,
      });
    },
  });
  const updateNotebookMutation = useMutation({
    mutationFn: ({
      notebookId,
      input,
    }: {
      notebookId: UUID;
      input: UpdateNotebookInput;
    }) => codeNotebookApi.updateNotebook(notebookId, input),
    onSuccess: (data) => {
      setIsNotebookDialogOpen(false);
      toast.success("筆記本已更新");
      void queryClient.invalidateQueries({
        queryKey: codeNotebookQueryKeys.notebooks.all,
      });
      void queryClient.invalidateQueries({
        queryKey: codeNotebookQueryKeys.notebooks.tree(data.notebook.id),
      });
    },
  });
  const deleteNotebookMutation = useMutation({
    mutationFn: codeNotebookApi.deleteNotebook,
    onSuccess: () => {
      state.setSelectedNotebookId(null);
      state.setSelectedLessonId(null);
      setIsDeleteNotebookOpen(false);
      toast.success("筆記本已刪除");
      void queryClient.invalidateQueries({
        queryKey: codeNotebookQueryKeys.notebooks.all,
      });
    },
  });
  const createChapterMutation = useMutation({
    mutationFn: codeNotebookApi.createChapter,
    onSuccess: () => {
      setIsChapterDialogOpen(false);
      setSelectedChapter(null);
      toast.success("章節已建立");
      invalidateSelectedTree();
    },
  });
  const updateChapterMutation = useMutation({
    mutationFn: ({
      chapterId,
      input,
    }: {
      chapterId: UUID;
      input: UpdateChapterInput;
    }) => codeNotebookApi.updateChapter(chapterId, input),
    onSuccess: () => {
      setIsChapterDialogOpen(false);
      setSelectedChapter(null);
      toast.success("章節已更新");
      invalidateSelectedTree();
    },
  });
  const toggleChapterMutation = useMutation({
    mutationFn: ({
      chapterId,
      isCollapsed,
    }: {
      chapterId: UUID;
      isCollapsed: boolean;
    }) => codeNotebookApi.updateChapter(chapterId, { isCollapsed }),
    onSuccess: () => {
      invalidateSelectedTree();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "章節收合狀態更新失敗"));
    },
  });
  const deleteChapterMutation = useMutation({
    mutationFn: codeNotebookApi.deleteChapter,
    onSuccess: () => {
      if (
        selectedChapter?.lessons?.some((lesson) => lesson.id === state.selectedLessonId)
      ) {
        state.setSelectedLessonId(null);
      }

      setIsDeleteChapterOpen(false);
      setSelectedChapter(null);
      toast.success("章節已刪除");
      invalidateSelectedTree();
    },
  });

  const notebookDialogError =
    getErrorMessage(createNotebookMutation.error, "") ||
    getErrorMessage(updateNotebookMutation.error, "") ||
    null;
  const deleteNotebookError = getErrorMessage(deleteNotebookMutation.error, "") || null;
  const isSubmittingNotebook =
    createNotebookMutation.isPending || updateNotebookMutation.isPending;
  const chapterDialogError =
    getErrorMessage(createChapterMutation.error, "") ||
    getErrorMessage(updateChapterMutation.error, "") ||
    null;
  const deleteChapterError = getErrorMessage(deleteChapterMutation.error, "") || null;
  const isSubmittingChapter =
    createChapterMutation.isPending || updateChapterMutation.isPending;
  const openCreateChapterDialog = () => {
    if (!state.selectedNotebookId) {
      return;
    }

    createChapterMutation.reset();
    updateChapterMutation.reset();
    setSelectedChapter(null);
    setChapterDialogMode("create");
    setIsChapterDialogOpen(true);
  };
  const openRenameChapterDialog = (chapter: Chapter) => {
    createChapterMutation.reset();
    updateChapterMutation.reset();
    setSelectedChapter(chapter);
    setChapterDialogMode("edit");
    setIsChapterDialogOpen(true);
  };
  const openDeleteChapterDialog = (chapter: Chapter) => {
    deleteChapterMutation.reset();
    setSelectedChapter(chapter);
    setIsDeleteChapterOpen(true);
  };
  const viewState: WorkspaceViewState = {
    ...state,
    onCreateChapter: openCreateChapterDialog,
    onRenameChapter: openRenameChapterDialog,
    onToggleChapter: (chapter) => {
      toggleChapterMutation.mutate({
        chapterId: chapter.id,
        isCollapsed: !chapter.isCollapsed,
      });
    },
    onDeleteChapter: openDeleteChapterDialog,
  };
  const layoutState: WorkspaceLayoutState = {
    ...viewState,
    isSidebarCollapsed,
    onToggleSidebar: () => setIsSidebarCollapsed((value) => !value),
  };

  if (isInitialLoading) {
    return <LoadingPanel label="正在載入工作區" />;
  }

  if (state.notebooksQuery.error) {
    return (
      <ErrorPanel
        message={getErrorMessage(state.notebooksQuery.error, "筆記本載入失敗")}
        onRetry={() => state.notebooksQuery.refetch()}
      />
    );
  }

  if (state.notebooks.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <WorkspaceToolbar
          notebooks={state.notebooks}
          selectedNotebookId={state.selectedNotebookId}
          onSelectNotebook={state.setSelectedNotebookId}
          onCreateNotebook={() => {
            createNotebookMutation.reset();
            updateNotebookMutation.reset();
            setNotebookDialogMode("create");
            setIsNotebookDialogOpen(true);
          }}
          onEditNotebook={() => {
            if (!selectedNotebook) {
              return;
            }

            createNotebookMutation.reset();
            updateNotebookMutation.reset();
            setNotebookDialogMode("edit");
            setIsNotebookDialogOpen(true);
          }}
          onDeleteNotebook={() => {
            if (!selectedNotebook) {
              return;
            }

            deleteNotebookMutation.reset();
            setIsDeleteNotebookOpen(true);
          }}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((value) => !value)}
          onRefresh={() => state.notebooksQuery.refetch()}
          isRefreshing={isRefreshing}
        />
        <EmptyState
          icon={Plus}
          title="還沒有筆記本"
          description="建立第一本筆記本後，就能開始整理章節與 lesson。"
        />
        <NotebookDialog
          mode={notebookDialogMode}
          notebook={selectedNotebook}
          open={isNotebookDialogOpen}
          isSubmitting={isSubmittingNotebook}
          error={notebookDialogError}
          onOpenChange={setIsNotebookDialogOpen}
          onSubmit={(input) => {
            if (notebookDialogMode === "create") {
              createNotebookMutation.mutate(input as CreateNotebookInput);
              return;
            }

            if (!selectedNotebook) {
              return;
            }

            updateNotebookMutation.mutate({
              notebookId: selectedNotebook.id,
              input,
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <WorkspaceToolbar
        notebooks={state.notebooks}
        selectedNotebookId={state.selectedNotebookId}
        onSelectNotebook={(notebookId) => {
          state.setSelectedNotebookId(notebookId);
          state.setSelectedLessonId(null);
        }}
        onCreateNotebook={() => {
          createNotebookMutation.reset();
          updateNotebookMutation.reset();
          setNotebookDialogMode("create");
          setIsNotebookDialogOpen(true);
        }}
        onEditNotebook={() => {
          if (!selectedNotebook) {
            return;
          }

          createNotebookMutation.reset();
          updateNotebookMutation.reset();
          setNotebookDialogMode("edit");
          setIsNotebookDialogOpen(true);
        }}
        onDeleteNotebook={() => {
          if (!selectedNotebook) {
            return;
          }

          deleteNotebookMutation.reset();
          setIsDeleteNotebookOpen(true);
        }}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((value) => !value)}
        onRefresh={() => {
          state.notebooksQuery.refetch();
          state.treeQuery.refetch();
          state.lessonQuery.refetch();
        }}
        isRefreshing={isRefreshing}
      />
      <div className="flex h-9 items-center gap-2 border-b px-3 text-xs text-muted-foreground">
        <BookOpen className="size-4" />
        <span className="min-w-0 truncate">
          {getNotebookTitle(state.notebooks, state.selectedNotebookId)}
        </span>
        {state.selectedLessonSummary ? (
          <>
            <span>/</span>
            <span className="min-w-0 truncate">{state.selectedLessonSummary.title}</span>
          </>
        ) : null}
      </div>
      <DesktopWorkspace {...layoutState} />
      <MobileWorkspace {...viewState} />
      <NotebookDialog
        mode={notebookDialogMode}
        notebook={selectedNotebook}
        open={isNotebookDialogOpen}
        isSubmitting={isSubmittingNotebook}
        error={notebookDialogError}
        onOpenChange={setIsNotebookDialogOpen}
        onSubmit={(input) => {
          if (notebookDialogMode === "create") {
            createNotebookMutation.mutate(input as CreateNotebookInput);
            return;
          }

          if (!selectedNotebook) {
            return;
          }

          updateNotebookMutation.mutate({
            notebookId: selectedNotebook.id,
            input,
          });
        }}
      />
      <DeleteNotebookDialog
        notebook={selectedNotebook}
        open={isDeleteNotebookOpen}
        isDeleting={deleteNotebookMutation.isPending}
        error={deleteNotebookError}
        onOpenChange={setIsDeleteNotebookOpen}
        onConfirm={() => {
          if (!selectedNotebook) {
            return;
          }

          deleteNotebookMutation.mutate(selectedNotebook.id);
        }}
      />
      <ChapterDialog
        mode={chapterDialogMode}
        chapter={selectedChapter}
        open={isChapterDialogOpen}
        isSubmitting={isSubmittingChapter}
        error={chapterDialogError}
        onOpenChange={setIsChapterDialogOpen}
        onSubmit={(input) => {
          if (chapterDialogMode === "create") {
            if (!state.selectedNotebookId) {
              return;
            }

            createChapterMutation.mutate({
              notebookId: state.selectedNotebookId,
              title: input.title,
            });
            return;
          }

          if (!selectedChapter) {
            return;
          }

          updateChapterMutation.mutate({
            chapterId: selectedChapter.id,
            input,
          });
        }}
      />
      <DeleteChapterDialog
        chapter={selectedChapter}
        open={isDeleteChapterOpen}
        isDeleting={deleteChapterMutation.isPending}
        error={deleteChapterError}
        onOpenChange={setIsDeleteChapterOpen}
        onConfirm={() => {
          if (!selectedChapter) {
            return;
          }

          deleteChapterMutation.mutate(selectedChapter.id);
        }}
      />
    </div>
  );
}
