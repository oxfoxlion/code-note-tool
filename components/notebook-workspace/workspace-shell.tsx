"use client";

import {
  BookOpen,
  Braces,
  ChevronDown,
  CircleAlert,
  FileText,
  Folder,
  Loader2,
  NotebookTabs,
  PanelBottom,
  Plus,
  RefreshCw,
  Terminal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNotebookWorkspace } from "@/hooks/use-notebook-workspace";
import { ApiError } from "@/lib/code-notebook/api-client";
import type { Chapter, Lesson, LessonSummary, Notebook, NotebookTree, UUID } from "@/lib/code-notebook/types";
import { cn } from "@/lib/utils";

type WorkspaceState = ReturnType<typeof useNotebookWorkspace>;

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
  onRefresh,
  isRefreshing,
}: {
  notebooks: Notebook[];
  selectedNotebookId: UUID | null;
  onSelectNotebook: (notebookId: UUID) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <div className="flex h-12 items-center justify-between border-b bg-background px-3">
      <div className="flex min-w-0 items-center gap-2">
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
      </TooltipProvider>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
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
  onRetry,
}: {
  tree: NotebookTree | null;
  isLoading: boolean;
  error: unknown;
  selectedLessonId: UUID | null;
  onSelectLesson: (lessonId: UUID) => void;
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
        description="下一階段會加入建立章節與 lesson 的操作。"
      />
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-3">
        {tree.chapters.map((chapter) => (
          <ChapterNode
            key={chapter.id}
            chapter={chapter}
            selectedLessonId={selectedLessonId}
            onSelectLesson={onSelectLesson}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

function ChapterNode({
  chapter,
  selectedLessonId,
  onSelectLesson,
}: {
  chapter: Chapter;
  selectedLessonId: UUID | null;
  onSelectLesson: (lessonId: UUID) => void;
}) {
  const lessons = chapter.lessons ?? [];

  return (
    <section className="space-y-1">
      <div className="flex min-h-8 items-center gap-2 rounded-md px-2 text-sm font-medium">
        <Folder className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 truncate">{chapter.title}</span>
        <Badge variant="outline" className="ml-auto">
          {lessons.length}
        </Badge>
      </div>
      <div className="space-y-1 pl-3">
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

function DesktopWorkspace(state: WorkspaceState) {
  return (
    <ResizablePanelGroup orientation="horizontal" className="hidden min-h-0 flex-1 md:flex">
      <ResizablePanel defaultSize={22} minSize={16} maxSize={32}>
        <TreePanel
          tree={state.tree}
          isLoading={state.treeQuery.isLoading}
          error={state.treeQuery.error}
          selectedLessonId={state.selectedLessonId}
          onSelectLesson={state.setSelectedLessonId}
          onRetry={() => state.treeQuery.refetch()}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={38} minSize={24}>
        <ArticlePanel
          lesson={state.lesson}
          isLoading={state.lessonQuery.isLoading}
          error={state.lessonQuery.error}
          onRetry={() => state.lessonQuery.refetch()}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={40} minSize={24}>
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
  );
}

function MobileWorkspace(state: WorkspaceState) {
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
  const isInitialLoading = state.notebooksQuery.isLoading;
  const isRefreshing =
    state.notebooksQuery.isFetching || state.treeQuery.isFetching || state.lessonQuery.isFetching;

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
      <div className="flex min-h-0 flex-1 flex-col">
        <WorkspaceToolbar
          notebooks={state.notebooks}
          selectedNotebookId={state.selectedNotebookId}
          onSelectNotebook={state.setSelectedNotebookId}
          onRefresh={() => state.notebooksQuery.refetch()}
          isRefreshing={isRefreshing}
        />
        <EmptyState
          icon={Plus}
          title="還沒有筆記本"
          description="資料串接已就緒。下一階段會加入建立筆記本的操作。"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <WorkspaceToolbar
        notebooks={state.notebooks}
        selectedNotebookId={state.selectedNotebookId}
        onSelectNotebook={(notebookId) => {
          state.setSelectedNotebookId(notebookId);
          state.setSelectedLessonId(null);
        }}
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
      <DesktopWorkspace {...state} />
      <MobileWorkspace {...state} />
    </div>
  );
}
